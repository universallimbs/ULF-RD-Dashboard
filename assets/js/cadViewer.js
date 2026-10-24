/* ULF R&D Dashboard — real CAD viewer for the "CAD" tab
 * =======================================================
 * Unlike assembly3d.js (an illustrative model built to document part codes),
 * this renders the actual SolidWorks design. STEP files dropped into
 * assets/cad/ are converted on push by .github/workflows/cad-convert.yml into
 * lightweight <name>.model.json meshes plus a manifest.json; this loads the
 * newest one. The STEP files are never fetched by the browser, so visitors
 * don't pay for a multi-megabyte in-browser STEP/WASM parser.
 *
 * The component names shown on hover come straight from the STEP file's own
 * assembly hierarchy (SolidWorks part names), not from ULF-DOC-001 part
 * codes — this early assembly only covers a few bodies, so mapping them onto
 * the Part Number Standard table would be fabricating a correspondence that
 * does not exist yet.
 */
(function () {
  'use strict';

  const CAD_DIR = 'assets/cad/';
  const PALETTE = [0x5b6b7a, 0x8a7a66, 0x6f7d6a, 0x7a6b8a, 0x8a8a6f];

  function boot() {
    const host = document.getElementById('cadViewer');
    if (!host || typeof THREE === 'undefined') return;
    if (host.dataset.ready) return;
    host.dataset.ready = '1';

    const tip = document.getElementById('cadViewerTip');
    const dateEl = document.getElementById('cadDate');
    const statusEl = document.getElementById('cadLoadStatus');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 2, 0.1, 4000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b8783, 0.5));
    const key  = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(16, 22, 26); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-22, 4, -16); scene.add(fill);

    const model = new THREE.Group();
    scene.add(model);

    // ---- orbit (same hand-rolled gestures as the Live tab's viewer) ----
    let radius = 50;
    const state = { az: 0.5, el: 0.3, dist: 130, px: 0, py: 0, idle: true, zoomed: false, fit: 130 };
    function place() {
      const d = state.dist, ce = Math.cos(state.el);
      camera.position.set(d * ce * Math.sin(state.az), d * Math.sin(state.el), d * ce * Math.cos(state.az));
      camera.lookAt(0, 0, 0);
    }
    const clampDist = d => Math.max(radius * 1.1, Math.min(radius * 6, d));
    function resetView() { state.az = 0.5; state.el = 0.3; state.zoomed = false; state.dist = state.fit; place(); }

    const pts = new Map();
    let pinch = 0;
    const centroid = () => { let x = 0, y = 0; pts.forEach(p => { x += p.x; y += p.y; }); return { x: x / pts.size, y: y / pts.size }; };
    const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    function rebase() { const c = centroid(); state.px = c.x; state.py = c.y; pinch = pts.size >= 2 ? spread() : 0; }
    const down = e => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); state.idle = false; rebase();
      try { host.setPointerCapture(e.pointerId); } catch (error) { /* pointer already gone */ }
    };
    const move = e => {
      if (!pts.has(e.pointerId)) { if (e.pointerType !== 'touch') hover(e); return; }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const c = centroid();
      state.az -= (c.x - state.px) * 0.008;
      state.el = Math.max(-1.2, Math.min(1.2, state.el + (c.y - state.py) * 0.006));
      state.px = c.x; state.py = c.y;
      if (pts.size >= 2) {
        const d = spread();
        if (pinch && d) { state.dist = clampDist(state.dist * pinch / d); state.zoomed = true; }
        pinch = d;
      }
      place();
    };
    const end = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size) rebase(); };
    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    host.addEventListener('lostpointercapture', end);
    host.addEventListener('dblclick', resetView);
    host.addEventListener('wheel', e => {
      e.preventDefault(); state.zoomed = true;
      state.dist = clampDist(state.dist + e.deltaY * 0.05); place();
    }, { passive: false });
    host.tabIndex = 0;
    host.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key];
      if (!k) return;
      e.preventDefault(); state.idle = false;
      state.az += k[0]; state.el = Math.max(-1.2, Math.min(1.2, state.el + k[1])); place();
    });

    // ---- hover picking, by component name (not a ULF part code) ----
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let current = null;
    function clearHighlight() {
      model.traverse(o => {
        if (!o.isMesh || o.userData.base === undefined) return;
        o.material.color.setHex(o.userData.base);
        o.material.opacity = 1; o.material.transparent = false;
      });
    }
    function hover(e, clear) {
      const r = host.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(model.children, true)[0];
      const name = !clear && hit && hit.object.userData.name;
      if (name === current) return;
      current = name || null;
      model.traverse(o => {
        if (!o.isMesh) return;
        if (!o.userData.base) o.userData.base = o.material.color.getHex();
        const on = current && o.userData.name === current;
        o.material.color.setHex(on ? 0xf97316 : o.userData.base);
        o.material.opacity = current && !on ? 0.28 : 1;
        o.material.transparent = !!(current && !on);
      });
      if (!tip) return;
      if (!current) { tip.classList.remove('show'); return; }
      tip.textContent = current;
      tip.classList.add('show');
      tip.style.left = (e.clientX - r.left) + 'px';
      tip.style.top = (e.clientY - r.top) + 'px';
    }
    host.addEventListener('pointerleave', e => {
      if (e.pointerType === 'touch') return;
      current = null; clearHighlight();
      if (tip) tip.classList.remove('show');
    });

    let span = null;
    function resize() {
      const w = host.clientWidth, h = host.clientHeight || Math.round(w * 0.42);
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
      if (span) {
        // Fit the model's height and its widest footprint under rotation (the
        // XZ diagonal) to the box, rather than a bounding sphere, which left
        // a tall model small in the wide 21:9 viewer.
        const vHalf = Math.tan(camera.fov * Math.PI / 360);
        const hHalf = vHalf * camera.aspect;
        state.fit = Math.max((span.y / 2) / vHalf, (Math.hypot(span.x, span.z) / 2) / hHalf) * 1.35;
        if (!state.zoomed) state.dist = state.fit;
      }
      if (!state.zoomed) place();
    }
    let resizePending = false;
    new ResizeObserver(() => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => { resizePending = false; resize(); });
    }).observe(host);
    resize(); place();

    const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function loop() {
      requestAnimationFrame(loop);
      if (state.idle && !slow) { state.az += 0.0015; place(); }
      renderer.render(scene, camera);
    })();

    // ---- load the precomputed mesh data ----
    function buildFromModel(data) {
      if (!data.bodies || !data.bodies.length) throw new Error('The CAD model has no bodies.');
      data.bodies.forEach((body, i) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(body.position, 3));
        if (body.normal) geo.setAttribute('normal', new THREE.Float32BufferAttribute(body.normal, 3));
        geo.setIndex(body.index);
        if (!body.normal) geo.computeVertexNormals();
        const color = body.color
          ? new THREE.Color(body.color[0], body.color[1], body.color[2])
          : new THREE.Color(PALETTE[i % PALETTE.length]);
        const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.22 });
        const obj = new THREE.Mesh(geo, material);
        obj.userData.name = body.name || ('Body ' + (i + 1));
        model.add(obj);
      });

      const box = new THREE.Box3().setFromObject(model);
      const centre = box.getCenter(new THREE.Vector3());
      model.position.sub(centre);
      span = box.getSize(new THREE.Vector3());
      radius = Math.max(1, span.length() / 2);
      resize();
      host.classList.add('ready');
      if (statusEl) statusEl.textContent = '';
      if (dateEl) dateEl.textContent = data.exportedAt ? data.exportedAt.slice(0, 10) : '—';
    }

    const getJson = url => fetch(url).then(r => {
      if (!r.ok) throw new Error(url + ' not found (HTTP ' + r.status + ').');
      return r.json();
    });
    // manifest.json is regenerated by the cad-convert workflow, newest export first
    getJson(CAD_DIR + 'manifest.json')
      .then(list => {
        if (!list.length) throw new Error('no converted models in assets/cad/.');
        return getJson(CAD_DIR + list[0].model);
      })
      .then(buildFromModel)
      .catch(error => {
        if (statusEl) statusEl.textContent = 'Could not load the CAD model: ' + error.message;
        console.error('CAD viewer:', error);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
