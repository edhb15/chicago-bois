// Chicago Bois – ambient life: the tower crane at work, airliners overhead, sailboats off the
// beach, beachgoers, a volleyball game and pickup basketball on the nearest park court.
'use strict';
(function (CB) {
  const M = CB.M, hex = M.hex;
  const AM = CB.Ambient = {};
  const TMP = new Float32Array(9);

  // A rig part placed at joint j (no offset, so its own rotation doesn't move it).
  const at = (r, pool, j, s, c, rot) => r.add(pool, { j, s, c, yaw: rot && rot[0], pitch: rot && rot[1], roll: rot && rot[2] });
  // A beam from point a to point b (box long along its local x).
  function beam(r, pool, a, b, t, c) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    return at(r, pool, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [L, t, t], c, [Math.atan2(-dz, dx), 0, Math.asin(dy / L)]);
  }

  AM.init = function (scene) {
    const P = CB.Pools, City = CB.City;
    this.t = 0;
    // ------------------------------------------------------------ tower crane top (slews)
    const cr = City.crane;
    if (cr) {
      const r = new CB.Rig(), Y = hex(0xf2c230), J = cr.reach, conc = hex(0x9e9a90);
      r.x = cr.x; r.y = cr.y; r.z = cr.z;
      at(r, P.box, [0, 0.4, 0], [2.8, 0.8, 2.8], Y);
      at(r, P.box, [1.0, 1.6, 1.9], [1.7, 1.8, 1.6], hex(0xeeeeee));
      at(r, P.box, [1.86, 1.75, 1.9], [0.02, 1.1, 1.3], hex(0x26323d));
      for (const z of [-0.55, 0.55]) beam(r, P.box, [0, 0.8, z], [0, 7.2, 0], 0.3, Y);
      // jib: two bottom chords, one top chord and zig-zag diagonals on both sides
      for (const z of [-0.75, 0.75]) beam(r, P.box, [0.5, 0.9, z], [J, 0.9, z * 0.4], 0.16, Y);
      beam(r, P.box, [0.5, 2.5, 0], [J, 1.5, 0], 0.16, Y);
      const n = Math.floor(J / 2.6);
      for (let k = 0; k < n; k++) {
        const x0 = 0.5 + k * 2.6, x1 = x0 + 2.6, f = (x) => 1 - 0.6 * (x / J), top = (x) => 2.5 - (x / J);
        for (const z of [-0.75, 0.75]) {
          const a = k % 2 ? [x0, 0.9, z * f(x0)] : [x0, top(x0), 0], b = k % 2 ? [x1, top(x1), 0] : [x1, 0.9, z * f(x1)];
          beam(r, P.box, a, b, 0.09, Y);
        }
      }
      // counter-jib with concrete counterweights, tie bars to the apex
      for (const z of [-0.85, 0.85]) beam(r, P.box, [-0.5, 0.9, z], [-16, 0.9, z], 0.18, Y);
      at(r, P.box, [-8, 0.95, 0], [15, 0.1, 1.8], hex(0x6f7a84));
      for (let k = 0; k < 3; k++) at(r, P.box, [-13.2 - k * 1.1, 0.0, 0], [1.0, 2.2, 2.0], conc);
      beam(r, P.box, [0, 7.2, 0], [J * 0.62, 2.0, 0], 0.07, hex(0x555555));
      beam(r, P.box, [0, 7.2, 0], [-16, 1.0, 0], 0.07, hex(0x555555));
      // trolley, cable, hook block and the load (steel beams on slings)
      this.crane = {
        r, cr,
        trolley: at(r, P.box, [20, 0.55, 0], [1.4, 0.5, 1.3], hex(0x333333)),
        cable: at(r, P.box, [20, -10, 0], [0.05, 1, 0.05], hex(0x222222)),
        hook: at(r, P.box, [20, -20, 0], [0.6, 0.9, 0.45], Y),
        load: at(r, P.box, [20, -22, 0], [5.5, 0.55, 1.1], hex(0x8b3a2a)),
        sling1: at(r, P.box, [20, -21, 0], [0.04, 1.2, 0.04], hex(0x222222)),
        sling2: at(r, P.box, [20, -21, 0], [0.04, 1.2, 0.04], hex(0x222222)),
        lights: [at(r, P.gR, [J + 0.3, 1.8, 0], [0.4, 0.4, 0.4]), at(r, P.gR, [0, 7.5, 0], [0.4, 0.4, 0.4])],
      };
    }

    // ------------------------------------------------------------ airliner
    {
      const r = new CB.Rig(), white = hex(0xf2f2f2), grey = hex(0xb9c0c7), tail = hex(0x0e3386);
      at(r, P.cyl, [0, 0, 0], [3.8, 34, 3.8], white, [0, Math.PI / 2, 0]);
      at(r, P.sph, [0, 0, 17], [3.8, 3.8, 6.5], white);
      at(r, P.sph, [0, 0.4, -17.5], [2.6, 3.0, 9], white);
      at(r, P.box, [-8.5, -0.9, -3.0], [17, 0.35, 4.4], grey, [-0.38, 0, -0.06]);
      at(r, P.box, [8.5, -0.9, -3.0], [17, 0.35, 4.4], grey, [0.38, 0, 0.06]);
      for (const x of [-6.5, 6.5]) at(r, P.cyl, [x, -2.1, 2], [2.1, 4.4, 2.1], grey, [0, Math.PI / 2, 0]);
      at(r, P.box, [0, 4.6, -17], [0.4, 7.5, 5.5], tail, [0, -0.45, 0]);
      at(r, P.box, [-3.4, 1.2, -19.2], [6.5, 0.3, 3], grey, [-0.35, 0, 0]);
      at(r, P.box, [3.4, 1.2, -19.2], [6.5, 0.3, 3], grey, [0.35, 0, 0]);
      at(r, P.box, [0, 0.9, 0], [3.85, 0.35, 30], tail);
      this.plane = {
        r, t: 20, active: false,
        red: at(r, P.gR, [-17.2, -0.6, -4.5], [0.7, 0.7, 0.7]), green: at(r, P.gG, [17.2, -0.6, -4.5], [0.7, 0.7, 0.7]),
        strobe: at(r, P.gW, [0, 0.6, -22], [0.8, 0.8, 0.8]), beacon: at(r, P.gR, [0, -2.1, 0], [0.7, 0.4, 0.7]),
      };
      r.visible = false; r.update();
    }

    // ------------------------------------------------------------ sailboats at anchor
    this.boats = [];
    const R = CB.rng(31337), S = CB.C.SHORE, wy = City.waterY;
    const spots = [[S + 95, 300], [S + 150, 360], [S + 120, 440], [S + 210, 280], [S + 240, 520], [S + 180, -260], [S + 130, -420]];
    for (const [x, z] of spots) {
      const r = new CB.Rig(), white = hex(0xf6f6f2), hullC = R.pick([0x1d3557, 0xc1121f, 0x2a9d8f, 0x264653, 0xf4a261].map(hex));
      at(r, P.shiny, [0, 0.35, -0.3], [2.4, 1.0, 7.4], white);
      at(r, P.shiny, [0, 0.35, 3.4], [1.7, 1.0, 1.7], white, [Math.PI / 4, 0, 0]);
      at(r, P.box, [0, 0.62, -0.3], [2.44, 0.14, 7.44], hullC);
      at(r, P.box, [0, 0.88, -0.4], [2.2, 0.06, 7.0], hex(0xb08050));
      at(r, P.box, [0, 1.2, -0.8], [1.6, 0.6, 2.6], white);
      at(r, P.cyl, [0, 6.3, 0.9], [0.13, 11, 0.13], hex(0xdddddd));
      at(r, P.cyl, [0, 1.9, -1.4], [0.1, 4.6, 0.1], hex(0xdddddd), [0, Math.PI / 2, 0]);
      const widths = [4.3, 3.4, 2.4, 1.2];
      widths.forEach((w, k) => at(r, P.box, [0, 3.1 + k * 2.2, 0.85 - w / 2], [0.04, 2.25, w], white));
      [2.0, 1.3, 0.6].forEach((w, k) => at(r, P.box, [0, 2.2 + k * 2.1, 1.0 + w / 2], [0.04, 2.15, w], CB.shade(white, 0.95)));
      r.x = x; r.y = wy; r.z = z; r.yaw = R.range(0, Math.PI * 2);
      this.boats.push({ r, x, z, yaw0: r.yaw, ph: R.range(0, 6) });
    }

    // ------------------------------------------------------------ beach people
    const B = City.beach;
    this.beach = [];
    if (B) {
      const towels = City.towels.slice();
      const look = (o) => Object.assign(CB.randomLook(), { top: CB.M.pick(['tank', 'tee', 'tank']), bottom: 'shorts', hat: 'none', glasses: Math.random() < 0.4 ? 'shades' : 'none' }, o || {});
      for (let k = 0; k < 9 && towels.length; k++) {
        const tw = towels.splice(Math.floor(R() * towels.length), 1)[0];
        const h = new CB.Human(look()); h.legUp = R() < 0.4;
        this.beach.push({ h, kind: 'lie', x: tw.x, y: tw.y, z: tw.z + 0.9, yaw: tw.yaw });
      }
      for (let k = 0; k < 5 && towels.length; k++) {
        const tw = towels.splice(Math.floor(R() * towels.length), 1)[0];
        this.beach.push({ h: new CB.Human(look()), kind: 'sit', x: tw.x, y: tw.y, z: tw.z, yaw: Math.PI / 2 + R.range(-0.4, 0.4) });
      }
      for (let k = 0; k < 4; k++) {
        const x = B.waterX + R.range(3, 9), z = R.range(B.z0 + 30, B.z1 - 30);
        this.beach.push({ h: new CB.Human(look()), kind: k < 2 ? 'wade' : 'swim', x, z, yaw: R.range(0, 6.28), cx: x, cz: z, ph: R.range(0, 6) });
      }
      const lg = B.chair;
      if (lg) this.beach.push({ h: new CB.Human(look({ top: 'tank', topCol: 0xc1121f, hat: 'cap', hatCol: 0xc1121f, glasses: 'shades' })), kind: 'sit', x: lg.x, y: lg.y, z: lg.z, yaw: Math.PI / 2 });
      // volleyball: two a side, ball flying between them
      const N = B.net;
      if (N) {
        this.volley = { players: [], ball: P.sph.alloc(hex(0xfdf0d5)), t: 0, from: 0, to: 2, net: N };
        for (const [dx, dz] of [[-3.2, -1.8], [-3.6, 2.0], [3.2, -2.0], [3.6, 1.6]]) {
          const p = { h: new CB.Human(look()), kind: 'volley', x: N.x + dx, z: N.z + dz, yaw: dx < 0 ? Math.PI / 2 : -Math.PI / 2 };
          p.hx = p.x; p.hz = p.z;
          this.volley.players.push(p); this.beach.push(p);
        }
      }
      this.beachC = { x: (B.x0 + B.x1) / 2, z: (B.z0 + B.z1) / 2 };
      for (const p of this.beach) { p.h.setVisible(false); p.h.rig.update(); }
      this.beachOn = false;
    }

    // ------------------------------------------------------------ pickup basketball (nearest court)
    this.ballers = [0, 1, 2].map(() => ({ h: new CB.Human(Object.assign(CB.randomLook(), { top: M.pick(['tank', 'tee']), bottom: 'shorts', hat: 'none' })), x: 0, z: 0, tx: 0, tz: 0, yaw: 0 }));
    for (const b of this.ballers) { b.h.setVisible(false); b.h.rig.update(); }
    this.hoopBall = P.sph.alloc(hex(0xe8701a));
    P.sph.hide(this.hoopBall); P.sph.hide(this.volley ? this.volley.ball : -1);
    this.court = null;
  };

  // ---------------------------------------------------------------- per frame
  AM.update = function (dt, game, cx, cz) {
    this.t += dt;
    const t = this.t, P = CB.Pools, City = CB.City;
    // crane: slews between the yard and the top of the building, trolley in and out, load up and down
    const C = this.crane;
    if (C) {
      const r = C.r, cr = C.cr;
      r.yaw = 2.6 + Math.sin(t * 0.045) * 1.25;
      const tx = 22 + Math.sin(t * 0.07 + 1) * 15;
      const hookY = M.clamp(14 + Math.sin(t * 0.06) * 30, 3, cr.y - 6) - cr.y; // world height of the hook minus crane top
      C.trolley.jx = tx;
      C.cable.jx = tx; C.cable.jy = (0.3 + hookY + 0.5) / 2; C.cable.sy = Math.max(0.1, 0.3 - hookY - 0.5);
      C.hook.jx = tx; C.hook.jy = hookY;
      C.load.jx = tx; C.load.jy = hookY - 2.2;
      C.sling1.jx = tx - 0.9; C.sling1.jy = hookY - 1.3; C.sling1.roll = 0.6;
      C.sling2.jx = tx + 0.9; C.sling2.jy = hookY - 1.3; C.sling2.roll = -0.6;
      const blink = (t % 1.6) < 0.8;
      for (const l of C.lights) l.vis = blink;
      r.update();
    }
    // airliner crossing the sky every so often (lights blink)
    const Pl = this.plane;
    Pl.t -= dt;
    if (!Pl.active && Pl.t <= 0) {
      Pl.active = true;
      const dir = Math.random() < 0.5 ? 1 : -1, z0 = M.rand(-700, 700), z1 = z0 + M.rand(-500, 500);
      Pl.a = [-1800 * dir + 200, M.rand(330, 430), z0]; Pl.b = [1800 * dir + 200, Pl.a[1] - M.rand(0, 60), z1];
      Pl.len = Math.hypot(Pl.b[0] - Pl.a[0], Pl.b[2] - Pl.a[2]); Pl.s = 0;
      Pl.r.yaw = Math.atan2(Pl.b[0] - Pl.a[0], Pl.b[2] - Pl.a[2]); Pl.r.visible = true;
    }
    if (Pl.active) {
      Pl.s += 75 * dt;
      const f = Pl.s / Pl.len;
      Pl.r.x = M.lerp(Pl.a[0], Pl.b[0], f); Pl.r.y = M.lerp(Pl.a[1], Pl.b[1], f); Pl.r.z = M.lerp(Pl.a[2], Pl.b[2], f);
      Pl.r.roll = Math.sin(t * 0.3) * 0.03;
      Pl.strobe.vis = (t % 1.2) < 0.08; Pl.beacon.vis = (t % 1.0) < 0.5;
      if (f >= 1) { Pl.active = false; Pl.t = M.rand(35, 70); Pl.r.visible = false; }
      Pl.r.update();
    }
    // sailboats bob and swing at anchor
    for (const b of this.boats) {
      if (M.dist2(b.x, b.z, cx, cz) > 800 * 800) continue;
      const r = b.r;
      r.y = City.waterY + Math.sin(t * 1.1 + b.ph) * 0.12 - 0.15;
      r.pitch = Math.sin(t * 0.9 + b.ph) * 0.035; r.roll = Math.sin(t * 0.7 + b.ph * 2) * 0.06;
      r.yaw = b.yaw0 + Math.sin(t * 0.05 + b.ph) * 0.4;
      r.update();
    }
    this.updateBeach(dt, cx, cz);
    this.updateCourt(dt, cx, cz);
  };

  AM.updateBeach = function (dt, cx, cz) {
    if (!this.beachC) return;
    const on = M.dist2(this.beachC.x, this.beachC.z, cx, cz) < 320 * 320;
    if (!on) {
      if (this.beachOn) { for (const p of this.beach) { p.h.setVisible(false); p.h.rig.update(); } CB.Pools.sph.hide(this.volley && this.volley.ball); }
      this.beachOn = false; return;
    }
    if (!this.beachOn) for (const p of this.beach) p.h.setVisible(true);
    this.beachOn = true;
    const City = CB.City, t = this.t, wy = City.waterY;
    const V = this.volley;
    for (const p of this.beach) {
      const h = p.h, D = h.D;
      switch (p.kind) {
        case 'lie': h.animate(dt, 0, 'lie'); h.place(p.x, p.y + 0.14, p.z, p.yaw, -Math.PI / 2, 0); break;
        case 'sit': h.animate(dt, 0, 'sit'); h.place(p.x, p.y - D.hipY + 0.07, p.z, p.yaw, 0, h.a.lean); break;
        case 'wade': {
          h.animate(dt, 0, 'pose');
          h.place(p.x, City.beachY(p.x) + Math.sin(t * 1.3 + p.ph) * 0.04, p.z, p.yaw + Math.sin(t * 0.2 + p.ph) * 0.6, 0, 0);
          break;
        }
        case 'swim': { // slow circles near the beach
          const a = t * 0.06 + p.ph, x = p.cx + Math.cos(a) * 9, z = p.cz + Math.sin(a) * 9;
          h.animate(dt, 0, 'swim');
          h.place(x, wy - 0.12, z, Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI / 2, Math.PI / 2, 0);
          break;
        }
        case 'volley': {
          const busy = V && (V.players.indexOf(p) === V.to) && V.t > 0.75;
          const sx = Math.sin(t * 0.8 + p.hz) * 0.8;
          const x = p.hx, z = p.hz + sx, moving = Math.abs(Math.cos(t * 0.8 + p.hz)) * 0.8;
          h.animate(dt, busy ? 0 : moving, busy ? 'cheer' : 'walk');
          h.place(x, City.groundY(x, z), z, p.yaw, 0, h.a.lean);
          p.x = x; p.z = z;
          break;
        }
      }
    }
    if (V) { // ball arcs over the net from player to player
      V.t += dt / 1.3;
      if (V.t >= 1) {
        V.t = 0; V.from = V.to;
        const other = V.from < 2 ? [2, 3] : [0, 1];
        V.to = other[Math.random() < 0.5 ? 0 : 1];
      }
      const a = V.players[V.from], b = V.players[V.to];
      const y0 = City.groundY(a.x, a.z) + 2.3, y1 = City.groundY(b.x, b.z) + 2.3;
      const x = M.lerp(a.x, b.x, V.t), z = M.lerp(a.z, b.z, V.t), y = M.lerp(y0, y1, V.t) + Math.sin(V.t * Math.PI) * 4.5;
      CB.placeSlot(CB.Pools.sph, V.ball, x, y, z, 0.24, 0.24, 0.24);
    }
  };

  AM.updateCourt = function (dt, cx, cz) {
    const City = CB.City, P = CB.Pools;
    let best = null, bd = 140 * 140;
    for (const c of City.courts) { const d = M.dist2(c.cx, c.cz, cx, cz); if (d < bd) { bd = d; best = c; } }
    if (best !== this.court) {
      this.court = best;
      for (const b of this.ballers) { b.h.setVisible(!!best); if (!best) b.h.rig.update(); }
      if (!best) { P.sph.hide(this.hoopBall); return; }
      this.ballers.forEach((b, i) => { b.x = best.cx + (i - 1) * 3; b.z = best.cz + (i - 1) * 1.5; b.tx = b.x; b.tz = b.z; });
      this.bh = 0; this.shot = null; this.hoop = City.hoops.find((h) => M.dist(h.x, h.z, best.cx, best.cz) < 14) || City.hoops[0];
    }
    if (!best) return;
    const t = this.t, hoop = City.hoops.filter((h) => M.dist(h.x, h.z, best.cx, best.cz) < 14).sort((a, b) => Math.abs(a.x - best.x1) - Math.abs(b.x - best.x1))[0] || this.hoop;
    const holder = this.ballers[this.bh];
    for (let i = 0; i < 3; i++) {
      const b = this.ballers[i];
      // wander around the half court near the hoop
      if (M.dist(b.x, b.z, b.tx, b.tz) < 0.5) { b.tx = M.lerp(best.cx, hoop.x, 0.25 + Math.random() * 0.6); b.tz = best.cz + M.rand(-4.5, 4.5); }
      const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz) || 1;
      const shooting = this.shot && this.shot.by === i && this.shot.t < 0.35;
      const sp = shooting ? 0 : (i === this.bh ? 2.2 : 3.4);
      b.x += dx / d * sp * dt; b.z += dz / d * sp * dt;
      b.yaw = M.turn(b.yaw, shooting || i === this.bh && !this.shot ? Math.atan2(hoop.x - b.x, hoop.z - b.z) : Math.atan2(dx, dz), dt * 6);
      b.h.animate(dt, sp, shooting ? 'cheer' : 'walk');
      b.h.place(b.x, City.groundY(b.x, b.z), b.z, b.yaw, 0, b.h.a.lean);
    }
    // ball: dribble, then a shot at the hoop every few seconds
    if (!this.shot && Math.random() < dt * 0.35) this.shot = { by: this.bh, t: 0, x0: holder.x, z0: holder.z };
    if (this.shot) {
      const s = this.shot;
      s.t += dt / 1.1;
      const f = Math.min(1, s.t);
      const x = M.lerp(s.x0, hoop.x, f), z = M.lerp(s.z0, hoop.z, f), y = M.lerp(City.groundY(s.x0, s.z0) + 2.2, hoop.y + 0.2, f) + Math.sin(f * Math.PI) * 2.6;
      if (s.t < 1) CB.placeSlot(P.sph, this.hoopBall, x, y, z, 0.25, 0.25, 0.25);
      else { // through the net, bounce, next player picks it up
        const k = s.t - 1, y2 = Math.max(City.groundY(hoop.x, hoop.z) + 0.13, hoop.y - k * 6);
        CB.placeSlot(P.sph, this.hoopBall, hoop.x, y2, hoop.z, 0.25, 0.25, 0.25);
        if (s.t > 1.6) { this.shot = null; this.bh = (this.bh + 1) % 3; }
      }
    } else {
      const fx = Math.sin(holder.yaw), fz = Math.cos(holder.yaw);
      const y = City.groundY(holder.x, holder.z) + 0.15 + Math.abs(Math.sin(this.t * 7)) * 0.75;
      CB.placeSlot(P.sph, this.hoopBall, holder.x + fx * 0.45 + fz * 0.25, y, holder.z + fz * 0.45 - fx * 0.25, 0.25, 0.25, 0.25);
    }
  };
})(window.CB);
