// Doras Survivor — dibujo en 3D con Three.js (estilo runner con cámara detrás del personaje).
// La lógica del juego vive en game.js y trabaja en "píxeles lógicos" del juego 2D original.
// Este archivo solo traduce ese estado a un escenario 3D:
//   x lógico (carriles 140/270/400) -> metros a los costados
//   y lógico (distancia en pantalla)  -> metros hacia adelante (eje -z)
(() => {
  "use strict";
  if (!window.THREE) return;
  const T = window.THREE;

  const K = 0.025;              // píxel lógico de distancia -> metros
  const LANE_M = 2.0 / 130;     // píxel lógico lateral -> metros (2 m entre carriles)
  const JUMP_M = 0.0135;        // altura de salto lógica -> metros
  const toX = (lx) => (lx - 270) * LANE_M;
  const SCENERY_LEN = 110;      // largo del tramo de decoración que se recicla

  let renderer, scene, camera, sun, hemi;
  let world;                    // grupo con todo lo que se mueve
  let pathTex, grassTex;
  let playerRig, botasRig;
  let bossRig, templeRig, truckRig;
  const warnStrips = [];
  const scenery = [];
  const arches = [];
  const meshes = new Map();     // objeto lógico -> grupo 3D
  const protos = {};
  const labelCache = new Map();
  const particles = [];
  let shieldBubble, shieldBroc;
  let camX = 0;
  let lastTime = 0;
  let runPhase = 0;
  let headTurn = 0;
  let PLAYER_Y = 739;
  let ready = false;

  // ---------- Materiales y utilidades ----------
  const matCache = new Map();
  function mat(color, opts = {}) {
    const key = color + JSON.stringify(opts);
    let m = matCache.get(key);
    if (!m) {
      m = new T.MeshLambertMaterial(Object.assign({ color }, opts));
      matCache.set(key, m);
    }
    return m;
  }
  function mesh(geo, color, opts) {
    const m = new T.Mesh(geo, color instanceof T.Material ? color : mat(color, opts));
    m.castShadow = true;
    return m;
  }
  function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
  const G = {
    box: (w, h, d) => new T.BoxGeometry(w, h, d),
    cyl: (rt, rb, h, s = 16, open = false, start = 0, len = Math.PI * 2) => new T.CylinderGeometry(rt, rb, h, s, 1, open, start, len),
    sph: (r, ws = 16, hs = 12) => new T.SphereGeometry(r, ws, hs),
    tor: (r, t, rs = 10, ts = 24) => new T.TorusGeometry(r, t, rs, ts),
    cone: (r, h, s = 12) => new T.ConeGeometry(r, h, s),
    cap: (r, l) => new T.CapsuleGeometry(r, l, 6, 12)
  };

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Cartelito con texto (nombres de la comida, carteles satíricos).
  function label(text, bg = "rgba(0,0,0,.6)", fg = "#fff", height = 0.42) {
    const key = text + bg + fg;
    let tex = labelCache.get(key);
    if (!tex) {
      const fontPx = 44;
      const tmp = document.createElement("canvas").getContext("2d");
      tmp.font = "bold " + fontPx + "px 'Trebuchet MS', sans-serif";
      const w = Math.ceil(tmp.measureText(text).width) + 40;
      tex = canvasTex(w, 64, (ctx, cw, ch) => {
        roundRect(ctx, 2, 2, cw - 4, ch - 4, 28);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.font = "bold " + fontPx + "px 'Trebuchet MS', sans-serif";
        ctx.fillStyle = fg;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, cw / 2, ch / 2 + 2);
      });
      tex.userData = { aspect: w / 64 };
      labelCache.set(key, tex);
    }
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
    sp.scale.set(height * tex.userData.aspect, height, 1);
    sp.renderOrder = 5;
    return sp;
  }

  // ---------- Comida 3D ----------
  function burger(scale = 1) {
    const g = new T.Group();
    const bun = 0xe0a050;
    g.add(at(mesh(G.cyl(0.55, 0.5, 0.18), bun), 0, 0.09, 0));
    let y = 0.2;
    for (let i = 0; i < 3; i++) {
      g.add(at(mesh(G.cyl(0.58, 0.58, 0.14), 0x5a2e14), 0, y + 0.07, 0));
      const cheese = mesh(G.box(1.05, 0.04, 1.05), 0xffc928);
      cheese.rotation.y = 0.4 + i;
      g.add(at(cheese, 0, y + 0.16, 0));
      y += 0.2;
    }
    g.add(at(mesh(G.cyl(0.62, 0.62, 0.05, 14), 0x5cb83a), 0, y + 0.02, 0));
    g.add(at(mesh(G.cyl(0.5, 0.5, 0.05), 0xd9342b), 0, y + 0.07, 0));
    const top = mesh(new T.SphereGeometry(0.58, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), bun);
    top.scale.y = 0.75;
    g.add(at(top, 0, y + 0.1, 0));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      const r = 0.15 + (i % 3) * 0.13;
      g.add(at(mesh(G.sph(0.035, 6, 4), 0xfff4d6), Math.cos(a) * r, y + 0.1 + 0.4 * (1 - r / 0.6) * 0.75 + 0.02, Math.sin(a) * r));
    }
    g.scale.setScalar(scale);
    return g;
  }
  function pizza() {
    const g = new T.Group();
    const s = new T.Shape();
    s.moveTo(-0.6, 0.9); s.lineTo(0.6, 0.9); s.lineTo(0, -0.5); s.closePath();
    const slice = mesh(new T.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), 0xffcf4a);
    g.add(slice);
    const crust = mesh(G.cyl(0.08, 0.08, 1.3, 10), 0xc8782c);
    crust.rotation.z = Math.PI / 2;
    g.add(at(crust, 0, 0.9, 0.04));
    [[0, 0.5], [-0.25, 0.7], [0.25, 0.7], [0, 0.15]].forEach(([x, y]) => {
      const p = mesh(G.cyl(0.11, 0.11, 0.04, 12), 0xc0392b);
      p.rotation.x = Math.PI / 2;
      g.add(at(p, x, y, 0.1));
    });
    g.rotation.x = -0.15;
    g.position.y = 0.55;
    const w = new T.Group();
    w.add(g);
    return w;
  }
  function donut() {
    const g = new T.Group();
    const inner = new T.Group();
    inner.add(mesh(G.tor(0.42, 0.22, 12, 28), 0xd99a4e));
    const icing = mesh(G.tor(0.42, 0.18, 12, 28), 0xff7eb6);
    icing.position.z = -0.06;
    inner.add(icing);
    const colors = [0xffffff, 0x4dabf7, 0xffd43b, 0x69db7c];
    for (let i = 0; i < 14; i++) {
      const a = i * 0.45;
      const sp = mesh(G.box(0.1, 0.03, 0.03), colors[i % 4]);
      sp.rotation.z = a * 2;
      inner.add(at(sp, Math.cos(a) * 0.42, Math.sin(a) * 0.42, -0.24));
    }
    inner.name = "spin";
    g.add(at(inner, 0, 0.64, 0));
    return g;
  }
  function fries() {
    const g = new T.Group();
    const box = mesh(G.cyl(0.42, 0.3, 0.7, 4), 0xd62828);
    box.rotation.y = Math.PI / 4;
    g.add(at(box, 0, 0.35, 0));
    for (let i = 0; i < 12; i++) {
      const f = mesh(G.box(0.07, 0.6, 0.07), 0xffd43b);
      f.rotation.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
      g.add(at(f, (i % 4 - 1.5) * 0.12, 0.8 + (i % 3) * 0.05, (Math.floor(i / 4) - 1) * 0.12));
    }
    g.add(at(mesh(G.box(0.25, 0.25, 0.02), 0xffd43b), 0, 0.4, -0.3));
    return g;
  }
  function hotdog() {
    const g = new T.Group();
    const bun = mesh(G.cap(0.24, 1.0), 0xe0a050);
    bun.rotation.z = Math.PI / 2;
    bun.scale.set(1, 1, 0.8);
    g.add(at(bun, 0, 0.3, 0));
    const s = mesh(G.cap(0.15, 1.25), 0xb03a2e);
    s.rotation.z = Math.PI / 2;
    g.add(at(s, 0, 0.48, 0));
    for (let i = 0; i < 6; i++) g.add(at(mesh(G.sph(0.05, 6, 4), 0xffd400), -0.5 + i * 0.2, 0.62, (i % 2 ? 0.04 : -0.04)));
    return g;
  }
  function bacon() {
    const g = new T.Group();
    for (let i = 0; i < 8; i++) {
      const seg = mesh(G.box(0.2, 0.06, 0.5), i % 2 ? 0xc0392b : 0xe8a090);
      seg.rotation.z = Math.sin(i * 1.4) * 0.5;
      g.add(at(seg, -0.7 + i * 0.2, 0.55 + Math.sin(i * 1.4) * 0.15, 0));
    }
    g.rotation.y = 0.3;
    return g;
  }
  function chicken() {
    const g = new T.Group();
    const meat = mesh(G.sph(0.38), 0xb5651d);
    meat.scale.set(1, 1.3, 1);
    g.add(at(meat, 0, 0.75, 0));
    g.add(at(mesh(G.cyl(0.07, 0.07, 0.5, 8), 0xfff5e1), 0, 0.2, 0));
    g.add(at(mesh(G.sph(0.1, 8, 6), 0xfff5e1), -0.07, 0, 0));
    g.add(at(mesh(G.sph(0.1, 8, 6), 0xfff5e1), 0.07, 0, 0));
    g.rotation.z = 0.25;
    return g;
  }
  function chocolate() {
    const g = new T.Group();
    g.add(at(mesh(G.box(0.8, 1.2, 0.15), 0x5c3317), 0, 0.7, 0));
    g.add(at(mesh(G.box(0.84, 0.6, 0.18), 0xc92a2a), 0, 0.42, 0));
    g.add(at(mesh(G.box(0.86, 0.06, 0.2), 0xf1f3f5), 0, 0.7, 0));
    g.rotation.y = 0.2;
    return g;
  }
  function taco() {
    const g = new T.Group();
    const shell = mesh(G.cyl(0.5, 0.5, 0.35, 16, true, Math.PI / 2, Math.PI), mat(0xf2c14e, { side: T.DoubleSide }));
    shell.rotation.z = Math.PI / 2;
    g.add(at(shell, 0, 0.55, 0));
    for (let i = 0; i < 10; i++) {
      g.add(at(mesh(G.sph(0.09, 6, 5), [0x5cb83a, 0xd9342b, 0x8b4513][i % 3]), (Math.random() - 0.5) * 0.2, 0.75 + Math.random() * 0.25, (i - 5) * 0.08));
    }
    g.rotation.y = Math.PI / 2;
    return g;
  }
  function soda(color = 0xd62828, label3 = 0xffffff) {
    const g = new T.Group();
    g.add(at(mesh(G.cyl(0.42, 0.32, 1.3, 18), color), 0, 0.65, 0));
    g.add(at(mesh(G.cyl(0.43, 0.43, 0.3, 18), label3), 0, 0.75, 0));
    g.add(at(mesh(G.cyl(0.45, 0.45, 0.06, 18), 0xf8f9fa), 0, 1.32, 0));
    const straw = mesh(G.cyl(0.04, 0.04, 0.8, 8), 0xff6b6b);
    straw.rotation.z = 0.25;
    g.add(at(straw, 0.1, 1.6, 0));
    return g;
  }
  function icecream() {
    const g = new T.Group();
    const cone = mesh(G.cone(0.3, 0.8), 0xd9a441);
    cone.rotation.x = Math.PI;
    g.add(at(cone, 0, 0.4, 0));
    [[0xfff0f6, 0.9], [0xff8fab, 1.2], [0x8b5a2b, 1.5]].forEach(([c, y]) => g.add(at(mesh(G.sph(0.3), c), 0, y, 0)));
    g.add(at(mesh(G.sph(0.08), 0xe03131), 0, 1.82, 0));
    return g;
  }
  function cake() {
    const g = new T.Group();
    g.add(at(mesh(G.cyl(0.7, 0.7, 0.4, 24), 0xffc9de), 0, 0.2, 0));
    g.add(at(mesh(G.cyl(0.5, 0.5, 0.35, 24), 0xfff0f6), 0, 0.58, 0));
    const frosting = mesh(G.tor(0.6, 0.06, 8, 24), 0xff8fab);
    frosting.rotation.x = Math.PI / 2;
    g.add(at(frosting, 0, 0.4, 0));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26;
      g.add(at(mesh(G.cyl(0.03, 0.03, 0.25, 6), [0x4dabf7, 0xffd43b, 0x69db7c][i % 3]), Math.cos(a) * 0.3, 0.87, Math.sin(a) * 0.3));
      g.add(at(mesh(G.sph(0.04, 6, 4), mat(0xffa94d, { emissive: 0xff8800 })), Math.cos(a) * 0.3, 1.03, Math.sin(a) * 0.3));
    }
    return g;
  }
  function cupcake() {
    const g = new T.Group();
    g.add(at(mesh(G.cyl(0.38, 0.28, 0.45, 12), 0x74c0fc), 0, 0.22, 0));
    [[0.36, 0.55], [0.28, 0.75], [0.18, 0.92]].forEach(([r, y]) => g.add(at(mesh(G.sph(r), 0xff8fab), 0, y, 0)));
    g.add(at(mesh(G.sph(0.09), 0xe03131), 0, 1.1, 0));
    return g;
  }
  function oil() {
    const g = new T.Group();
    const puddle = new T.Mesh(new T.CircleGeometry(0.85, 24), mat(0xe8b923, { transparent: true, opacity: 0.85, emissive: 0x3d2a00 }));
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(1.15, 0.8, 1);
    puddle.receiveShadow = true;
    g.add(at(puddle, 0, 0.03, 0));
    for (let i = 0; i < 5; i++) g.add(at(mesh(G.sph(0.06 + i * 0.01, 8, 6), mat(0xfff3a3, { transparent: true, opacity: 0.8 })), Math.cos(i * 2) * 0.4, 0.06, Math.sin(i * 2) * 0.3));
    const f = fries();
    f.scale.setScalar(0.45);
    f.rotation.z = 1.2;
    g.add(at(f, 0.55, 0.15, 0));
    return g;
  }
  function buffet() {
    const g = new T.Group();
    const cloth = canvasTex(64, 64, (c) => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        c.fillStyle = (x + y) % 2 ? "#ffffff" : "#e03131";
        c.fillRect(x * 8, y * 8, 8, 8);
      }
    });
    cloth.wrapS = cloth.wrapT = T.RepeatWrapping;
    cloth.repeat.set(3, 1);
    g.add(at(mesh(G.box(1.8, 0.9, 1.0), new T.MeshLambertMaterial({ map: cloth })), 0, 0.45, 0));
    const b = burger(0.35); g.add(at(b, -0.55, 0.9, 0));
    const c = cake(); c.scale.setScalar(0.45); g.add(at(c, 0.05, 0.9, 0));
    const ch = chicken(); ch.scale.setScalar(0.5); g.add(at(ch, 0.6, 0.9, 0));
    const glass = mesh(G.box(1.9, 0.05, 0.9), mat(0xd0ebff, { transparent: true, opacity: 0.35 }));
    g.add(at(glass, 0, 1.55, 0));
    g.add(at(mesh(G.box(0.05, 0.65, 0.05), 0xadb5bd), -0.9, 1.22, -0.4));
    g.add(at(mesh(G.box(0.05, 0.65, 0.05), 0xadb5bd), 0.9, 1.22, -0.4));
    return g;
  }
  function combo() {
    const g = new T.Group();
    g.add(at(mesh(G.box(1.6, 0.08, 1.0), 0xc92a2a), 0, 0.04, 0));
    g.add(at(burger(0.75), -0.1, 0.08, 0.1));
    const f = fries(); f.scale.setScalar(0.8); g.add(at(f, 0.55, 0.08, -0.1));
    const s = soda(); s.scale.setScalar(0.85); g.add(at(s, -0.65, 0.08, -0.15));
    return g;
  }
  function vending() {
    const g = new T.Group();
    const front = canvasTex(128, 256, (c, w, h) => {
      c.fillStyle = "#1c3faa"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#d0ebff"; c.fillRect(10, 30, 80, 190);
      const cols = ["#f03e3e", "#fab005", "#7950f2", "#e8590c", "#12b886"];
      for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) {
        c.fillStyle = cols[(r + k) % 5];
        c.fillRect(16 + k * 25, 38 + r * 30, 18, 22);
      }
      c.fillStyle = "#ffd43b"; c.fillRect(98, 60, 20, 40);
      c.fillStyle = "#fff"; c.font = "bold 20px sans-serif"; c.fillText("SNACKS", 18, 22);
      c.fillStyle = "#111"; c.fillRect(14, 228, 76, 18);
    });
    const mats = [mat(0x1c3faa), mat(0x1c3faa), mat(0x1c3faa), mat(0x1c3faa), mat(0x1c3faa), new T.MeshLambertMaterial({ map: front })];
    const box = new T.Mesh(G.box(1.1, 2.0, 0.8), mats);
    box.castShadow = true;
    box.rotation.y = Math.PI; // el frente mira hacia el jugador
    g.add(at(box, 0, 1.0, 0));
    return g;
  }
  function proteinbar() {
    const g = new T.Group();
    const wrap = canvasTex(256, 96, (c, w, h) => {
      c.fillStyle = "#2b8a3e"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#b2f2bb"; c.font = "bold 40px sans-serif"; c.fillText("FIT 100%", 20, 46);
      c.fillStyle = "#fff"; c.font = "18px sans-serif"; c.fillText("*40 g de azúcar", 22, 80);
    });
    const bar = new T.Mesh(G.box(1.2, 0.45, 0.25), [mat(0x2b8a3e), mat(0x2b8a3e), mat(0x2b8a3e), mat(0x2b8a3e), mat(0x2b8a3e), new T.MeshLambertMaterial({ map: wrap })]);
    bar.castShadow = true;
    bar.rotation.y = Math.PI;
    g.add(at(bar, 0, 0.6, 0));
    return g;
  }
  function smoothie() {
    const g = soda(0x8ce99a, 0x2b8a3e);
    const leaf = mesh(G.sph(0.12, 8, 6), 0x2f9e44);
    leaf.scale.set(1.4, 0.4, 0.8);
    g.add(at(leaf, -0.2, 1.4, 0));
    return g;
  }
  function granola() {
    const g = new T.Group();
    g.add(at(mesh(new T.SphereGeometry(0.55, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf1f3f5, { side: T.DoubleSide })), 0, 0.55, 0));
    for (let i = 0; i < 18; i++) g.add(at(mesh(G.sph(0.08, 5, 4), [0xd9a441, 0xa0522d, 0xffd43b][i % 3]), Math.cos(i) * 0.3 * Math.random(), 0.55 + Math.random() * 0.12, Math.sin(i) * 0.3 * Math.random()));
    const honey = mesh(G.cyl(0.04, 0.04, 0.5, 6), mat(0xfab005, { transparent: true, opacity: 0.85 }));
    g.add(at(honey, 0.1, 0.95, 0));
    return g;
  }
  function influencer() {
    const g = new T.Group();
    g.add(at(mesh(G.cyl(0.13, 0.13, 0.8, 8), 0x212529), -0.12, 0.4, 0));
    g.add(at(mesh(G.cyl(0.13, 0.13, 0.8, 8), 0x212529), 0.12, 0.4, 0));
    g.add(at(mesh(G.cyl(0.3, 0.25, 0.7, 12), 0xf06595), 0, 1.15, 0));
    g.add(at(mesh(G.sph(0.22), 0xf4c095), 0, 1.68, 0));
    const hair = mesh(G.sph(0.24, 12, 8), 0xffd43b);
    hair.scale.set(1, 0.7, 1);
    g.add(at(hair, 0, 1.76, 0.06));
    const arm = mesh(G.cyl(0.06, 0.06, 0.6, 8), 0xf4c095);
    arm.rotation.x = -1.2;
    g.add(at(arm, 0.32, 1.45, -0.2));
    g.add(at(mesh(G.box(0.18, 0.32, 0.03), mat(0x222222, { emissive: 0x3355ff })), 0.32, 1.62, -0.48));
    return g;
  }
  function sign2x1() {
    const g = new T.Group();
    const tex = canvasTex(512, 160, (c, w, h) => {
      c.fillStyle = "#ffd43b"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#c92a2a"; c.fillRect(8, 8, w - 16, h - 16);
      c.fillStyle = "#fff"; c.font = "bold 70px sans-serif"; c.textAlign = "center";
      c.fillText("2x1 COMBOS", w / 2, 82);
      c.font = "bold 30px sans-serif"; c.fillText("¡agachate y aprovechá!", w / 2, 132);
    });
    const board = new T.Mesh(G.box(1.9, 0.6, 0.08), [mat(0xffd43b), mat(0xffd43b), mat(0xffd43b), mat(0xffd43b), mat(0xffd43b), new T.MeshLambertMaterial({ map: tex })]);
    board.rotation.y = Math.PI;
    board.castShadow = true;
    g.add(at(board, 0, 1.45, 0));
    g.add(at(mesh(G.cyl(0.05, 0.05, 1.75, 8), 0x868e96), -0.92, 0.88, 0));
    g.add(at(mesh(G.cyl(0.05, 0.05, 1.75, 8), 0x868e96), 0.92, 0.88, 0));
    return g;
  }
  function fox() {
    const g = new T.Group();
    const body = mesh(G.cap(0.24, 0.6), 0xe8590c);
    body.rotation.x = Math.PI / 2;
    g.add(at(body, 0, 0.55, 0));
    const head = new T.Group();
    head.add(mesh(G.sph(0.26), 0xe8590c));
    const snout = mesh(G.cone(0.13, 0.3, 8), 0xfff4e6);
    snout.rotation.x = Math.PI / 2;
    head.add(at(snout, 0, -0.05, 0.3));
    head.add(at(mesh(G.cone(0.1, 0.25, 6), 0xe8590c), -0.14, 0.27, 0));
    head.add(at(mesh(G.cone(0.1, 0.25, 6), 0xe8590c), 0.14, 0.27, 0));
    head.add(at(mesh(G.sph(0.05, 6, 4), 0x111111), -0.1, 0.06, 0.22));
    head.add(at(mesh(G.sph(0.05, 6, 4), 0x111111), 0.1, 0.06, 0.22));
    g.add(at(head, 0, 0.85, 0.45)); // mira hacia el jugador (+z)
    const tail = mesh(G.cap(0.12, 0.45), 0xe8590c);
    tail.rotation.x = -0.8;
    g.add(at(tail, 0, 0.75, -0.55));
    g.add(at(mesh(G.sph(0.12, 8, 6), 0xffffff), 0, 0.95, -0.75));
    [[-0.15, 0.25], [0.15, 0.25], [-0.15, -0.25], [0.15, -0.25]].forEach(([x, z]) => {
      const l = mesh(G.cyl(0.06, 0.06, 0.4, 6), 0x222222);
      l.name = "leg";
      g.add(at(l, x, 0.2, z));
    });
    return g;
  }
  function truck() {
    const g = new T.Group();
    const side = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = "#fff3bf"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#e03131"; c.font = "bold 40px sans-serif"; c.textAlign = "center";
      c.fillText("FOOD", w / 2, 52); c.fillText("TRUCK", w / 2, 98);
    });
    const boxMats = [new T.MeshLambertMaterial({ map: side }), new T.MeshLambertMaterial({ map: side }), mat(0xfff3bf), mat(0xfff3bf), new T.MeshLambertMaterial({ map: side }), mat(0xfff3bf)];
    const box = new T.Mesh(G.box(1.8, 1.8, 2.6), boxMats);
    box.castShadow = true;
    g.add(at(box, 0, 1.45, -0.4));
    g.add(at(mesh(G.box(1.8, 1.2, 1.1), 0xe03131), 0, 1.0, 1.45));
    g.add(at(mesh(G.box(1.6, 0.5, 0.05), mat(0x99e9f2, { emissive: 0x113344 })), 0, 1.3, 2.01));
    [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.0], [0.9, -1.0]].forEach(([x, z]) => {
      const w = mesh(G.cyl(0.35, 0.35, 0.25, 14), 0x212529);
      w.rotation.z = Math.PI / 2;
      g.add(at(w, x, 0.35, z));
    });
    g.add(at(mesh(G.sph(0.12, 8, 6), mat(0xffffcc, { emissive: 0xffff88 })), -0.6, 0.85, 2.02));
    g.add(at(mesh(G.sph(0.12, 8, 6), mat(0xffffcc, { emissive: 0xffff88 })), 0.6, 0.85, 2.02));
    const b = burger(0.6);
    g.add(at(b, 0, 2.4, -0.4));
    return g;
  }

  // ---------- Ítems saludables ----------
  function apple() {
    const g = new T.Group();
    const a = mesh(G.sph(0.32), mat(0xe03131, { emissive: 0x330000 }));
    a.scale.y = 0.9;
    g.add(a);
    g.add(at(mesh(G.cyl(0.03, 0.03, 0.18, 6), 0x5c3317), 0, 0.33, 0));
    const leaf = mesh(G.sph(0.1, 8, 6), 0x2f9e44);
    leaf.scale.set(1.5, 0.4, 0.8);
    g.add(at(leaf, 0.1, 0.38, 0));
    return g;
  }
  function waterDrop() {
    const g = new T.Group();
    const m = mat(0x4dabf7, { transparent: true, opacity: 0.85, emissive: 0x0b3d66 });
    g.add(mesh(G.sph(0.3), m));
    const tip = mesh(G.cone(0.26, 0.42, 16), m);
    g.add(at(tip, 0, 0.33, 0));
    return g;
  }
  function sneaker() {
    const g = new T.Group();
    g.add(at(mesh(G.box(0.36, 0.12, 0.7), 0xffffff), 0, -0.1, 0));
    g.add(at(mesh(G.box(0.34, 0.25, 0.5), mat(0x4dabf7, { emissive: 0x0b2d55 })), 0, 0.08, 0.08));
    g.add(at(mesh(G.box(0.3, 0.18, 0.25), mat(0x4dabf7, { emissive: 0x0b2d55 })), 0, 0.02, -0.25));
    g.rotation.y = 0.6;
    return g;
  }
  function broccoli() {
    const g = new T.Group();
    g.add(at(mesh(G.cyl(0.08, 0.12, 0.4, 8), 0x8ce99a), 0, -0.15, 0));
    [[0, 0.2, 0, 0.22], [-0.18, 0.12, 0, 0.17], [0.18, 0.12, 0, 0.17], [0, 0.12, 0.16, 0.16], [0, 0.12, -0.16, 0.16]].forEach(([x, y, z, r]) =>
      g.add(at(mesh(G.sph(r, 10, 8), mat(0x2f9e44, { emissive: 0x0a2a10 })), x, y, z)));
    return g;
  }
  function salad() {
    const g = new T.Group();
    g.add(at(mesh(new T.SphereGeometry(0.38, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xffffff, { side: T.DoubleSide })), 0, 0, 0));
    for (let i = 0; i < 9; i++) g.add(at(mesh(G.sph(0.1, 6, 5), [0x51cf66, 0x2f9e44, 0xe03131][i % 3]), Math.cos(i * 0.7) * 0.2, 0.02 + (i % 2) * 0.05, Math.sin(i * 0.7) * 0.2));
    return g;
  }

  const BUILDERS = {
    burger: () => burger(1), pizza, donut, fries, hotdog, chicharron: bacon, chicken, chocolate, taco,
    soda: () => soda(), icecream, cake, cupcake, oil, buffet, combo, vending,
    proteinbar, smoothie, granola, influencer, fox, sign2x1, truck,
    apple, water: waterDrop, tenis: sneaker, broccoli, salad
  };

  function protoFor(type) {
    if (!protos[type]) protos[type] = (BUILDERS[type] || (() => burger(1)))();
    return protos[type];
  }

  // ---------- Personajes ----------
  function buildDora(faceTex) {
    const skin = 0xf0a060;
    const root = new T.Group();
    const spinner = at(new T.Group(), 0, 1.0, 0); // eje para la voltereta al rodar
    root.add(spinner);
    const body = at(new T.Group(), 0, -1.0, 0);
    spinner.add(body);
    const legs = [];
    [-0.15, 0.15].forEach((x) => {
      const pivot = at(new T.Group(), x, 0.86, 0);
      pivot.add(at(mesh(G.cyl(0.085, 0.08, 0.62, 10), skin), 0, -0.33, 0));
      pivot.add(at(mesh(G.cyl(0.1, 0.1, 0.1, 10), 0xffd43b), 0, -0.6, 0));
      pivot.add(at(mesh(G.box(0.2, 0.15, 0.34), 0xf8f0fb), 0, -0.74, -0.05));
      pivot.add(at(mesh(G.box(0.21, 0.05, 0.35), 0xd0bfff), 0, -0.8, -0.05));
      body.add(pivot);
      legs.push(pivot);
    });
    body.add(at(mesh(G.cyl(0.32, 0.3, 0.32, 16), 0xf76707), 0, 0.92, 0));
    const torso = mesh(G.sph(0.36, 18, 14), 0xf03e8f);
    torso.scale.set(1, 1.15, 0.85);
    body.add(at(torso, 0, 1.33, 0));
    const belly = mesh(G.sph(0.27, 16, 12), skin);
    body.add(at(belly, 0, 1.08, -0.12));
    const arms = [];
    [-0.42, 0.42].forEach((x) => {
      const pivot = at(new T.Group(), x, 1.58, 0);
      pivot.add(at(mesh(G.cyl(0.075, 0.07, 0.55, 8), skin), 0, -0.28, 0));
      pivot.add(at(mesh(G.sph(0.09, 8, 6), skin), 0, -0.58, 0));
      body.add(pivot);
      arms.push(pivot);
    });
    // Mochila con Mapa
    const pack = mesh(G.box(0.58, 0.62, 0.3), 0x7e3fbf);
    body.add(at(pack, 0, 1.36, 0.36));
    body.add(at(mesh(G.box(0.6, 0.18, 0.32), 0x9b59d0), 0, 1.66, 0.36));
    body.add(at(mesh(G.box(0.4, 0.22, 0.1), 0x9b59d0), 0, 1.2, 0.53));
    const mapa = new T.Group();
    mapa.add(mesh(G.cyl(0.1, 0.1, 0.55, 12), 0xfff3bf));
    [-0.04, 0.05].forEach((x) => {
      mapa.add(at(mesh(G.sph(0.035, 8, 6), 0xffffff), x, 0.15, 0.09));
      mapa.add(at(mesh(G.sph(0.018, 6, 4), 0x111111), x, 0.15, 0.12));
    });
    mapa.rotation.z = 0.35;
    body.add(at(mapa, -0.2, 1.72, 0.5));
    // Cabeza: pelo afro, cara de la foto adelante
    const head = at(new T.Group(), 0, 1.92, 0);
    head.add(mesh(G.sph(0.21, 16, 12), skin));
    const hairMat = mat(0x2b1d14, { flatShading: true });
    const hair = mesh(new T.IcosahedronGeometry(0.33, 1), hairMat);
    hair.scale.set(1.05, 0.95, 1.0);
    head.add(at(hair, 0, 0.07, 0.07));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      head.add(at(mesh(new T.IcosahedronGeometry(0.13, 0), hairMat), Math.cos(a) * 0.3, 0.12 + Math.sin(i * 1.7) * 0.12, 0.08 + Math.sin(a) * 0.25));
    }
    const face = new T.Mesh(new T.CircleGeometry(0.24, 32), new T.MeshLambertMaterial({ map: faceTex, transparent: true }));
    face.rotation.y = Math.PI;
    head.add(at(face, 0, -0.02, -0.25));
    body.add(head);
    return { root, spinner, body, base: -1.0, legs, arms, belly, torso, head };
  }

  function buildBotas(faceTex) {
    const fur = 0x9d94c9;
    const root = new T.Group();
    const body = new T.Group();
    root.add(body);
    const legs = [];
    [-0.12, 0.12].forEach((x) => {
      const pivot = at(new T.Group(), x, 0.42, 0);
      pivot.add(at(mesh(G.cyl(0.06, 0.06, 0.25, 8), fur), 0, -0.12, 0));
      const boot = mesh(G.sph(0.14, 12, 10), 0xe03131);
      boot.scale.set(1, 0.85, 1.35);
      pivot.add(at(boot, 0, -0.3, -0.05));
      body.add(pivot);
      legs.push(pivot);
    });
    const torso = mesh(G.sph(0.24, 14, 12), fur);
    torso.scale.set(1, 1.25, 0.9);
    body.add(at(torso, 0, 0.7, 0));
    body.add(at(mesh(G.sph(0.17, 12, 10), 0xffd43b), 0, 0.66, -0.12));
    const arms = [];
    [-0.27, 0.27].forEach((x) => {
      const pivot = at(new T.Group(), x, 0.86, 0);
      pivot.add(at(mesh(G.cyl(0.05, 0.05, 0.35, 8), fur), 0, -0.17, 0));
      body.add(pivot);
      arms.push(pivot);
    });
    const tail = mesh(new T.TorusGeometry(0.18, 0.04, 6, 16, Math.PI * 1.4), 0xffd43b);
    body.add(at(tail, 0, 0.6, 0.28));
    const head = at(new T.Group(), 0, 1.17, 0);
    head.add(mesh(G.sph(0.26, 16, 12), fur));
    [-0.27, 0.27].forEach((x) => {
      const ear = mesh(G.cyl(0.12, 0.12, 0.04, 14), fur);
      ear.rotation.z = Math.PI / 2;
      head.add(at(ear, x, 0.06, 0));
      const inner = mesh(G.cyl(0.08, 0.08, 0.05, 12), 0xff8fab);
      inner.rotation.z = Math.PI / 2;
      head.add(at(inner, x * 1.03, 0.06, -0.01));
    });
    const face = new T.Mesh(new T.CircleGeometry(0.23, 32), new T.MeshLambertMaterial({ map: faceTex, transparent: true }));
    face.rotation.y = Math.PI;
    head.add(at(face, 0, -0.01, -0.27));
    body.add(head);
    root.rotation.y = Math.PI; // Botas corre mirando a la cámara, alentando
    return { root, body, legs, arms, head };
  }

  // ---------- Jefe y templo ----------
  function buildBoss() {
    const g = new T.Group();
    const b = burger(3.2);
    g.add(b);
    const crown = new T.Group();
    const gold = mat(0xffd43b, { emissive: 0x4d3800 });
    crown.add(mesh(G.cyl(0.9, 0.9, 0.45, 20, true), mat(0xffd43b, { emissive: 0x4d3800, side: T.DoubleSide })));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      crown.add(at(mesh(G.cone(0.16, 0.45, 6), gold), Math.cos(a) * 0.85, 0.42, Math.sin(a) * 0.85));
      crown.add(at(mesh(G.sph(0.08, 6, 4), mat(0xe03131, { emissive: 0x440000 })), Math.cos(a) * 0.9, 0.05, Math.sin(a) * 0.9));
    }
    g.add(at(crown, 0, 3.55, 0));
    [-0.6, 0.6].forEach((x) => {
      g.add(at(mesh(G.sph(0.32), 0xffffff), x, 2.55, 1.55));
      g.add(at(mesh(G.sph(0.15), 0x111111), x * 0.9, 2.5, 1.82));
      const brow = mesh(G.box(0.7, 0.14, 0.14), 0x111111);
      brow.rotation.z = x < 0 ? -0.45 : 0.45;
      g.add(at(brow, x, 2.98, 1.7));
    });
    const f = fries(); f.scale.setScalar(1.6); g.add(at(f, -3.0, 0.5, 0));
    const s = soda(); s.scale.setScalar(1.6); g.add(at(s, 3.0, 0.5, 0));
    g.userData.sides = [f, s];
    g.add(at(label("EL REY COMBO AGRANDADO", "rgba(201,42,42,.92)", "#fff", 0.9), 0, 5.0, 0));
    return g;
  }
  function buildTemple() {
    const g = new T.Group();
    const marble = mat(0xe9ecef);
    g.add(at(mesh(G.box(9, 0.5, 5), marble), 0, 0.25, 0));
    g.add(at(mesh(G.box(8.4, 0.4, 4.6), marble), 0, 0.7, 0));
    for (let i = 0; i < 6; i++) g.add(at(mesh(G.cyl(0.32, 0.36, 4, 14), marble), -3.5 + i * 1.4, 2.9, 1.6));
    g.add(at(mesh(G.box(8.6, 0.5, 4.8), marble), 0, 5.1, 0));
    const roof = new T.Shape();
    roof.moveTo(-4.5, 0); roof.lineTo(4.5, 0); roof.lineTo(0, 1.8); roof.closePath();
    const pediment = mesh(new T.ExtrudeGeometry(roof, { depth: 4.8, bevelEnabled: false }), marble);
    g.add(at(pediment, 0, 5.35, -2.4));
    const bowl = salad();
    bowl.scale.setScalar(3.5);
    g.add(at(bowl, 0, 7.8, 0));
    const glow = new T.PointLight(0xfff3bf, 2, 30);
    g.add(at(glow, 0, 6, 4));
    g.add(at(label("TEMPLO DE LA ENSALADA LEGENDARIA", "rgba(43,138,62,.95)", "#fff", 0.8), 0, 10.2, 0));
    return g;
  }

  // ---------- Escenario ----------
  const billboardTexts = [
    "¡2x1 EN ARREPENTIMIENTO!",
    "GIMNASIO: CERRADO POR FERIADO",
    "DIETA: PRÓXIMAMENTE",
    "LUNES: EMPIEZO (DESDE 2019)",
    "COMBO AGRANDADO: ¡AHORA MÁS GRANDE!",
    "TÉ DETOX: ADELGAZA TU BILLETERA",
    "ENSALADA: SE BUSCA",
    "DELIVERY 24/7: NUNCA ESTARÁS SOLO",
    "PIZZA = VERDURA (SEGÚN LA PIZZA)",
    "¿CORRER? SOLO AL FOOD TRUCK"
  ];

  function palm() {
    const g = new T.Group();
    const trunkMat = mat(0x8d6e4c, { flatShading: true });
    let y = 0;
    for (let i = 0; i < 6; i++) {
      const seg = mesh(G.cyl(0.18 - i * 0.015, 0.22 - i * 0.015, 0.9, 7), trunkMat);
      seg.position.set(i * i * 0.03, y + 0.45, 0);
      seg.rotation.z = -i * 0.05;
      g.add(seg);
      y += 0.85;
    }
    const top = new T.Group();
    for (let i = 0; i < 7; i++) {
      const leaf = mesh(G.box(0.5, 0.05, 2.4), mat(0x2f9e44, { flatShading: true }));
      leaf.position.z = 1.0;
      const holder = new T.Group();
      holder.rotation.y = (i / 7) * Math.PI * 2;
      holder.rotation.x = 0;
      leaf.rotation.x = 0.45;
      holder.add(leaf);
      top.add(holder);
    }
    g.add(at(top, 0.75, y, 0));
    return g;
  }
  function bush() {
    const g = new T.Group();
    for (let i = 0; i < 3; i++) g.add(at(mesh(G.sph(0.6 - i * 0.12, 8, 6), mat(i % 2 ? 0x37b24d : 0x2b8a3e, { flatShading: true })), i * 0.5 - 0.5, 0.4, (i % 2) * 0.3));
    if (Math.random() < 0.6) g.add(at(mesh(G.sph(0.12, 6, 4), 0xff6b9d), 0.1, 0.95, -0.2));
    return g;
  }
  function billboard(text) {
    const g = new T.Group();
    const tex = canvasTex(512, 200, (c, w, h) => {
      c.fillStyle = "#fff8e7"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#7048a8"; c.fillRect(0, 0, w, 14); c.fillRect(0, h - 14, w, 14);
      c.fillStyle = "#c92a2a"; c.font = "bold 40px 'Trebuchet MS', sans-serif"; c.textAlign = "center";
      const words = text.split(" "); const lines = []; let line = "";
      for (const wd of words) { const t = line ? line + " " + wd : wd; if (c.measureText(t).width > w - 40) { lines.push(line); line = wd; } else line = t; }
      lines.push(line);
      lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + 14 + (i - (lines.length - 1) / 2) * 46));
    });
    const board = new T.Mesh(G.box(3.4, 1.35, 0.1), [mat(0x7048a8), mat(0x7048a8), mat(0x7048a8), mat(0x7048a8), new T.MeshLambertMaterial({ map: tex }), mat(0x7048a8)]);
    board.castShadow = true;
    g.add(at(board, 0, 2.4, 0));
    g.add(at(mesh(G.cyl(0.07, 0.07, 1.8, 8), 0x495057), -1.2, 0.9, 0));
    g.add(at(mesh(G.cyl(0.07, 0.07, 1.8, 8), 0x495057), 1.2, 0.9, 0));
    return g;
  }
  function partyArch() {
    const g = new T.Group();
    g.add(at(mesh(G.cyl(0.08, 0.08, 4.2, 8), 0xffffff), -3.8, 2.1, 0));
    g.add(at(mesh(G.cyl(0.08, 0.08, 4.2, 8), 0xffffff), 3.8, 2.1, 0));
    const colors = [0xff6b6b, 0xffd43b, 0x4dabf7, 0xb197fc, 0x63e6be];
    for (let i = 0; i < 15; i++) {
      const x = -3.6 + i * 0.52;
      const y = 4.0 - Math.sin((i / 14) * Math.PI) * 0.7;
      const flag = mesh(G.cone(0.2, 0.42, 3), colors[i % colors.length]);
      flag.rotation.x = Math.PI;
      g.add(at(flag, x, y, 0));
    }
    const balloon1 = mesh(G.sph(0.35, 12, 10), 0xff6b9d); g.add(at(balloon1, -3.8, 4.5, 0));
    const balloon2 = mesh(G.sph(0.35, 12, 10), 0x74c0fc); g.add(at(balloon2, 3.8, 4.5, 0));
    return g;
  }

  function buildScenery() {
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1;
      const p = palm();
      p.scale.setScalar(0.9 + Math.random() * 0.5);
      p.rotation.y = Math.random() * 6;
      p.userData = { baseX: side * (6 + Math.random() * 6), z: -i * (SCENERY_LEN / 26) };
      scenery.push(p);
      world.add(p);
    }
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1;
      const b = bush();
      b.userData = { baseX: side * (4.2 + Math.random() * 1.2), z: -i * (SCENERY_LEN / 24) - 2 };
      scenery.push(b);
      world.add(b);
    }
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const b = billboard(billboardTexts[i % billboardTexts.length]);
      b.rotation.y = side > 0 ? -0.55 : 0.55;
      b.userData = { baseX: side * 5.3, z: -10 - i * (SCENERY_LEN / 6), billboard: true };
      scenery.push(b);
      world.add(b);
    }
    for (let i = 0; i < 4; i++) {
      const a = partyArch();
      a.userData = { baseX: 0, z: -i * (SCENERY_LEN / 4), arch: true };
      arches.push(a);
      scenery.push(a);
      world.add(a);
    }
    // Montañas y volcán al fondo
    for (let i = 0; i < 9; i++) {
      const m = mesh(G.cone(14 + Math.random() * 10, 16 + Math.random() * 14, 7), mat(i % 2 ? 0x3d8f5a : 0x2f7a4a, { flatShading: true }));
      m.castShadow = false;
      scene.add(at(m, -90 + i * 22, 6, -160 - Math.random() * 20));
    }
  }

  function buildGround() {
    pathTex = canvasTex(256, 512, (c, w, h) => {
      c.fillStyle = "#d9a865"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        c.fillStyle = Math.random() < 0.5 ? "rgba(140,90,40,.18)" : "rgba(255,240,200,.18)";
        c.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 5, 3 + Math.random() * 5);
      }
      c.fillStyle = "rgba(255,248,231,.85)";
      [w / 3, (2 * w) / 3].forEach((x) => { for (let y = 0; y < h; y += 128) c.fillRect(x - 4, y, 8, 64); });
      c.fillStyle = "rgba(90,55,20,.5)"; c.fillRect(0, 0, 8, h); c.fillRect(w - 8, 0, 8, h);
    });
    pathTex.wrapS = pathTex.wrapT = T.RepeatWrapping;
    pathTex.repeat.set(1, 12);
    const path = new T.Mesh(new T.PlaneGeometry(6.2, 160), new T.MeshLambertMaterial({ map: pathTex }));
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0, -70);
    path.receiveShadow = true;
    scene.add(path);

    grassTex = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = "#3a9d5d"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        c.fillStyle = Math.random() < 0.5 ? "rgba(20,90,40,.35)" : "rgba(150,220,120,.25)";
        c.fillRect(Math.random() * w, Math.random() * h, 2, 6);
      }
    });
    grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping;
    grassTex.repeat.set(20, 40);
    const grass = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshLambertMaterial({ map: grassTex }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.02, -70);
    grass.receiveShadow = true;
    scene.add(grass);

    // Bordes de piedra del camino
    [-3.2, 3.2].forEach((x) => {
      const curb = new T.Mesh(G.box(0.3, 0.18, 160), mat(0x9c8b74));
      curb.position.set(x, 0.09, -70);
      curb.receiveShadow = true;
      scene.add(curb);
    });

    // Franjas rojas de aviso (food truck y jefe)
    for (let i = 0; i < 3; i++) {
      const s = new T.Mesh(new T.PlaneGeometry(1.9, 1), new T.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.35, depthWrite: false }));
      s.rotation.x = -Math.PI / 2;
      s.visible = false;
      s.renderOrder = 2;
      scene.add(s);
      warnStrips.push(s);
    }
  }

  // ---------- Partículas ----------
  function buildParticles() {
    const geo = G.box(0.12, 0.12, 0.12);
    for (let i = 0; i < 80; i++) {
      const p = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xffffff }));
      p.visible = false;
      p.userData = { life: 0 };
      scene.add(p);
      particles.push(p);
    }
  }
  function burst(lx, ly, color, n = 12) {
    if (!ready) return;
    const x = toX(lx);
    const z = (ly - PLAYER_Y) * K;
    let used = 0;
    for (const p of particles) {
      if (p.userData.life > 0) continue;
      p.material.color.set(color);
      p.position.set(x, 0.8, z);
      p.userData = { life: 0.6 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 6 };
      p.visible = true;
      if (++used >= n) break;
    }
  }

  // ---------- Inicio ----------
  function init(canvas, playerY) {
    PLAYER_Y = playerY;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    } catch (e) {
      return false;
    }
    if (!renderer.getContext()) return false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;

    scene = new T.Scene();
    scene.background = new T.Color(0x8fd3ff);
    scene.fog = new T.Fog(0x8fd3ff, 35, 95);
    camera = new T.PerspectiveCamera(70, 540 / 960, 0.1, 260);

    hemi = new T.HemisphereLight(0xdff4ff, 0x4a7a3a, 1.1);
    scene.add(hemi);
    sun = new T.DirectionalLight(0xfff1d6, 1.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 18, bottom: -10, near: 1, far: 60 });
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    scene.add(sun.target);

    world = new T.Group();
    scene.add(world);
    buildGround();
    buildScenery();
    buildParticles();

    const loader = new T.TextureLoader();
    const faceD = loader.load("assets/face_dora.png");
    const faceB = loader.load("assets/face_botas.png");
    faceD.colorSpace = faceB.colorSpace = T.SRGBColorSpace;
    playerRig = buildDora(faceD);
    playerRig.root.scale.setScalar(0.92);
    scene.add(playerRig.root);
    botasRig = buildBotas(faceB);
    botasRig.root.scale.setScalar(0.85);
    scene.add(botasRig.root);

    shieldBubble = new T.Mesh(G.sph(1.25, 20, 14), new T.MeshLambertMaterial({ color: 0x40c057, transparent: true, opacity: 0.22, emissive: 0x0d3d14, depthWrite: false }));
    shieldBroc = broccoli();
    shieldBroc.scale.setScalar(0.6);
    scene.add(shieldBubble, shieldBroc);

    bossRig = buildBoss();
    bossRig.visible = false;
    scene.add(bossRig);
    templeRig = buildTemple();
    templeRig.visible = false;
    scene.add(templeRig);
    truckRig = truck();
    truckRig.visible = false;
    truckRig.add(at(label("FOOD TRUCK", "rgba(201,42,42,.92)", "#fff", 0.6), 0, 3.6, 0));
    scene.add(truckRig);

    ready = true;
    return true;
  }

  function resize(cssW, cssH, dpr) {
    if (!ready) return;
    renderer.setPixelRatio(Math.min(dpr, 1.75));
    renderer.setSize(cssW, cssH, false);
    camera.aspect = cssW / cssH;
    camera.updateProjectionMatrix();
  }

  // ---------- Cuadro por cuadro ----------
  function syncEntities(list, kind, time) {
    const seen = new Set();
    for (const o of list) {
      seen.add(o);
      let m = meshes.get(o);
      if (!m) {
        m = protoFor(o.type).clone();
        const info = kind.defs[o.type] || {};
        const name = info.name || "";
        if (kind.label && name) {
          const bg = info.trap ? "rgba(43,138,62,.92)" : o.type === "fox" ? "rgba(232,89,12,.92)" :
            info.overhead || info.jump === false ? "rgba(201,42,42,.9)" : "rgba(0,0,0,.6)";
          const top = info.overhead ? 2.05 : info.jump === false ? 2.3 : 1.75;
          m.add(at(label(info.tag ? info.tag + " · " + name : name, bg), 0, top, 0));
        }
        if (kind.item) {
          const ring = new T.Mesh(new T.RingGeometry(0.45, 0.6, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = -0.75;
          m.add(ring);
        }
        m.userData = { spin: m.getObjectByName("spin"), legs: m.children.filter((c) => c.name === "leg") };
        world.add(m);
        meshes.set(o, m);
      }
      const lx = o.x ?? kind.laneX[o.lane];
      const z = (o.y - PLAYER_Y) * K;
      if (kind.item) {
        m.position.set(toX(lx), 0.95 + Math.sin(time * 4 + (o.seed || 0)) * 0.12, z);
        m.rotation.y = time * 2 + (o.seed || 0);
      } else {
        m.position.set(toX(lx), 0, z);
        if (m.userData.spin) m.userData.spin.rotation.z = -time * 6;
        if (o.type === "influencer") m.position.y = Math.abs(Math.sin(time * 6 + o.seed)) * 0.15;
        if (o.type === "fox" && m.userData.legs.length) {
          m.userData.legs.forEach((l, i) => { l.rotation.x = Math.sin(time * 16 + i * Math.PI) * 0.7; });
          m.position.y = Math.abs(Math.sin(time * 16)) * 0.08;
        }
        if (o.type === "soda" || o.type === "smoothie") m.rotation.z = Math.sin(time * 5 + o.seed) * 0.06;
      }
    }
    for (const [o, m] of meshes) {
      if (m.userData.kind === kind.name && !seen.has(o)) {
        world.remove(m);
        meshes.delete(o);
      }
    }
    for (const o of list) meshes.get(o).userData.kind = kind.name;
  }

  function animateCharacter(rig, phase, airborne, rolling) {
    const swing = airborne ? 0 : Math.sin(phase);
    rig.legs[0].rotation.x = airborne ? -0.9 : swing * 0.85;
    rig.legs[1].rotation.x = airborne ? -0.4 : -swing * 0.85;
    rig.arms[0].rotation.x = airborne ? -2.4 : -swing * 0.9;
    rig.arms[1].rotation.x = airborne ? -2.4 : swing * 0.9;
    rig.arms[0].rotation.z = airborne ? -0.3 : -0.12;
    rig.arms[1].rotation.z = airborne ? 0.3 : 0.12;
    rig.body.position.y = (rig.base || 0) + (airborne || rolling ? 0 : Math.abs(Math.cos(phase)) * 0.07);
  }

  function render(s) {
    if (!ready) return;
    const { state, g, player, obstacles, items, laneX, defs, itemDefs, time, scroll, menu } = s;
    const dt = Math.min(0.05, Math.max(0, time - lastTime));
    lastTime = time;

    // Suelo que avanza
    const travel = scroll * K;
    pathTex.offset.y = (travel / (160 / 12)) % 1;
    grassTex.offset.y = (travel / (200 / 40)) % 1;

    // Ambiente según evento
    const sky = g.boss && g.boss.active ? 0xffb199 : g.fit ? 0xb2f2bb : g.party ? 0xffd6e8 : g.ending ? 0xfff3bf : 0x8fd3ff;
    scene.background.lerp(new T.Color(sky), Math.min(1, dt * 2));
    scene.fog.color.copy(scene.background);

    // Decoración reciclada
    for (const o of scenery) {
      let z = o.userData.z + travel;
      z = ((z + 12) % SCENERY_LEN + SCENERY_LEN) % SCENERY_LEN - (SCENERY_LEN - 12);
      o.position.set(o.userData.baseX, 0, z);
      if (o.userData.arch) o.visible = !!g.party;
    }

    // Comida e ítems
    syncEntities(obstacles, { name: "obs", laneX, defs, label: true }, time);
    syncEntities(items, { name: "item", laneX, defs: itemDefs, item: true }, time);

    // Jugador
    const px = toX(player.x);
    const jumpY = player.jumpH * JUMP_M;
    const rolling = player.rollTime > 0;
    const airborne = player.jumping;
    if (!s.frozen) runPhase += dt * (menu ? 9 : 13 * Math.min(1.6, (g.speed || 330) / 330));
    const pr = playerRig;
    pr.root.position.set(px, jumpY, 0);
    pr.root.rotation.z = (player.targetX - player.x) / -260;
    animateCharacter(pr, runPhase, airborne, rolling);
    if (rolling) {
      const t = 1 - player.rollTime / 0.65;
      pr.spinner.rotation.x = -t * Math.PI * 2;
      pr.root.scale.set(0.92, 0.55, 0.92);
    } else {
      pr.spinner.rotation.x = 0;
      pr.root.scale.set(0.92, 0.92, 0.92);
    }
    const fat = (g.barriga || 0) / 100;
    pr.belly.scale.setScalar(1 + fat * 1.1);
    pr.torso.scale.set(1 + fat * 0.45, 1.15, 0.85 + fat * 0.35);
    // Al recibir un golpe, Doras se da vuelta y mira a cámara
    const wantTurn = player.squash > 0.05 || state.screen === "gameover" || state.screen === "victory" ? 1 : 0;
    headTurn += (wantTurn - headTurn) * Math.min(1, dt * 12);
    pr.head.rotation.y = headTurn * Math.PI;
    pr.root.visible = !menu && !(player.invul > 0 && Math.floor(time * 16) % 2 === 0 && state.screen === "playing");

    const br = botasRig;
    br.root.visible = !menu;
    br.root.position.set(px + (player.lane === 2 ? -0.95 : 0.95), Math.max(0, jumpY - 0.25), -1.3);
    animateCharacter(br, runPhase + 1, airborne, false);
    br.head.rotation.z = Math.sin(time * 4) * 0.15;

    shieldBubble.visible = shieldBroc.visible = !!player.shield;
    if (player.shield) {
      shieldBubble.position.set(px, jumpY + 1.05, 0);
      shieldBroc.position.set(px + Math.cos(time * 3) * 1.1, jumpY + 1.6, Math.sin(time * 3) * 1.1);
      shieldBroc.rotation.y = time * 3;
    }

    // Jefe
    const boss = g.boss || {};
    bossRig.visible = !!boss.active;
    if (boss.active) {
      bossRig.position.set(toX(boss.x) * 1.5, 1.6 + Math.sin(time * 2.4) * 0.5, (s.bossY - PLAYER_Y) * K - 4);
      bossRig.rotation.y = Math.sin(time * 1.3) * 0.25;
      const pulse = 1 + Math.sin(time * 5) * 0.03 + (boss.hurt > 0 ? 0.06 : 0);
      bossRig.scale.setScalar(1.9 * pulse);
      bossRig.userData.sides.forEach((o, i) => { o.position.y = 0.5 + Math.sin(time * 4 + i * 2) * 0.6; });
    }

    // Franjas de aviso
    const warns = [];
    if (boss.active) {
      if (boss.warnLane >= 0) warns.push([boss.warnLane, (s.bossY - PLAYER_Y) * K]);
      if (boss.warnLane2 >= 0) warns.push([boss.warnLane2, (s.bossY - PLAYER_Y) * K]);
    }
    const tr = g.truck || {};
    if (tr.active && !tr.charging) warns.push([tr.lane, -75]);
    warnStrips.forEach((st, i) => {
      const w = warns[i];
      st.visible = !!w;
      if (!w) return;
      const len = -w[1] + 4;
      st.scale.set(1, len, 1);
      st.position.set(toX(laneX[w[0]]), 0.04, w[1] / 2 + 2);
      st.material.opacity = Math.floor(time * 10) % 2 ? 0.45 : 0.18;
    });

    // Food truck
    truckRig.visible = !!(tr.active && tr.charging);
    if (truckRig.visible) truckRig.position.set(toX(laneX[tr.lane]), 0, (tr.y - PLAYER_Y) * K);

    // Templo del final
    templeRig.visible = !!g.ending || state.screen === "victory";
    if (templeRig.visible) {
      const t = g.ending ? 1 - g.endingTimer / s.endingDuration : 1;
      templeRig.position.set(0, 0, -95 + Math.min(1, t * 1.25) * 78);
    }

    // Partículas
    for (const p of particles) {
      if (p.userData.life <= 0) continue;
      const u = p.userData;
      u.life -= dt;
      u.vy -= 12 * dt;
      p.position.x += u.vx * dt;
      p.position.y = Math.max(0.05, p.position.y + u.vy * dt);
      p.position.z += u.vz * dt;
      p.rotation.x += dt * 8;
      if (u.life <= 0) p.visible = false;
    }

    // Cámara detrás del jugador
    camX += (px * 0.65 - camX) * Math.min(1, dt * 6);
    let shake = 0;
    if (g.flash > 0) shake = g.flash * 0.6;
    if (menu && state.screen !== "playing") {
      camera.position.set(camX + Math.sin(time * 0.3) * 0.6, 3.1, 6.4);
      camera.lookAt(camX * 0.8, 1.3, -10);
    } else {
      camera.position.set(camX + (Math.random() - 0.5) * shake, 4.3 + jumpY * 0.3 + (Math.random() - 0.5) * shake, 6.6);
      camera.lookAt(camX * 0.85, 0.7 + jumpY * 0.25, -10);
    }

    // Sol y sombra siguen al jugador
    sun.position.set(px + 6, 14, 8);
    sun.target.position.set(px, 0, -6);

    renderer.render(scene, camera);
  }

  window.Doras3D = { init, resize, render, burst, debug: () => ({ boss: bossRig && bossRig.visible, bossPos: bossRig && bossRig.position.toArray(), temple: templeRig && templeRig.position.toArray(), cam: camera && camera.position.toArray() }) };
})();
