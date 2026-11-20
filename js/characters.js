// Chicago Bois – people (player, pedestrians, police), their looks, and pedestrian AI.
'use strict';
(function (CB) {
  const M = CB.M, C = CB.C, hex = M.hex;

  // ------------------------------------------------------------------ looks
  // A look describes body and clothes. Colours are 0xRRGGBB numbers (easy to save).
  const SKINS = [0xffe0c4, 0xf3caa6, 0xe8b48f, 0xd59d70, 0xbb7f52, 0x96603a, 0x70442a, 0x4c2d1d];
  const HAIR_COLS = [0x16120f, 0x2e1d12, 0x4b2e1a, 0x6e4a2a, 0x9a6b3c, 0xd2ae6d, 0x8e3b1e, 0x8a8a8a, 0xe3e3e3, 0x2b5fd9, 0xd94da0];
  const TOP_COLS = [0xc8102e, 0x0e3386, 0x111111, 0xf4f4f4, 0x2ecc71, 0xf1c40f, 0x8e44ad, 0x41b6e6, 0xe67e22, 0x7f8c8d,
    0x16a085, 0xce1141, 0x5d4037, 0xd98fb0, 0x27251f, 0xb7c9a8];
  const PANTS_COLS = [0x2f4a73, 0x3d5d8f, 0x1f2f4a, 0x1b1b1d, 0x5d6d7e, 0xb59f7a, 0x5a5f3a, 0x6e2c00, 0x8a2b2b, 0xd8d2c4];
  const SHOE_COLS = [0xf4f4f4, 0x111111, 0x5d4037, 0xc0392b, 0x2c3e50, 0xf1c40f, 0x41b6e6];
  const EYE_COLS = [0x3b2a1e, 0x3b2a1e, 0x3b2a1e, 0x2a5d8f, 0x3c6b3a, 0x6b4a2a];
  const OPT = {
    body: ['m', 'f'], build: ['slim', 'regular', 'heavy'], height: [0.94, 0.97, 1, 1.03, 1.06],
    hair: ['short', 'buzz', 'curly', 'long', 'ponytail', 'bun', 'afro', 'mohawk', 'bald'],
    facial: ['none', 'stubble', 'mustache', 'goatee', 'beard'],
    hat: ['none', 'cap', 'beanie'], glasses: ['none', 'shades'],
    top: ['tee', 'long', 'hoodie', 'jacket', 'tank'], bottom: ['jeans', 'shorts'],
  };
  CB.LOOK = { SKINS, HAIR_COLS, TOP_COLS, PANTS_COLS, SHOE_COLS, EYE_COLS: [0x3b2a1e, 0x6b4a2a, 0x2a5d8f, 0x3c6b3a, 0x7a8a99], OPT };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  CB.randomLook = function () {
    const f = Math.random() < 0.48;
    const hairs = f ? ['long', 'long', 'ponytail', 'bun', 'curly', 'afro', 'short'] : ['short', 'short', 'buzz', 'curly', 'bald', 'afro', 'mohawk', 'long'];
    const top = pick(['tee', 'tee', 'long', 'hoodie', 'jacket', 'jacket', 'tank']);
    return {
      body: f ? 'f' : 'm', build: pick(['slim', 'regular', 'regular', 'regular', 'heavy']), height: 0.93 + Math.random() * 0.14,
      skin: pick(SKINS), hair: pick(hairs), hairCol: Math.random() < 0.06 ? pick(HAIR_COLS.slice(9)) : pick(HAIR_COLS.slice(0, 9)),
      facial: f ? 'none' : pick(['none', 'none', 'none', 'stubble', 'mustache', 'goatee', 'beard']), eyes: pick(EYE_COLS),
      hat: Math.random() < 0.2 ? pick(['cap', 'beanie']) : 'none', hatCol: pick(TOP_COLS),
      glasses: Math.random() < 0.12 ? 'shades' : 'none',
      top, topCol: pick(TOP_COLS), accent: pick([0xf4f4f4, 0x111111, 0x7f8c8d, 0xc8102e]),
      bottom: Math.random() < 0.15 ? 'shorts' : 'jeans', pantsCol: pick(PANTS_COLS), shoes: pick(SHOE_COLS), chain: false,
    };
  };
  // Ready-made characters for the character screen (the first one is the default player).
  CB.PRESETS = [
    { name: 'Dre', body: 'm', build: 'regular', height: 1, skin: 0x96603a, hair: 'short', hairCol: 0x16120f, facial: 'stubble', eyes: 0x3b2a1e,
      hat: 'cap', hatCol: 0x0e3386, glasses: 'none', top: 'tee', topCol: 0xc8102e, accent: 0xf4f4f4, bottom: 'jeans', pantsCol: 0x1f2f4a, shoes: 0xf4f4f4, chain: true },
    { name: 'Rosa', body: 'f', build: 'regular', height: 1, skin: 0xd59d70, hair: 'ponytail', hairCol: 0x2e1d12, facial: 'none', eyes: 0x3b2a1e,
      hat: 'none', hatCol: 0x111111, glasses: 'shades', top: 'jacket', topCol: 0x111111, accent: 0xd98fb0, bottom: 'jeans', pantsCol: 0x3d5d8f, shoes: 0x111111, chain: true },
    { name: 'Big Tony', body: 'm', build: 'heavy', height: 1.03, skin: 0xf3caa6, hair: 'bald', hairCol: 0x4b2e1a, facial: 'beard', eyes: 0x3b2a1e,
      hat: 'none', hatCol: 0x111111, glasses: 'none', top: 'jacket', topCol: 0x5d4037, accent: 0xf4f4f4, bottom: 'jeans', pantsCol: 0x1b1b1d, shoes: 0x5d4037, chain: true },
    { name: 'Maya', body: 'f', build: 'slim', height: 0.97, skin: 0x4c2d1d, hair: 'afro', hairCol: 0x16120f, facial: 'none', eyes: 0x3b2a1e,
      hat: 'none', hatCol: 0xf1c40f, glasses: 'none', top: 'hoodie', topCol: 0xf1c40f, accent: 0xf4f4f4, bottom: 'shorts', pantsCol: 0x111111, shoes: 0xf4f4f4, chain: false },
    { name: 'Jimmy', body: 'm', build: 'slim', height: 1.06, skin: 0xffe0c4, hair: 'mohawk', hairCol: 0x8e3b1e, facial: 'none', eyes: 0x2a5d8f,
      hat: 'none', hatCol: 0x111111, glasses: 'none', top: 'tank', topCol: 0x111111, accent: 0xc8102e, bottom: 'jeans', pantsCol: 0x5d6d7e, shoes: 0xc0392b, chain: true },
    { name: 'Kenji', body: 'm', build: 'regular', height: 0.97, skin: 0xe8b48f, hair: 'curly', hairCol: 0x16120f, facial: 'goatee', eyes: 0x3b2a1e,
      hat: 'beanie', hatCol: 0x41b6e6, glasses: 'none', top: 'long', topCol: 0x16a085, accent: 0xf4f4f4, bottom: 'jeans', pantsCol: 0x5a5f3a, shoes: 0x111111, chain: false },
  ];
  // The player's character, saved in the browser (falls back to the first preset).
  const KEY = 'chicago-bois-character';
  CB.cleanLook = function (L) {
    const out = Object.assign({}, CB.PRESETS[0]);
    if (L && typeof L === 'object') {
      for (const k of Object.keys(OPT)) if (OPT[k].includes(L[k])) out[k] = L[k];
      if (typeof L.height === 'number') out.height = OPT.height.reduce((b, h) => (Math.abs(h - L.height) < Math.abs(b - L.height) ? h : b), 1);
      for (const k of ['skin', 'hairCol', 'hatCol', 'topCol', 'accent', 'pantsCol', 'shoes', 'eyes']) if (Number.isInteger(L[k]) && L[k] >= 0 && L[k] <= 0xffffff) out[k] = L[k];
      out.chain = !!L.chain;
      if (typeof L.name === 'string') out.name = L.name.slice(0, 24);
    }
    return out;
  };
  CB.loadCharacter = function () {
    try { return CB.cleanLook(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return CB.cleanLook(null); }
  };
  CB.saveCharacter = function (L) { try { localStorage.setItem(KEY, JSON.stringify(CB.cleanLook(L))); } catch (e) { /* storage blocked */ } };
  CB.playerLook = function () { return CB.loadCharacter(); };
  CB.copLook = function () {
    const L = CB.randomLook();
    return Object.assign(L, { top: 'long', topCol: 0x1f2f5c, bottom: 'jeans', pantsCol: 0x141c33, shoes: 0x111111, hat: 'police', hatCol: 0x1f2f5c,
      glasses: Math.random() < 0.15 ? 'shades' : 'none', hair: L.body === 'f' ? 'bun' : pick(['short', 'buzz', 'bald']), facial: L.body === 'f' ? 'none' : pick(['none', 'none', 'mustache']), cop: true, chain: false });
  };
  // A disguise: same person, new clothes (and maybe a hat and shades).
  CB.disguiseLook = function (base) {
    const L = Object.assign({}, base);
    L.top = pick(OPT.top.filter((t) => t !== base.top)); L.topCol = pick(TOP_COLS.filter((c) => c !== base.topCol));
    L.pantsCol = pick(PANTS_COLS.filter((c) => c !== base.pantsCol)); L.bottom = pick(OPT.bottom);
    L.hat = base.hat === 'none' ? pick(['cap', 'beanie']) : 'none'; L.hatCol = pick(TOP_COLS);
    L.glasses = base.glasses === 'none' ? 'shades' : 'none';
    return L;
  };

  // ------------------------------------------------------------------ Human
  // Proportioned, rounded people (cylinders and spheres from the instance pools) with real
  // knees and elbows: the lower limb's joint is computed each frame from the upper limb.
  const T9 = new Float32Array(9);
  const shade = (c, k) => [((c >> 16) & 255) / 255 * k, ((c >> 8) & 255) / 255 * k, (c & 255) / 255 * k];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // end point of a limb of length len hanging from joint j with rotation (yaw, pitch, roll)
  function limbEnd(j, yaw, pitch, roll, len, out) {
    CB.rot(T9, yaw, pitch, roll);
    out[0] = j[0] - len * T9[3]; out[1] = j[1] - len * T9[4]; out[2] = j[2] - len * T9[5];
    return out;
  }
  // point (ox, oz) at height y turned by yaw about the vertical axis (same convention as the rig)
  function turnY(ox, y, oz, yaw, out) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    out[0] = ox * c + oz * s; out[1] = y; out[2] = -ox * s + oz * c;
    return out;
  }

  class Human {
    constructor(look) {
      this.phase = Math.random() * 6;
      this.a = { thL: 0, thR: 0, knL: 0.05, knR: 0.05, upL: 0, upR: 0, rlL: -0.08, rlR: 0.08, elL: -0.15, elR: -0.15, erL: 0, erR: 0, lean: 0, twist: 0, hy: 0, hp: 0 };
      this.bob = 0; this.t = Math.random() * 10;
      this.onStep = null;
      this.build(look);
    }
    // (Re)create all parts for a look; keeps weapons if the human had them.
    build(look) {
      if (this.rig) this.rig.dispose();
      this.look = look = Object.assign({}, CB.PRESETS[0], look);
      const P = CB.Pools, r = this.rig = new CB.Rig();
      const f = look.body === 'f', heavy = look.build === 'heavy', slim = look.build === 'slim';
      const hs = (look.height || 1) * (f ? 0.94 : 1), hh = Math.sqrt(hs);
      const w = slim ? 0.9 : heavy ? 1.1 : 1;
      const D = this.D = {
        hs, shin: 0.43 * hs, thigh: 0.45 * hs, upper: 0.29 * hs, fore: 0.26 * hs,
        hipX: (f ? 0.098 : 0.09) * w, shX: (f ? 0.172 : 0.2) * w * (heavy ? 1.05 : 1),
      };
      D.hipY = 0.075 + D.shin + D.thigh;
      D.waistY = D.hipY + 0.19 * hs; D.shY = D.hipY + 0.53 * hs; D.neckY = D.shY + 0.095 * hs;
      const HS = D.HS = [0.19 * hh, 0.24 * hh, 0.22 * hh];
      D.headC = 0.11 * hh; // head centre above the neck top
      const skin = shade(look.skin, 1), top = shade(look.topCol, 1), pants = shade(look.pantsCol, 1), hairC = shade(look.hairCol, 1);
      const shoes = shade(look.shoes, 1), hatC = shade(look.hatCol, 1), acc = shade(look.accent, 1);
      const tank = look.top === 'tank', tee = look.top === 'tee';
      this.parts = {};
      const add = (pool, name, j, o, sc, col, rot) => {
        const p = r.add(pool, { j, o, s: sc, c: col, yaw: rot && rot[0], pitch: rot && rot[1], roll: rot && rot[2] });
        if (name) this.parts[name] = p;
        return p;
      };
      const z3 = [0, 0, 0];
      // legs
      for (const sd of ['L', 'R']) {
        add(P.cyl, 'thigh' + sd, z3, [0, -D.thigh / 2, 0], [0.155 * w * (heavy ? 1.12 : 1), D.thigh + 0.02, 0.16 * w * (heavy ? 1.12 : 1)], pants);
        add(P.cyl, 'shin' + sd, z3, [0, -D.shin / 2, 0], [0.112 * w, D.shin + 0.02, 0.118 * w], look.bottom === 'shorts' ? skin : pants);
        add(P.box, 'shoe' + sd, z3, [0, -0.04, 0.045], [0.105 * w, 0.075, 0.27 * Math.min(1.05, hs)], shoes);
      }
      // torso: hips, waist, chest (elliptic cylinders read as a rounded body)
      add(P.cyl, 'pelvis', [0, D.hipY, 0], [0, 0.03 * hs, 0], [(f ? 0.37 : 0.335) * w, 0.17 * hs, 0.22 * w * (heavy ? 1.1 : 1)], pants);
      if (look.bottom === 'jeans' || look.cop) add(P.cyl, null, [0, D.hipY, 0], [0, 0.105 * hs, 0], [(f ? 0.375 : 0.345) * w, 0.035, 0.228 * w * (heavy ? 1.1 : 1)], look.cop ? [0.05, 0.05, 0.05] : [0.12, 0.09, 0.07]);
      const waistW = (f ? 0.275 : 0.31) * w * (heavy ? 1.28 : 1), waistD = 0.2 * w * (heavy ? 1.32 : 1);
      add(P.cyl, 'waist', [0, D.waistY, 0], [0, 0, 0], [waistW, 0.2 * hs, waistD], top);
      const chestW = (f ? 0.345 : 0.405) * w * (heavy ? 1.12 : 1), chestD = (f ? 0.235 : 0.24) * w * (heavy ? 1.16 : 1), chestH = 0.31 * hs;
      D.chestD = chestD; D.chestH = chestH;
      add(P.cyl, 'chest', [0, D.waistY, 0], [0, 0.085 * hs + chestH / 2, 0], [chestW, chestH, chestD], top);
      if (f) for (const sx of [-1, 1]) add(P.sph, 'bust' + (sx < 0 ? 'L' : 'R'), [0, D.waistY, 0], [sx * chestW * 0.19, 0.085 * hs + chestH * 0.58, chestD * 0.26], [chestW * 0.38, chestH * 0.36, chestD * 0.44], look.top === 'jacket' ? acc : top);
      if (look.top === 'jacket') { // open jacket over a shirt
        add(P.box, 'jfront', [0, D.waistY, 0], [0, 0.085 * hs + chestH / 2, chestD / 2 - 0.004], [chestW * 0.28, chestH * 0.98, 0.012], acc);
        add(P.box, 'jfront2', [0, D.waistY, 0], [0, 0, waistD / 2 - 0.004], [waistW * 0.3, 0.2 * hs, 0.012], acc);
      }
      if (look.top === 'hoodie') {
        add(P.sph, 'hood', [0, D.waistY, 0], [0, 0.085 * hs + chestH + 0.02, -chestD * 0.42], [0.22 * w, 0.12, 0.13], shade(look.topCol, 0.85));
        add(P.box, 'pocket', [0, D.waistY, 0], [0, -0.02, waistD / 2 - 0.002], [waistW * 0.6, 0.09 * hs, 0.012], shade(look.topCol, 0.85));
      }
      if (look.chain) { // gold chain hanging round the neck with a pendant (no tilt: offsets turn with a part's rotation)
        const cz = chestD / 2 + 0.003, cy = 0.085 * hs + chestH - 0.055;
        add(P.box, 'chain1', [0, D.waistY, 0], [-0.048, cy, cz], [0.012, 0.11, 0.012], [0.96, 0.77, 0.1]);
        add(P.box, 'chain2', [0, D.waistY, 0], [0.048, cy, cz], [0.012, 0.11, 0.012], [0.96, 0.77, 0.1]);
        add(P.box, 'chain3', [0, D.waistY, 0], [0, cy - 0.058, cz], [0.108, 0.012, 0.012], [0.96, 0.77, 0.1]);
        add(P.box, 'chain4', [0, D.waistY, 0], [0, cy - 0.085, cz + 0.003], [0.036, 0.046, 0.012], [1, 0.84, 0.2]);
      }
      if (look.cop) {
        add(P.box, 'badge', [0, D.waistY, 0], [-chestW * 0.22, 0.085 * hs + chestH * 0.72, chestD / 2], [0.055, 0.065, 0.012], [0.95, 0.76, 0.18]);
        add(P.box, 'holster', [0, D.hipY, 0], [0.19 * w, 0.03, 0.02], [0.05, 0.16, 0.1], [0.06, 0.06, 0.06]);
      }
      // arms
      for (const sd of ['L', 'R']) {
        const sleeve = tank ? skin : top;
        add(P.sph, 'shoulder' + sd, z3, [0, -0.015, 0], [0.118 * w, 0.115 * w, 0.125 * w], sleeve);
        add(P.cyl, 'upper' + sd, z3, [0, -D.upper / 2, 0], [0.1 * w * (heavy ? 1.1 : 1), D.upper + 0.02, 0.105 * w * (heavy ? 1.1 : 1)], sleeve);
        add(P.cyl, 'fore' + sd, z3, [0, -D.fore / 2, 0], [0.083 * w, D.fore + 0.02, 0.088 * w], tank || tee ? skin : top);
        add(P.box, 'hand' + sd, z3, [0, -0.08, 0.005], [0.07 * w, 0.15 * hs, 0.042], skin);
      }
      // neck and head (all head parts hang from the neck top and turn together)
      add(P.cyl, 'neck', [0, D.shY, 0], [0, 0.05 * hs, 0], [0.105 * w * (heavy ? 1.15 : 1), 0.12 * hs, 0.11 * w * (heavy ? 1.15 : 1)], skin);
      const nk = [0, D.neckY, 0], hc = D.headC, fz = HS[2] / 2;
      this.headParts = [];
      const H = (pool, o, sc, col, rot) => { const p = add(pool, null, nk, [o[0], o[1] + hc, o[2]], sc, col, rot); this.headParts.push(p); return p; };
      H(P.sph, [0, 0, 0], HS, skin);
      H(P.box, [0, -0.085 * hh, 0.035], [0.13 * hh, 0.07, 0.12 * hh], skin); // jaw / chin
      const eyeY = 0.016 * hh, eyeX = 0.043 * hh;
      for (const sx of [-1, 1]) {
        H(P.box, [sx * eyeX, eyeY, fz - 0.012], [0.04, 0.022, 0.012], [0.95, 0.95, 0.93]);
        H(P.box, [sx * eyeX, eyeY, fz - 0.005], [0.019, 0.019, 0.006], shade(look.eyes || 0x3b2a1e, 1));
        H(P.box, [sx * (eyeX + 0.003), eyeY + 0.03, fz - 0.012], [0.05, 0.011, 0.014], mixc(hairC, skin, look.hair === 'bald' ? 0.4 : 0.1));
        H(P.box, [sx * HS[0] / 2, 0, -0.005], [0.024, 0.055 * hh, 0.04], shade(look.skin, 0.96)); // ear
      }
      H(P.box, [0, -0.012, fz], [0.032, 0.05, 0.036], shade(look.skin, 0.95)); // nose
      H(P.box, [0, -0.058 * hh, fz - 0.018], [0.055, 0.012, 0.012], mixc(skin, [0.55, 0.2, 0.2], 0.45)); // mouth
      // facial hair
      if (look.facial === 'stubble') H(P.box, [0, -0.083 * hh, 0.037], [0.136 * hh, 0.08, 0.125 * hh], mixc(skin, hairC, 0.42));
      if (look.facial === 'beard') H(P.box, [0, -0.088 * hh, 0.038], [0.148 * hh, 0.1, 0.132 * hh], hairC);
      if (look.facial === 'goatee') H(P.box, [0, -0.1 * hh, fz - 0.03], [0.05, 0.05, 0.03], hairC);
      if (look.facial === 'beard' || look.facial === 'goatee' || look.facial === 'mustache') H(P.box, [0, -0.036 * hh, fz - 0.006], [0.068, 0.016, 0.02], hairC);
      if (look.glasses === 'shades') H(P.box, [0, eyeY, fz + 0.002], [0.165 * hh, 0.034, 0.014], [0.05, 0.05, 0.06]);
      // hair (under a hat only what sticks out at the back)
      const hat = look.cop ? 'police' : look.hat;
      const capped = hat && hat !== 'none';
      const cap = (sx, sy, sz, y, z, col) => H(P.sph, [0, y * HS[1], z], [HS[0] * sx, HS[1] * sy, HS[2] * sz], col || hairC);
      switch (look.hair) {
        case 'short': if (!capped) cap(1.08, 0.62, 1.08, 0.25, -0.012); break;
        case 'buzz': if (!capped) cap(1.04, 0.55, 1.05, 0.27, -0.008); break;
        case 'curly': if (!capped) cap(1.2, 0.74, 1.17, 0.22, -0.02); break;
        case 'afro': if (!capped) H(P.sph, [0, 0.075 * hh, -0.058], [0.33 * hh, 0.31 * hh, 0.3 * hh], hairC); else cap(1.22, 0.68, 1.15, 0.0, -0.04); break;
        case 'long':
          if (!capped) cap(1.1, 0.64, 1.1, 0.24, -0.015);
          H(P.sph, [0, -0.05 * hh, -0.075], [0.2 * hh, 0.36 * hh, 0.11], hairC);
          break;
        case 'ponytail':
          if (!capped) cap(1.08, 0.62, 1.08, 0.25, -0.012);
          H(P.cyl, [0, 0.0, -0.14 * hh], [0.06, 0.22, 0.06], hairC, [0, 0.45, 0]);
          break;
        case 'bun':
          if (!capped) { cap(1.06, 0.6, 1.06, 0.26, -0.01); H(P.sph, [0, 0.13 * hh, -0.075], [0.1, 0.09, 0.1], hairC); }
          else H(P.sph, [0, -0.02, -0.12 * hh], [0.09, 0.08, 0.08], hairC);
          break;
        case 'mohawk':
          if (!capped) { cap(1.03, 0.53, 1.04, 0.28, -0.008, mixc(skin, hairC, 0.5)); H(P.box, [0, 0.135 * hh, -0.01], [0.035, 0.075, 0.23 * hh], hairC); }
          break;
        default: break; // bald
      }
      // hats
      if (hat === 'cap') {
        H(P.sph, [0, 0.31 * HS[1], -0.005], [HS[0] * 1.12, HS[1] * 0.56, HS[2] * 1.12], hatC);
        H(P.box, [0, 0.21 * HS[1], fz + 0.045], [0.16 * hh, 0.014, 0.11], hatC, [0, -0.12, 0]);
      } else if (hat === 'beanie') {
        H(P.sph, [0, 0.27 * HS[1], -0.01], [HS[0] * 1.13, HS[1] * 0.72, HS[2] * 1.13], hatC);
        H(P.cyl, [0, 0.1 * HS[1], -0.01], [HS[0] * 1.16, 0.045, HS[2] * 1.16], shade(look.hatCol, 0.8));
      } else if (hat === 'police') {
        H(P.cyl, [0, 0.42 * HS[1], 0], [HS[0] * 1.2, 0.075, HS[2] * 1.18], hatC);
        H(P.cyl, [0, 0.3 * HS[1], 0], [HS[0] * 1.12, 0.035, HS[2] * 1.12], [0.92, 0.92, 0.92]);
        H(P.box, [0, 0.24 * HS[1], fz + 0.04], [0.16 * hh, 0.014, 0.09], [0.04, 0.04, 0.04], [0, -0.1, 0]);
        H(P.box, [0, 0.42 * HS[1], HS[2] * 0.58], [0.035, 0.04, 0.01], [0.95, 0.76, 0.18]);
      }
      if (this.weapons) { this.weapons = null; this.addWeapons(); }
      this.pose3d();
    }
    // Weapon models in the right hand (they follow the forearm). Only the player gets these.
    addWeapons() {
      const P = CB.Pools, r = this.rig, J = [0, 0, 0];
      const W = this.weapons = {
        bat: [r.add(P.cyl, { j: J, o: [0, -0.1, 0], s: [0.042, 0.16, 0.042], c: hex(0x1d1d1d) }), // taped grip
          r.add(P.cyl, { j: J, o: [0, -0.3, 0], s: [0.036, 0.3, 0.036], c: hex(0xc9a063) }),    // handle
          r.add(P.cyl, { j: J, o: [0, -0.48, 0], s: [0.05, 0.12, 0.05], c: hex(0xc9a063) }),    // taper
          r.add(P.cyl, { j: J, o: [0, -0.7, 0], s: [0.066, 0.36, 0.066], c: hex(0xc9a063) }),   // barrel
          r.add(P.cyl, { j: J, o: [0, -0.885, 0], s: [0.062, 0.02, 0.062], c: hex(0xb8894f) })],
        crowbar: [r.add(P.box, { j: J, o: [0, -0.42, 0], s: [0.04, 0.74, 0.04], c: hex(0x9e1c1c) }),
          r.add(P.box, { j: J, o: [0, -0.78, 0.06], s: [0.04, 0.05, 0.15], c: hex(0x9e1c1c) })],
        pistol: [r.add(P.box, { j: J, o: [0, -0.19, 0.02], s: [0.045, 0.22, 0.065], c: hex(0x26282c) }),
          r.add(P.box, { j: J, o: [0, -0.1, -0.05], s: [0.042, 0.07, 0.11], c: hex(0x15161a) })],
      };
      this.weaponParts = [].concat(W.bat, W.crowbar, W.pistol);
      this.setWeapon(this.weapon || 'fists');
    }
    setWeapon(w) {
      this.weapon = w;
      if (!this.weapons) return;
      for (const k in this.weapons) for (const p of this.weapons[k]) p.vis = k === w;
    }
    // Same body, new look (rebuilds the parts when styles change).
    recolor(look) {
      const vis = this.rig.visible;
      this.build(look);
      this.rig.visible = vis;
    }
    // Animate limbs. speed in m/s, pose name. Returns the forward lean.
    animate(dt, speed, pose) {
      const a = this.a, D = this.D;
      this.t += dt;
      // targets: thigh pitch, knee bend, upper-arm pitch/roll, elbow bend (pitch, roll), lean, chest twist, head turn
      let thL = 0, thR = 0, knL = 0.06, knR = 0.06, upL = 0.03, upR = 0.03, rlL = -0.07, rlR = 0.07, elL = -0.18, elR = -0.18, erL = 0, erR = 0;
      let lean = 0, twist = 0, hy = 0, hp = 0, bob = 0, snap = false;
      const w = this.weapon;
      switch (pose) {
        case 'aim': // pistol pointed straight ahead, two hands
          upR = -1.57; rlR = -0.05; elR = 0; upL = -1.2; rlL = 0.5; elL = -0.45; erL = 0.3; lean = -0.03; twist = 0.12; break;
        case 'raise': // melee weapon raised in a threatening way
          upR = -2.6 + Math.sin(this.t * 9) * 0.15; rlR = 0.25; elR = -0.7; upL = -0.6; elL = -0.6; break;
        case 'swing': { // fast overhead swing driven by swingP (0..1)
          const p = this.swingP || 0, f = M.clamp((p - 0.3) / 0.45, 0, 1);
          upR = p < 0.3 ? -2.9 : M.lerp(-2.9, -0.45, 1 - (1 - f) * (1 - f)); rlR = 0.15; elR = p < 0.3 ? -0.9 : -0.2;
          upL = -0.7; elL = -0.6; lean = p < 0.3 ? -0.1 : 0.25; twist = p < 0.3 ? 0.35 : -0.3; thL = -0.4; thR = 0.3; knR = 0.3; snap = true; break;
        }
        case 'air':
          thL = -0.8; thR = 0.35; knL = 0.9; knR = 0.4; upL = -2.5; upR = -2.3; rlL = -0.35; rlR = 0.35; elL = elR = -0.4; break;
        case 'handsup':
          upL = -0.25; upR = -0.25; rlL = -1.25; rlR = 1.25; erL = -1.45; erR = 1.45; elL = elR = 0; bob = Math.sin(this.t * 14) * 0.01; hp = 0.1; break;
        case 'grab':
          upL = -1.2 + Math.sin(this.t * 13) * 0.35; upR = -1.2 - Math.sin(this.t * 13) * 0.35; elL = elR = -0.5; lean = 0.2; hp = 0.35; knL = knR = 0.25; break;
        case 'spray':
          upR = -1.8 + Math.sin(this.t * 9) * 0.15; elR = -0.2; upL = 0.1; rlR = 0.1 + Math.sin(this.t * 5) * 0.25; hp = -0.1; break;
        case 'kick':
          thR = -1.35; knR = 0.2; upL = -0.6; upR = 0.5; elL = -0.5; lean = -0.15; break;
        case 'shove':
          upL = upR = -1.55; elL = elR = -0.15; lean = 0.2; thL = -0.4; thR = 0.3; knR = 0.3; break;
        case 'taser':
          upR = -1.55; elR = 0; upL = -0.3; elL = -0.4; break;
        case 'phone':
          upR = -0.55; rlR = 0.45; elR = -2.35; upL = -0.15; elL = -1.3; hy = 0.2; break;
        case 'cower':
          upL = upR = -2.5; rlL = 0.35; rlR = -0.35; elL = elR = -1.6; lean = 0.45; bob = -0.12; thL = thR = -0.7; knL = knR = 1.2; hp = 0.4; break;
        case 'fallen':
          upL = -2.8; upR = -2.4; rlL = -0.6; rlR = 0.6; elL = elR = -0.3; thL = -0.25; thR = 0.25; knL = 0.4; knR = 0.1; break;
        case 'work':
          upL = -1.0 + Math.sin(this.t * 10) * 0.12; upR = -1.05 - Math.sin(this.t * 10) * 0.12; elL = elR = -0.7; lean = 0.18; hp = 0.3; break;
        case 'eat':
          upR = -0.6; rlR = 0.15; elR = -1.9 + Math.sin(this.t * 8) * 0.2; elL = -0.3; break;
        case 'cheer':
          upL = -3.0 + Math.sin(this.t * 10) * 0.3; upR = -3.0 - Math.sin(this.t * 10) * 0.3; elL = elR = -0.3; bob = Math.abs(Math.sin(this.t * 8)) * 0.15; hp = -0.25; break;
        case 'lie': // sunbathing on the back (placed with pitch -PI/2), hands behind the head
          upL = upR = -2.75; rlL = -0.5; rlR = 0.5; elL = elR = -1.9; thL = 0.02; thR = this.legUp ? -0.6 : -0.02; knR = this.legUp ? 1.1 : 0.05; hp = -0.15; break;
        case 'sit': // sitting on the ground, knees up, leaning back on the hands
          thL = thR = -2.0; knL = knR = 1.4; upL = upR = 0.62; rlL = -0.3; rlR = 0.3; elL = elR = 0; lean = -0.18; hy = Math.sin(this.t * 0.3) * 0.25; break;
        case 'swim': { // front crawl (placed face down near the water surface)
          const sw = this.t * 3.2;
          upL = -Math.PI + Math.sin(sw) * 2.2; upR = -Math.PI - Math.sin(sw) * 2.2; elL = elR = -0.3; rlL = -0.2; rlR = 0.2;
          thL = Math.sin(this.t * 9) * 0.25; thR = -thL; knL = knR = 0.15; hy = Math.sin(sw) * 0.5; snap = true; break;
        }
        case 'pose': // character screen: relaxed, weight on one leg, glancing around
          upL = 0.05; upR = 0.08; rlL = -0.12; rlR = 0.1; elL = -0.25; elR = -0.2; thL = -0.05; thR = 0.07; knL = 0.14; knR = 0.02;
          twist = Math.sin(this.t * 0.6) * 0.06; hy = Math.sin(this.t * 0.45) * 0.35; hp = -0.04;
          if (w === 'bat' || w === 'crowbar') { upR = -0.3; elR = -0.6; rlR = 0.12; } else if (w === 'pistol') { upR = -0.1; elR = -0.9; }
          break;
        default: {
          const walk = Math.min(1, speed / 3.2), run = M.clamp((speed - 3.2) / 4, 0, 1);
          const amp = walk * 0.45 + run * 0.5;
          const prev = Math.sin(this.phase);
          this.phase += dt * speed * (3.3 - run * 0.9);
          const s = Math.sin(this.phase), c = Math.cos(this.phase);
          if (this.onStep && speed > 0.5 && ((prev < 0) !== (s < 0))) this.onStep(run);
          // legs: the knee bends while the leg swings forward, more when running
          const kAmp = walk * 0.75 + run * 0.85;
          thL = s * amp - run * 0.2; thR = -s * amp - run * 0.2;
          knL = 0.06 + kAmp * Math.max(0, -c) + run * 0.25 * Math.max(0, s); knR = 0.06 + kAmp * Math.max(0, c) + run * 0.25 * Math.max(0, -s);
          // arms swing against the legs; elbows bend more when running
          upL = -s * amp * 0.8; upR = s * amp * 0.8;
          elL = -0.2 - walk * 0.15 - run * 1.05 + Math.min(0, s) * 0.2; elR = -0.2 - walk * 0.15 - run * 1.05 + Math.min(0, -s) * 0.2;
          rlL = -0.07 - run * 0.1; rlR = 0.07 + run * 0.1;
          lean = run * 0.18 + walk * 0.03;
          twist = -s * (0.09 * walk + 0.12 * run);
          bob = Math.abs(c) * 0.05 * amp;
          if (speed < 0.2) { // idle: breathing, small weight shifts, looking around
            upL = Math.sin(this.t * 1.7) * 0.03; upR = -upL;
            thL = Math.sin(this.t * 0.4) * 0.03; thR = -thL;
            hy = Math.sin(this.t * 0.31 + this.phase) * 0.3; hp = Math.sin(this.t * 0.23) * 0.06;
            bob = Math.sin(this.t * 1.8) * 0.004;
          }
          // carry the weapon: the right arm swings less and holds it a little forward
          if (w === 'bat' || w === 'crowbar') { upR = -0.3 + upR * 0.35; elR = -0.55; rlR = 0.12; }
          else if (w === 'pistol') { upR = -0.2 + upR * 0.4; elR = -0.5; rlR = 0.1; }
        }
      }
      const k = snap ? Math.min(1, dt * 40) : Math.min(1, dt * 14);
      const ease = (n, v) => { a[n] += (v - a[n]) * k; };
      ease('thL', thL); ease('thR', thR); ease('knL', knL); ease('knR', knR);
      ease('upL', upL); ease('upR', upR); ease('rlL', rlL); ease('rlR', rlR);
      ease('elL', elL); ease('elR', elR); ease('erL', erL); ease('erR', erR);
      ease('lean', lean); ease('twist', twist); ease('hy', hy); ease('hp', hp);
      this.bob += (bob - this.bob) * k;
      this.pose3d();
      return a.lean;
    }
    // Forward kinematics: put every part where the joint angles say.
    pose3d() {
      const a = this.a, D = this.D, P = this.parts;
      const j = this._j || (this._j = { hip: [0, 0, 0], knee: [0, 0, 0], ankle: [0, 0, 0], sh: [0, 0, 0], el: [0, 0, 0], wr: [0, 0, 0] });
      const tw = a.twist, ptw = -tw * 0.5;
      for (const sd of ['L', 'R']) {
        const sx = sd === 'L' ? -1 : 1;
        // leg
        const th = a['th' + sd], kn = a['kn' + sd];
        turnY(sx * D.hipX, D.hipY, 0, ptw, j.hip);
        limbEnd(j.hip, ptw, th, 0, D.thigh, j.knee);
        limbEnd(j.knee, ptw, th + kn, 0, D.shin, j.ankle);
        const thg = P['thigh' + sd], shn = P['shin' + sd], sho = P['shoe' + sd];
        thg.jx = j.hip[0]; thg.jy = j.hip[1]; thg.jz = j.hip[2]; thg.yaw = ptw; thg.pitch = th;
        shn.jx = j.knee[0]; shn.jy = j.knee[1]; shn.jz = j.knee[2]; shn.yaw = ptw; shn.pitch = th + kn;
        sho.jx = j.ankle[0]; sho.jy = j.ankle[1]; sho.jz = j.ankle[2]; sho.yaw = ptw; sho.pitch = (th + kn) * 0.35;
        // arm
        const up = a['up' + sd], rl = a['rl' + sd], el = a['el' + sd], er = a['er' + sd];
        turnY(sx * D.shX, D.shY, 0, tw, j.sh);
        limbEnd(j.sh, tw, up, rl, D.upper, j.el);
        limbEnd(j.el, tw, up + el, rl + er, D.fore, j.wr);
        const shd = P['shoulder' + sd], upr = P['upper' + sd], frm = P['fore' + sd], hnd = P['hand' + sd];
        shd.jx = j.sh[0]; shd.jy = j.sh[1]; shd.jz = j.sh[2]; shd.yaw = tw;
        upr.jx = j.sh[0]; upr.jy = j.sh[1]; upr.jz = j.sh[2]; upr.yaw = tw; upr.pitch = up; upr.roll = rl;
        frm.jx = j.el[0]; frm.jy = j.el[1]; frm.jz = j.el[2]; frm.yaw = tw; frm.pitch = up + el; frm.roll = rl + er;
        hnd.jx = j.wr[0]; hnd.jy = j.wr[1]; hnd.jz = j.wr[2]; hnd.yaw = tw; hnd.pitch = up + el; hnd.roll = rl + er;
        if (sd === 'R' && this.weaponParts) for (const p of this.weaponParts) { p.jx = j.wr[0]; p.jy = j.wr[1]; p.jz = j.wr[2]; p.yaw = tw; p.pitch = up + el; p.roll = rl + er; }
      }
      // torso twist (hips turn the other way a little)
      P.pelvis.yaw = ptw;
      for (const n of ['waist', 'chest', 'bustL', 'bustR', 'jfront', 'jfront2', 'hood', 'pocket', 'chain1', 'chain2', 'chain3', 'chain4', 'badge']) if (P[n]) P[n].yaw = tw * (n === 'waist' ? 0.5 : 1);
      if (P.holster) P.holster.yaw = ptw;
      for (const p of this.headParts) { p.yaw = a.hy; p.pitch = a.hp; }
    }
    place(x, y, z, yaw, pitch, lean) {
      const r = this.rig;
      r.x = x; r.y = y + this.bob; r.z = z; r.yaw = yaw;
      r.pitch = (pitch || 0) + (lean || 0);
      r.update();
    }
    setVisible(v) { this.rig.visible = v; }
    dispose() { this.rig.dispose(); }
  }
  CB.Human = Human;

  // ------------------------------------------------------------------ pedestrians
  const INSET = 2.1;
  function corner(b, k) {
    switch (k & 3) {
      case 0: return { x: b.x0 + INSET, z: b.z0 + INSET };
      case 1: return { x: b.x1 - INSET, z: b.z0 + INSET };
      case 2: return { x: b.x1 - INSET, z: b.z1 - INSET };
      default: return { x: b.x0 + INSET, z: b.z1 - INSET };
    }
  }
  // Street crossings from each corner: [dbi, dbj, newCorner]
  const CROSS = {
    0: [[-1, 0, 1], [0, -1, 3]],
    1: [[1, 0, 0], [0, -1, 2]],
    2: [[1, 0, 3], [0, 1, 1]],
    3: [[-1, 0, 2], [0, 1, 0]],
  };

  class Ped {
    constructor(look) {
      this.h = new Human(look || CB.randomLook());
      this.x = 0; this.z = 0; this.y = C.CURB; this.yaw = 0;
      this.vx = 0; this.vy = 0; this.vz = 0;
      this.mode = 'walk'; this.t = 0;
      this.speed = M.rand(1.2, 1.7);
      this.b = null; this.k = 0; this.dir = 1; this.tx = 0; this.tz = 0;
      this.spin = 0; this.pitch = 0;
      this.alive = true;
      this.reported = false;
    }
    setRoute(b, k, dir) {
      this.b = b; this.k = k; this.dir = dir;
      const c = corner(b, k); this.tx = c.x; this.tz = c.z;
    }
    nextTarget() {
      if (!this.b) { this.reroute(); return; }
      const b = this.b;
      if (Math.random() < 0.28) {
        const opts = CROSS[this.k & 3];
        const o = opts[Math.random() < 0.5 ? 0 : 1];
        const nb = CB.City.blocks[(b.bi + o[0]) * C.N + (b.bj + o[1])];
        if (b.bi + o[0] >= 0 && b.bi + o[0] < C.N && b.bj + o[1] >= 0 && b.bj + o[1] < C.N && nb && !nb.noPeds) {
          this.setRoute(nb, o[2], Math.random() < 0.5 ? 1 : -1);
          return;
        }
      }
      this.k = (this.k + this.dir + 4) & 3;
      const c = corner(b, this.k); this.tx = c.x; this.tz = c.z;
    }
    // Rejoin the sidewalk loop of the closest block.
    reroute() {
      let best = null, bd = 1e9;
      for (const b of CB.City.blocks) {
        if (b.noPeds) continue;
        const d = M.dist2(this.x, this.z, b.cx, b.cz);
        if (d < bd) { bd = d; best = b; }
      }
      let bk = 0, kd = 1e9;
      for (let k = 0; k < 4; k++) { const c = corner(best, k); const d = M.dist2(this.x, this.z, c.x, c.z); if (d < kd) { kd = d; bk = k; } }
      this.setRoute(best, bk, Math.random() < 0.5 ? 1 : -1);
    }
    flee(fx, fz, time) {
      if (this.mode === 'knock' || this.mode === 'fallen') return;
      if (this.mode !== 'flee' && Math.random() < 0.5) CB.Audio.play('hey', 0.6, this.x, this.z, 40);
      this.mode = 'flee'; this.fx = fx; this.fz = fz; this.t = time || M.rand(4, 7);
    }
    cower(time) {
      if (this.mode === 'knock' || this.mode === 'fallen') return;
      this.mode = 'cower'; this.t = time || 3;
    }
    knock(vx, vz, up) {
      if (this.mode === 'knock') return;
      this.mode = 'knock';
      this.vx = vx; this.vz = vz; this.vy = up || 5;
      this.spin = M.rand(4, 9) * (Math.random() < 0.5 ? -1 : 1);
      this.t = 0;
      CB.Audio.play('oof', 0.9, this.x, this.z, 50);
    }
    update(dt) {
      const City = CB.City;
      let speed = 0, pose = 'walk';
      switch (this.mode) {
        case 'walk': {
          const dx = this.tx - this.x, dz = this.tz - this.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.5) this.nextTarget();
          else {
            speed = this.speed;
            // wait at the kerb if a car is coming (very rough)
            this.x += dx / d * speed * dt; this.z += dz / d * speed * dt;
            this.yaw = M.turn(this.yaw, Math.atan2(dx, dz), dt * 6);
          }
          break;
        }
        case 'flee': {
          this.t -= dt;
          let dx = this.x - this.fx, dz = this.z - this.fz;
          const d = Math.hypot(dx, dz) || 1;
          dx /= d; dz /= d;
          speed = 4.6;
          this.x += dx * speed * dt; this.z += dz * speed * dt;
          this.yaw = M.turn(this.yaw, Math.atan2(dx, dz), dt * 8);
          const hit = City.resolve(this, 0.35, this.y, 0.3);
          if (hit) { this.fx = this.x - hit.z * 3 - dx; this.fz = this.z + hit.x * 3 - dz; }
          if (this.t <= 0) { this.mode = 'walk'; this.reroute(); }
          break;
        }
        case 'cower':
          this.t -= dt; pose = 'cower';
          if (this.t <= 0) { this.mode = 'walk'; this.reroute(); }
          break;
        case 'phone':
          this.t -= dt; pose = 'phone';
          if (this.t <= 0) { this.mode = 'flee'; this.t = 4; }
          break;
        case 'knock': {
          this.t += dt;
          this.vy -= 22 * dt;
          this.x += this.vx * dt; this.z += this.vz * dt; this.y += this.vy * dt;
          this.vx *= 1 - dt * 0.6; this.vz *= 1 - dt * 0.6;
          this.pitch += this.spin * dt;
          City.resolve(this, 0.35, this.y, 0.3);
          const gy = City.groundY(this.x, this.z);
          pose = 'air';
          if (this.y <= gy && this.t > 0.1) {
            this.y = gy; this.mode = 'fallen'; this.t = M.rand(2, 3.5); this.pitch = -Math.PI / 2;
          }
          break;
        }
        case 'fallen':
          this.t -= dt; pose = 'fallen';
          if (this.t <= 0) { this.pitch = 0; this.y = CB.City.groundY(this.x, this.z); this.mode = 'flee'; this.fx = this.x - Math.sin(this.yaw); this.fz = this.z - Math.cos(this.yaw); this.t = 4; }
          break;
        case 'idle':
          pose = this.pose || 'walk';
          break;
        case 'held': // being robbed: frozen with hands up until the robber stops
          this.t -= dt; pose = 'handsup';
          if (this.t <= 0) { this.mode = 'flee'; this.fx = this.x + Math.sin(this.yaw); this.fz = this.z + Math.cos(this.yaw); this.t = 5; }
          break;
      }
      if (this.mode === 'walk' || this.mode === 'flee') {
        const gy = City.groundY(this.x, this.z);
        this.y += (gy - this.y) * Math.min(1, dt * 15);
      }
      const lean = this.h.animate(dt, speed, pose);
      const pitch = this.mode === 'fallen' ? -Math.PI / 2 : this.mode === 'knock' ? this.pitch : 0;
      const yOff = this.mode === 'fallen' ? 0.18 : 0;
      this.h.place(this.x, this.y + yOff, this.z, this.yaw, pitch, this.mode === 'fallen' || this.mode === 'knock' ? 0 : lean);
    }
  }
  CB.Ped = Ped;

  CB.Peds = {
    list: [],
    target: 40,
    init(n) {
      this.target = n;
      for (const p of this.list) p.h.dispose();
      this.list = [];
      const sp = CB.City.playerSpawn;
      for (let i = 0; i < n; i++) {
        const p = new Ped();
        this.place(p, sp.x, sp.z, 0, 170, null);
        this.list.push(p);
      }
    },
    // Put ped somewhere on a sidewalk loop between minD and maxD from (x,z).
    place(p, x, z, minD, maxD, view) {
      // candidate blocks: walkable blocks roughly within range
      const all = CB.City.blocks;
      const blocks = all.filter((b) => !b.noPeds && Math.abs(b.cx - x) < maxD + 40 && Math.abs(b.cz - z) < maxD + 40);
      if (!blocks.length) blocks.push(...all.filter((b) => !b.noPeds));
      for (let tries = 0; tries < 40; tries++) {
        const b = blocks[Math.floor(Math.random() * blocks.length)];
        const k = Math.floor(Math.random() * 4);
        const c0 = corner(b, k), c1 = corner(b, k + 1);
        const t = Math.random();
        const px = c0.x + (c1.x - c0.x) * t, pz = c0.z + (c1.z - c0.z) * t;
        const d = M.dist(px, pz, x, z);
        if (d < minD || d > maxD) continue;
        if (view && tries < 30) {
          const ang = Math.atan2(px - x, pz - z);
          if (Math.abs(M.wrap(ang - view)) < 0.9) continue;
        }
        p.x = px; p.z = pz; p.y = CB.C.CURB;
        p.mode = 'walk'; p.pitch = 0; p.reported = false;
        const dir = Math.random() < 0.5 ? 1 : -1;
        p.setRoute(b, dir > 0 ? (k + 1) & 3 : k, dir);
        return true;
      }
      // could not satisfy the distance limits: settle for any sidewalk spot
      if (!p.b) {
        const b = blocks[Math.floor(Math.random() * blocks.length)];
        const c = corner(b, 0);
        p.x = c.x; p.z = c.z; p.y = CB.C.CURB; p.mode = 'walk';
        p.setRoute(b, 1, 1);
      }
      return false;
    },
    update(dt, px, pz, viewYaw) {
      for (const p of this.list) {
        const d2 = M.dist2(p.x, p.z, px, pz);
        if (d2 > 200 * 200 && p.mode !== 'knock') { this.place(p, px, pz, 90, 180, viewYaw); continue; }
        if (d2 > 140 * 140 && Math.random() < 0.5) continue; // far away: update half as often
        p.update(d2 > 140 * 140 ? dt * 2 : dt);
      }
    },
    // Make everyone near (x,z) react to something scary.
    scare(x, z, r, kind) {
      let caller = null;
      for (const p of this.list) {
        const d = M.dist(p.x, p.z, x, z);
        if (d > r) continue;
        if (kind === 'cower' && d < r * 0.5) p.cower(M.rand(2, 4));
        else p.flee(x, z);
        if (!caller && d > 6 && d < r && p.mode === 'flee' && CB.City.los(p.x, p.z, x, z)) caller = p;
      }
      if (caller) { caller.mode = 'phone'; caller.t = 2.5; }
      return caller;
    },
  };
})(window.CB);
