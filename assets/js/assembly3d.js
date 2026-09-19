/* ULF transradial assembly — procedural 3D model + viewer
 * ========================================================
 * Phase 0 deliverable: the model itself.
 *
 * The geometry is authored here rather than imported. Two reasons:
 *   1. No ULF CAD export exists yet.
 *   2. The two reference designs are third-party and non-commercially licensed:
 *        thing:4618922  Kinetic Hand, Free 3D Hands   CC BY-NC-SA 4.0
 *        thing:6525526  Waacs arm for e-NABLE, SandraDermisek (remix, WIP)
 *      Their *construction* is documented publicly and is what this model
 *      follows. Their *geometry* is not copied: ShareAlike would propagate
 *      NC onto anything derived from it. See the README before changing that.
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
      hose:       new THREE.MeshStandardMaterial({ color: 0x6f6c69, roughness: 0.7,  metalness: 0.05 }),
      // TPU flexible hinges — the Kinetic Hand uses these in place of snap pins
      flex:       new THREE.MeshStandardMaterial({ color: 0x3f4449, roughness: 0.95, metalness: 0.0 }),
      // moulded silicone grip pads on the distal phalanges
      grip:       new THREE.MeshStandardMaterial({ color: 0x555b60, roughness: 0.98, metalness: 0.0 }),
      seam:       new THREE.MeshStandardMaterial({ color: 0x121517, roughness: 1.0, metalness: 0.0, transparent: true, opacity: 0.55 }),
      channel:    new THREE.MeshStandardMaterial({ color: 0x0e1012, roughness: 1.0,  metalness: 0.0 }),
      strapDark:  new THREE.MeshStandardMaterial({ color: 0x0a0b0c, roughness: 0.98, metalness: 0.0 })
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
  /* Construction follows how these devices are actually printed, taken from the
   * published design notes of the Kinetic Hand (Free 3D Hands, CC BY-NC-SA 4.0)
   * and the Waacs/e-NABLE arm. No geometry is copied from either — both are
   * non-commercial licensed. What is borrowed is the *architecture*:
   *
   *   - phalanges are chunky bevelled printed blocks, not smooth capsules
   *   - joints are FLEXIBLE HINGES moulded between segments, not snap pins
   *   - dual tendons run in channels through the fingers and palm
   *   - the palm carries a cavity and a separate flexible palm cover
   *   - tensioners sit under a gauntlet cover
   *   - everything is oriented to print without supports: flat bottoms,
   *     bevelled top edges, no overhangs steeper than ~45 degrees
   */
  function buildAssembly(THREE) {
    const M = materials(THREE);
    const root = new THREE.Group();
    const parts = {};

    function part(code, mesh) {
      markPart(mesh, code);
      if (!parts[code]) parts[code] = new THREE.Group();
      parts[code].add(mesh);
      return mesh;
    }

    /** Rounded rectangle in XY, corner radius r. */
    function roundRect(x, y, w, h, r) {
      const s = new THREE.Shape();
      r = Math.min(r, h / 2, w / 2);
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }

    /** Extrude a shape along Z and centre it — the printed-part primitive. */
    function printed(shape, depth, bevel) {
      const b = bevel === undefined ? 0.12 : bevel;
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: depth - b * 2, bevelEnabled: b > 0, bevelSize: b,
        bevelThickness: b, bevelSegments: 2, curveSegments: 10
      });
      g.translate(0, 0, -(depth - b * 2) / 2);
      return g;
    }

    // ============================================================== gauntlet
    // Upper-arm cuff: a C-shell, open at the back so it can be strapped on.
    function cShell(rOuter, rInner, x0, len, openDeg) {
      const half = THREE.MathUtils.degToRad(180 - openDeg / 2);
      const s = new THREE.Shape();
      s.absarc(0, 0, rOuter, -half, half, false);
      s.absarc(0, 0, rInner, half, -half, true);
      const g = new THREE.ExtrudeGeometry(s, {
        depth: len, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1,
        bevelSegments: 2, curveSegments: 26
      });
      g.rotateY(Math.PI / 2);
      g.translate(x0, 0, 0);
      return g;
    }

    part('BIC', new THREE.Mesh(cShell(5.6, 5.0, -21, 10, 95), M.shell));
    part('LNR', new THREE.Mesh(cShell(4.96, 4.55, -20.4, 8.8, 100), M.liner));

    // strap slots are printed through the cuff wall; the straps thread them
    [-18.4, -13.6].forEach(x => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(5.62, 0.42, 8, 30, Math.PI * 1.35), M.strap);
      band.rotation.y = Math.PI / 2; band.rotation.z = -Math.PI * 0.18; band.position.x = x;
      part('STR', band);
      [1, -1].forEach(sgn => {
        const slot = new THREE.Mesh(printed(roundRect(-0.9, -0.28, 1.8, 0.56, 0.2), 0.5, 0.06), M.strapDark);
        slot.rotation.y = Math.PI / 2; slot.position.set(x, sgn * 4.1, 3.6 * sgn * 0 + 3.3);
        part('STR', slot);
      });
    });

    // ============================================================ elbow hinge
    // Twin side plates on a steel pin — the one place a pin is right.
    [4.5, -4.5].forEach(z => {
      const plate = new THREE.Mesh(printed(roundRect(-3.2, -0.95, 6.4, 1.9, 0.9), 0.62), M.shellLight);
      plate.position.set(-9.6, 0, z);
      part('ELB', plate);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.5, 16), M.metal);
      pin.rotation.x = Math.PI / 2; pin.position.set(-9.6, 0, z);
      part('ELB', pin);
    });

    // ========================================================= forearm socket
    part('SKT', new THREE.Mesh(cShell(5.05, 4.6, -8.2, 10.2, 62), M.shell));
    // print seam down the socket, the giveaway that this is an FDM part
    const seam = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.1, 0.16), M.seam);
    seam.position.set(-3.1, 0, 4.72); part('SKT', seam);

    // fasteners: countersunk heads on the socket flange
    [[-7.2, 3.1, 3.6], [-7.2, -3.1, 3.6], [1.0, 3.6, 2.8]].forEach(([x, y, z]) => {
      const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.34, 0.3, 14), M.metal);
      scr.rotation.x = Math.PI / 2; scr.position.set(x, y, z);
      part('FST', scr);
    });

    // ========================================================== forearm shell
    part('FRM', new THREE.Mesh(
      tapered(THREE, [[0,2],[4.45,2],[4.1,6],[3.3,10],[2.66,13.6],[0,13.6]], 40), M.shellLight));
    const seam2 = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.1, 0.16), M.seam);
    seam2.position.set(7.8, 0, 3.6); part('FRM', seam2);

    // =============================================================== wrist
    const wr = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.62, 1.9, 26), M.shellLight);
    wr.rotation.z = Math.PI / 2; wr.position.x = 14.7; part('WRS', wr);
    // knurled collar
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.16), M.metal);
      rib.position.set(16.0, Math.cos(a) * 2.5, Math.sin(a) * 2.5);
      rib.rotation.x = -a; part('WRS', rib);
    }

    // ================================================================ palm
    // Printed plate with a cavity for the residual hand, plus a flexible cover.
    const palmOutline = roundRect(-4.2, -4.4, 8.4, 8.8, 1.5);
    const cavity = new THREE.Path();
    cavity.absarc(0.2, 0.2, 2.5, 0, Math.PI * 2, true);
    palmOutline.holes.push(cavity);
    const palm = new THREE.Mesh(printed(palmOutline, 2.5, 0.22), M.shell);
    palm.position.set(21.2, 0.2, 0); part('PLM', palm);

    const cover = new THREE.Mesh(printed(roundRect(-3.4, -3.6, 6.8, 7.2, 1.4), 0.45, 0.14), M.flex);
    cover.position.set(21.2, 0.2, -1.5); part('PLM', cover);

    // tendon guide holes through the palm, one per digit
    [3.0, 1.0, -1.0, -2.9].forEach(y => {
      const guide = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.6, 10), M.channel);
      guide.rotation.z = Math.PI / 2; guide.position.set(22.6, y, 0.9);
      part('PLM', guide);
    });

    // =============================================================== digits
    /* Each digit: printed phalanges with a flexible hinge moulded between them,
     * and a silicone grip pad on the gripping face of the distal segment. */
    function digit(code, y, segs, width, baseX, tilt) {
      let x = baseX;
      segs.forEach((len, i) => {
        const h = 1.55 - i * 0.16;
        const w = width - i * 0.14;

        const ph = new THREE.Mesh(printed(roundRect(0, -h / 2, len, h, h * 0.42), w, 0.13), M.digit);
        ph.position.set(x, y, 0); ph.rotation.z = tilt ? tilt * (i + 1) * 0.12 : 0;
        part(code, ph);

        // tendon channel along the dorsal face
        const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, len * 0.82, 8), M.channel);
        ch.rotation.z = Math.PI / 2; ch.position.set(x + len / 2, y + h * 0.3, w * 0.22);
        part(code, ch);

        // silicone grip pad on the distal segment's palmar face
        if (i === segs.length - 1) {
          const pad = new THREE.Mesh(printed(roundRect(0.2, -h * 0.3, len * 0.6, h * 0.6, 0.2), w * 0.8, 0.08), M.grip);
          pad.position.set(x, y, -w * 0.18);
          part(code, pad);
        }

        x += len;
        // flexible hinge between segments (and at the knuckle)
        if (i < segs.length - 1) {
          const hg = new THREE.Mesh(printed(roundRect(0, -h * 0.34, 0.5, h * 0.68, 0.2), w * 0.82, 0.08), M.flex);
          hg.position.set(x, y, 0);
          part(code, hg);
          x += 0.5;
        }
      });
    }

    // knuckle hinges where the digits meet the palm
    [[3.0, 1.5], [1.0, 1.6], [-1.0, 1.5], [-2.9, 1.3]].forEach(([y, w], i) => {
      const kn = new THREE.Mesh(printed(roundRect(0, -0.78, 0.55, 1.56, 0.4), w * 0.85, 0.08), M.flex);
      kn.position.set(25.1, y, 0);
      part(['IND', 'MID', 'RNG', 'LTL'][i], kn);
    });

    digit('IND',  3.0, [3.3, 2.3, 1.7], 1.5, 25.65);
    digit('MID',  1.0, [3.6, 2.5, 1.8], 1.6, 25.65);
    digit('RNG', -1.0, [3.3, 2.3, 1.7], 1.5, 25.65);
    digit('LTL', -2.9, [2.6, 1.8, 1.35], 1.3, 25.65);

    // thumb: opposed, rotated out of the palm plane
    const thumbG = new THREE.Group();
    let tx = 0;
    [[2.7, 1.55], [2.0, 1.4]].forEach(([len, w], i) => {
      const h = 1.6 - i * 0.18;
      const ph = new THREE.Mesh(printed(roundRect(0, -h / 2, len, h, h * 0.42), w, 0.13), M.digit);
      ph.position.x = tx; thumbG.add(markPart(ph, 'THM'));
      if (i === 1) {
        const pad = new THREE.Mesh(printed(roundRect(0.2, -h * 0.3, len * 0.6, h * 0.6, 0.2), w * 0.8, 0.08), M.grip);
        pad.position.set(tx, 0, -w * 0.2); thumbG.add(markPart(pad, 'THM'));
      }
      tx += len;
      if (i === 0) {
        const hg = new THREE.Mesh(printed(roundRect(0, -h * 0.34, 0.5, h * 0.68, 0.2), w * 0.8, 0.08), M.flex);
        hg.position.x = tx; thumbG.add(markPart(hg, 'THM'));
        tx += 0.5;
      }
    });
    thumbG.position.set(18.0, -4.0, 1.3);
    thumbG.rotation.z = -0.62; thumbG.rotation.y = 0.55;
    if (!parts.THM) parts.THM = new THREE.Group();
    parts.THM.add(thumbG);

    // ====================================================== tendons + housing
    // Dual tendons: they loop back through the fingers and are tied once at the
    // tensioner, so each digit shows a pair rather than a single strand.
    [3.0, 1.0, -1.0, -2.9].forEach((y, i) => {
      [0.34, -0.34].forEach(off => {
        const c = new THREE.CatmullRomCurve3([
          new THREE.Vector3(32.0 - i * 0.6, y + 0.5, off * 0.8),
          new THREE.Vector3(27.0, y + 0.45, off),
          new THREE.Vector3(23.2, y * 0.75, 0.9 + off * 0.3),
          new THREE.Vector3(18.0, y * 0.4, 1.6)
        ]);
        part('CBL', new THREE.Mesh(new THREE.TubeGeometry(c, 26, 0.085, 6, false), M.cable));
      });
    });

    // main actuation cable, gauntlet to wrist
    const main = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-17.6, -4.4, 2.2),
      new THREE.Vector3(-11.0, -6.0, 2.8),
      new THREE.Vector3( -3.0, -5.4, 3.0),
      new THREE.Vector3(  6.0, -4.0, 2.6),
      new THREE.Vector3( 13.2, -2.2, 1.9),
      new THREE.Vector3( 17.8, -0.8, 1.5)
    ]);
    part('CBL', new THREE.Mesh(new THREE.TubeGeometry(main, 60, 0.22, 8, false), M.cable));

    const hose = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10.2, -5.9, 2.8),
      new THREE.Vector3( -3.0, -5.4, 3.0),
      new THREE.Vector3(  5.2, -4.2, 2.7)
    ]);
    part('HSG', new THREE.Mesh(new THREE.TubeGeometry(hose, 40, 0.42, 10, false), M.hose));
    // ferrules at each end of the housing
    [[-10.2, -5.9, 2.8], [5.2, -4.2, 2.7]].forEach(([x, y, z]) => {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.6, 12), M.metal);
      f.rotation.z = Math.PI / 2; f.position.set(x, y, z);
      part('HSG', f);
    });

    // ============================================================== harness
    const harness = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20.6, 3.2, 2.4),
      new THREE.Vector3(-24.2, 7.4, 1.2),
      new THREE.Vector3(-26.8, 12.6, -0.8)
    ]);
    part('HRN', new THREE.Mesh(new THREE.TubeGeometry(harness, 30, 0.15, 8, false), M.hose));

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
