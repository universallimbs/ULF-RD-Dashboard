// Converts every STEP file in assets/cad/ into the lightweight mesh JSON the
// CAD tab renders (<name>.model.json), and writes assets/cad/manifest.json
// listing them newest-first. Run by .github/workflows/cad-convert.yml.
import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import occtimportjs from 'occt-import-js';

const CAD_DIR = 'assets/cad';
const STEP_RE = /\.(step|stp)$/i;
const MODEL_SUFFIX = '.model.json';

function meshNames(root) {
  const names = {};
  (function walk(node, inherited) {
    const label = node.name || inherited;
    (node.meshes || []).forEach(idx => { if (names[idx] === undefined) names[idx] = label; });
    (node.children || []).forEach(child => walk(child, label));
  })(root, '');
  return names;
}

// Coordinates are in mm; 4 decimals is far below anything visible and halves the file.
const round = arr => Array.from(arr, v => Math.round(v * 1e4) / 1e4);

const occt = await occtimportjs();
const entries = await readdir(CAD_DIR);
const stepFiles = entries.filter(f => STEP_RE.test(f)).sort();
const manifest = [];

for (const file of stepFiles) {
  const base = path.basename(file, path.extname(file));
  const bytes = new Uint8Array(await readFile(path.join(CAD_DIR, file)));
  const header = new TextDecoder().decode(bytes.subarray(0, 4000));
  const stamp = header.match(/FILE_NAME\s*\(\s*'[^']*'\s*,\s*'([^']*)'/);
  const exportedAt = stamp ? stamp[1] : '';

  const result = occt.ReadStepFile(bytes, null);
  if (!result.success || !result.meshes.length) throw new Error(`${file}: STEP import produced no geometry`);

  const names = meshNames(result.root);
  const bodies = result.meshes.map((mesh, i) => ({
    name: names[i] || mesh.name || `Body ${i + 1}`,
    color: mesh.color || null,
    position: round(mesh.attributes.position.array),
    normal: mesh.attributes.normal ? round(mesh.attributes.normal.array) : null,
    index: Array.from(mesh.index.array)
  }));

  const model = base + MODEL_SUFFIX;
  await writeFile(path.join(CAD_DIR, model), JSON.stringify({ source: file, exportedAt, bodies }));
  manifest.push({ name: base, source: file, model, exportedAt });
  console.log(`${file} -> ${model} (${bodies.length} bodies, exported ${exportedAt || 'unknown'})`);
}

// A model whose STEP file was deleted would otherwise linger and still be served.
const kept = new Set(manifest.map(m => m.model));
for (const f of entries) {
  if (f.endsWith(MODEL_SUFFIX) && !kept.has(f)) {
    await unlink(path.join(CAD_DIR, f));
    console.log(`removed stale ${f}`);
  }
}

manifest.sort((a, b) => b.exportedAt.localeCompare(a.exportedAt) || a.name.localeCompare(b.name));
await writeFile(path.join(CAD_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
