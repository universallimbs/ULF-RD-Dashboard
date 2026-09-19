/* ULF transradial assembly — procedural 3D model + viewer
 * ========================================================
 * Phase 0 deliverable: the model itself.
 *
 * The geometry is authored here rather than imported. Two reasons:
 *   1. No CAD export exists yet.
 *   2. The Thingiverse references are third-party designs whose licences could
 *      not be verified (the pages sit behind a Cloudflare challenge). Copying
 *      their geometry would carry unknown BY-NC-SA obligations. Everything
 *      below is built from the standard anatomy of a body-powered transradial
 *      prosthesis, which is not anyone's IP.
 *
 * Every part is a named THREE.Mesh whose name is its three-letter category code
 * from ULF-DOC-001 Rev A §3, so hover picking maps straight onto part numbers.
 * When a real CAD export arrives, replace buildAssembly() with a GLTF load and
 * keep the rest — as long as the exported meshes carry the same names.
 *
 * Units: 1 unit = 1 cm. The assembly runs ~45 cm, cuff to fingertip.
 */
(function () {
  'use strict';

  const CODES = ['HRN','BIC','LNR','STR','ELB','SKT','FST','FRM','HSG','CBL','WRS','PLM','THM','IND','MID','RNG','LTL'];

  // ---------------------------------------------------------------- materials
  function materials(THREE) {
    const shell = new THREE.MeshStandardMaterial({ color: 0x1e2225, roughness: 0.5,  metalness: 0.28 });
    return {
      shell,
      shellLight: new THREE.MeshStandardMaterial({ color: 0x2b3033, roughness: 0.46, metalness: 0.3 }),
      digit:      new THREE.MeshStandardMaterial({ color: 0x191d20, roughness: 0.52, metalness: 0.22 }),
      strap:      new THREE.MeshStandardMaterial({ color: 0x121415, roughness: 0.92, metalness: 0.02 }),
      liner:      new THREE.MeshStandardMaterial({ color: 0x5a6065, roughness: 0.85, metalness: 0.04 }),
      metal:      new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3,  metalness: 0.85 }),
      cable:      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.42, metalness: 0.08 }),
      hose:       new THREE.MeshStandardMaterial({ color: 0x6f6c69, roughness: 0.7,  metalness: 0.05 })
    };
  }

  /** Tapered tube via lathe: profile is [ [radius, x], ... ] along the arm axis. */
  function tapered(THREE, profile, segments) {
    const pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(pts, segments || 40);
    g.rotateZ(-Math.PI / 2);          // lathe spins about Y; the arm runs along X
    return g;
  }

  function markPart(mesh, code) {
    mesh.name = code;
    mesh.userData.code = code;
    return mesh;
  }

  // ------------------------------------------------------------------- model
  function buildAssembly(THREE) {
    const M = materials(THREE);
    const root = new THREE.Group();
    const parts = {};

    function part(code, mesh) {
      markPart(mesh, code);
      mesh.castShadow = mesh.receiveShadow = true;
      if (!parts[code]) parts[code] = new THREE.Group();
      parts[code].add(mesh);
      return mesh;
    }

    // ---- biceps cuff: open-backed cup around the upper arm
    part('BIC', new THREE.Mesh(
      tapered(THREE, [[0,-21],[5.6,-21],[5.6,-20.4],[5.2,-11.4],[5.2,-10.8],[0,-10.8]], 44), M.shell));
    // cut-out look: a lighter inner wall reads as the open back
    part('LNR', new THREE.Mesh(
      tapered(THREE, [[0,-20.2],[4.9,-20.2],[4.6,-11.6],[0,-11.6]], 36), M.liner));

    // ---- straps
    [-18.6, -13.4].forEach(x => {
      const s = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.55, 10, 34), M.strap);
      s.rotation.y = Math.PI / 2; s.position.x = x;
      part('STR', s);
    });

    // ---- elbow hinge: side plate + pin
    const plate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 0.7), M.shellLight);
    plate.position.set(-9.4, 0, 4.4); part('ELB', plate);
    const plate2 = plate.clone(); plate2.position.z = -4.4; part('ELB', plate2);
    [4.4, -4.4].forEach(z => {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.1, 18), M.metal);
      pin.rotation.x = Math.PI / 2; pin.position.set(-9.4, 0, z);
      part('ELB', pin);
    });

    // ---- forearm socket (proximal, receives the residual limb)
    part('SKT', new THREE.Mesh(
      tapered(THREE, [[0,-8],[5.0,-8],[4.9,-3],[4.4,2],[0,2]], 44), M.shell));

    // ---- fasteners
    [[-5.5, 3.0, 2.6], [0.2, 3.4, 1.4], [-5.5, -3.0, 2.6]].forEach(([x,y,z]) => {
      const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 14), M.metal);
      scr.rotation.x = Math.PI / 2; scr.position.set(x, y, z);
      part('FST', scr);
    });

    // ---- forearm shell (distal, tapering to the wrist)
    part('FRM', new THREE.Mesh(
      tapered(THREE, [[0,2],[4.4,2],[3.6,8],[2.7,13.4],[0,13.4]], 44), M.shellLight));

    // ---- wrist coupler
    const wr = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.4, 2.2, 30), M.shellLight);
    wr.rotation.z = Math.PI / 2; wr.position.x = 14.6; part('WRS', wr);
    const knurl = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.62, 0.9, 40), M.metal);
    knurl.rotation.z = Math.PI / 2; knurl.position.x = 14.6; part('WRS', knurl);

    // ---- palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(7.2, 8.4, 3.0), M.shell);
    palm.position.set(19.4, 0.3, 0); part('PLM', palm);
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.4, 6.4, 0.5), M.shellLight);
    back.position.set(19.6, 0.3, 1.6); part('PLM', back);

    // ---- digits: proximal / middle / distal with knuckle pins
    function digit(code, yOff, lengths, zTilt) {
      let x = 23.2;
      lengths.forEach((len, i) => {
        const r = 0.72 - i * 0.08;
        const seg = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 14), M.digit);
        seg.rotation.z = Math.PI / 2;
        seg.position.set(x + len / 2, yOff, 0);
        seg.rotation.y = zTilt || 0;
        part(code, seg);
        const k = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 1.5, 14), M.metal);
        k.rotation.x = Math.PI / 2; k.position.set(x, yOff, 0);
        part(code, k);
        x += len + r * 1.4;
      });
    }
    digit('IND',  2.9, [3.2, 2.2, 1.6]);
    digit('MID',  0.9, [3.5, 2.5, 1.7]);
    digit('RNG', -1.1, [3.2, 2.3, 1.6]);
    digit('LTL', -3.0, [2.5, 1.7, 1.3]);

    // ---- thumb: offset and rotated out of the palm plane
    const thumbG = new THREE.Group();
    [[0, 2.6, 0.78], [2.9, 2.0, 0.7]].forEach(([x, len, r]) => {
      const seg = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 5, 14), M.digit);
      seg.rotation.z = Math.PI / 2; seg.position.x = x + len / 2;
      thumbG.add(markPart(seg, 'THM'));
      const k = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 1.4, 14), M.metal);
      k.rotation.x = Math.PI / 2; k.position.x = x;
      thumbG.add(markPart(k, 'THM'));
    });
    thumbG.position.set(17.6, -3.6, 1.4);
    thumbG.rotation.z = -0.55; thumbG.rotation.y = 0.5;
    if (!parts.THM) parts.THM = new THREE.Group();
    parts.THM.add(thumbG);

    // ---- Bowden housing + actuation cable, running under the forearm
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-17.5, -4.6, 1.8),
      new THREE.Vector3(-11.0, -6.2, 2.4),
      new THREE.Vector3( -3.0, -5.6, 2.6),
      new THREE.Vector3(  6.0, -4.2, 2.2),
      new THREE.Vector3( 13.0, -2.4, 1.6),
      new THREE.Vector3( 17.5, -1.0, 1.2)
    ]);
    part('CBL', new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 60, 0.26, 10, false), M.cable));

    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10.0, -6.1, 2.4),
      new THREE.Vector3( -3.0, -5.6, 2.6),
      new THREE.Vector3(  5.0, -4.4, 2.3)
    ]);
    part('HSG', new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 40, 0.48, 10, false), M.hose));

    // ---- harness cable leaving the cuff
    const harness = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20.4, 3.4, 2.2),
      new THREE.Vector3(-24.0, 7.5, 1.0),
      new THREE.Vector3(-26.5, 12.5, -1.0)
    ]);
    part('HRN', new THREE.Mesh(new THREE.TubeGeometry(harness, 30, 0.17, 8, false), M.hose));

    CODES.forEach(c => { if (parts[c]) { parts[c].name = c; root.add(parts[c]); } });
    return { root: root, parts: parts };
  }

  window.ULFAssembly3D = { build: buildAssembly, CODES: CODES };
}());

/* ULF assembly viewer — orbit + per-mesh hover picking
 * ====================================================
 * Mounts into #arm3d. Reads part metadata from the page's PARTS table so the
 * codes, names, part numbers, statuses and proposed-code flags stay on one
 * source of truth rather than being duplicated here.
 */
(function () {
  'use strict';

  function boot() {
    const host = document.getElementById('arm3d');
    if (!host || typeof THREE === 'undefined') return;
    if (host.dataset.ready) return;
    host.dataset.ready = '1';

    const meta = (window.ULF_PARTS || []).reduce((m, p) => (m[p.c] = p, m), {});
    const strings = window.ULF_PART_STR || { en: {} };
    const langOf = () => {
      const b = document.querySelector('.lang button.active');
      return (b && b.dataset.lang) || 'en';
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 2, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);

    // studio-ish lighting so the shells read as moulded plastic
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b8783, 0.42));
    const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(16, 22, 26); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.32); fill.position.set(-22, 4, -16); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd9b0, 0.5); rim.position.set(-6, -14, -20); scene.add(rim);

    const built = window.ULFAssembly3D.build(THREE);
    const model = built.root;
    model.position.x = -2;
    scene.add(model);

    // frame the assembly
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    model.position.sub(centre);

    // ---- orbit (hand-rolled: avoids a second CDN dependency) ----
    const state = { az: 0.12, el: 0.20, dist: radius * 2.5, drag: false, px: 0, py: 0, idle: true };
    function place() {
      const d = state.dist, ce = Math.cos(state.el);
      camera.position.set(d * ce * Math.sin(state.az), d * Math.sin(state.el), d * ce * Math.cos(state.az));
      camera.lookAt(0, 0, 0);
    }
    const down = e => { state.drag = true; state.idle = false; state.px = e.clientX; state.py = e.clientY;
                        host.setPointerCapture && host.setPointerCapture(e.pointerId); };
    const move = e => {
      if (!state.drag) { hover(e); return; }
      state.az -= (e.clientX - state.px) * 0.008;
      state.el = Math.max(-1.2, Math.min(1.2, state.el + (e.clientY - state.py) * 0.006));
      state.px = e.clientX; state.py = e.clientY; place();
    };
    const up = () => { state.drag = false; };
    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    host.addEventListener('wheel', e => {
      e.preventDefault();
      state.zoomed = true;
      state.dist = Math.max(radius * 1.1, Math.min(radius * 4, state.dist + e.deltaY * 0.05));
      place();
    }, { passive: false });

    // keyboard orbit
    host.tabIndex = 0;
    host.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key];
      if (!k) return;
      e.preventDefault(); state.idle = false;
      state.az += k[0]; state.el = Math.max(-1.2, Math.min(1.2, state.el + k[1])); place();
    });

    // ---- hover picking ----
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tip = document.getElementById('arm3dTip');
    let current = null;

    function setHighlight(code) {
      model.traverse(o => {
        if (!o.isMesh) return;
        const c = o.userData.code;
        if (!c) return;
        const m = o.material;
        if (!o.userData.base) o.userData.base = m.color.getHex();
        const p = meta[c];
        if (code && c === code)      m.color.setHex(0xf97316);
        else if (p && p.wip)         m.color.setHex(0x0fb875);
        else                         m.color.setHex(o.userData.base);
        m.opacity = code && c !== code ? 0.28 : 1;
        m.transparent = !!(code && c !== code);
      });
    }

    function hover(e) {
      const r = host.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(model.children, true)[0];
      const code = hit && hit.object.userData.code;
      if (code === current) return;
      current = code || null;
      setHighlight(current);
      if (!tip) return;
      if (!current) { tip.classList.remove('show'); return; }
      const p = meta[current] || { c: current, en: current };
      const lang = langOf();
      const S = strings[lang] || strings.en;
      tip.innerHTML = '';
      const n = document.createElement('div'); n.className = 'tipName';
      n.textContent = lang === 'pt' && p.pt ? p.pt : p.en;
      const q = document.createElement('div'); q.className = 'tipPn';
      q.textContent = 'ULF-' + p.c + '-001';
      tip.append(n, q);
      if (p.new) {
        const w = document.createElement('div'); w.className = 'tipNew';
        w.textContent = '⚠ ' + S.proposed;
        tip.appendChild(w);
      }
      const st = document.createElement('span');
      st.className = 'tipStatus ' + (p.wip ? 'wip' : '');
      st.textContent = S[p.wip ? 'wip' : 'todo'];
      tip.appendChild(st);
      tip.classList.add('show');
      tip.style.left = (e.clientX - r.left) + 'px';
      tip.style.top  = (e.clientY - r.top) + 'px';
    }

    host.addEventListener('pointerleave', () => {
      current = null; setHighlight(null);
      if (tip) tip.classList.remove('show');
    });

    const span = box.getSize(new THREE.Vector3());
    function resize() {
      const w = host.clientWidth, h = host.clientHeight || Math.round(w * 0.42);
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
      // Frame on the arm's length, not its bounding sphere: in a 21:9 box the
      // sphere fit leaves the model tiny with huge margins left and right.
      const vFov = camera.fov * Math.PI / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const need = Math.max((span.x * 0.62) / Math.tan(hFov / 2),
                            (span.y * 0.75) / Math.tan(vFov / 2));
      state.fit = need;
      if (!state.zoomed) { state.dist = need; place(); }
    }
    new ResizeObserver(resize).observe(host);
    resize(); place(); setHighlight(null);

    const slow = matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function loop() {
      requestAnimationFrame(loop);
      if (state.idle && !slow) { state.az += 0.0022; place(); }
      renderer.render(scene, camera);
    })();

    document.querySelectorAll('.lang button').forEach(b =>
      b.addEventListener('click', () => { current = null; if (tip) tip.classList.remove('show'); }));

    host.classList.add('ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
