// Weather: clouds that roll in, rain, wet shiny streets that reflect the city and its lights,
// splashes, and lightning with thunder in heavy storms.
// CB.Weather.cover (0..1) darkens the sky and light, .rain (0..1) is how hard it pours,
// .wet (0..1) lags behind the rain (streets stay wet for a while after it stops).
(function (CB) {
  const B = BABYLON, M = CB.M;
  const W = CB.Weather = {
    cover: 0, rain: 0, wet: 0, flash: 0, target: 0, storm: false,
    phase: 'clear', phaseT: 100 + Math.random() * 60, boltT: 6, thunder: [], q: 'medium',
  };
  const CAP = { low: 1400, medium: 2800, high: 4600, ultra: 6500 };

  W.init = function (scene, sky) {
    this.scene = scene; this.sky = sky;
    // a thin streak, brighter at the leading end
    const st = new B.DynamicTexture('rainStreak', { width: 16, height: 128 }, scene, false);
    const c = st.getContext();
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.65, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0.95)');
    c.fillStyle = g; c.fillRect(5, 0, 6, 128);
    st.hasAlpha = true; st.update();
    const dot = new B.DynamicTexture('rainDot', { width: 32, height: 32 }, scene, false);
    const d = dot.getContext(), rg = d.createRadialGradient(16, 16, 1, 16, 16, 15);
    rg.addColorStop(0, 'rgba(255,255,255,0.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    d.fillStyle = rg; d.fillRect(0, 0, 32, 32); dot.hasAlpha = true; dot.update();
    this.tex = { streak: st, dot };
    this.emitter = new B.Vector3(0, -200, 0);
    this.splashAt = new B.Vector3(0, -200, 0);
    this.build(CAP.medium);
    // splashes on the ground around the camera
    const sp = new B.ParticleSystem('splash', 700, scene);
    sp.particleTexture = dot; sp.emitter = this.splashAt;
    sp.minEmitBox = new B.Vector3(-18, 0, -18); sp.maxEmitBox = new B.Vector3(18, 0, 18);
    sp.direction1 = new B.Vector3(-0.4, 1, -0.4); sp.direction2 = new B.Vector3(0.4, 1.6, 0.4);
    sp.minEmitPower = 0.6; sp.maxEmitPower = 1.5; sp.gravity = new B.Vector3(0, -9, 0);
    sp.minLifeTime = 0.16; sp.maxLifeTime = 0.3; sp.minSize = 0.05; sp.maxSize = 0.13;
    sp.color1 = new B.Color4(0.85, 0.9, 1, 0.5); sp.color2 = new B.Color4(0.8, 0.85, 0.95, 0.35); sp.colorDead = new B.Color4(0.8, 0.85, 0.95, 0);
    sp.blendMode = B.ParticleSystem.BLENDMODE_STANDARD; sp.emitRate = 0; sp.start();
    this.splash = sp;
  };

  // Falling rain: stretched streaks in a box that follows the camera.
  W.build = function (cap) {
    if (this.ps) this.ps.dispose(false); // keep the shared streak texture
    const ps = new B.ParticleSystem('rain', cap, this.scene);
    ps.particleTexture = this.tex.streak;
    ps.billboardMode = B.ParticleSystem.BILLBOARDMODE_Y; // upright streaks that always face the camera
    ps.emitter = this.emitter;
    ps.minEmitBox = new B.Vector3(-30, 12, -30); ps.maxEmitBox = new B.Vector3(30, 22, 30);
    ps.direction1 = new B.Vector3(-0.06, -1, -0.04); ps.direction2 = new B.Vector3(0.06, -1, 0.04);
    ps.minEmitPower = 21; ps.maxEmitPower = 27; ps.gravity = new B.Vector3(0, 0, 0);
    ps.minLifeTime = 0.85; ps.maxLifeTime = 1.0;
    ps.minSize = 0.05; ps.maxSize = 0.065; ps.minScaleX = 1.3; ps.maxScaleX = 1.7; ps.minScaleY = 13; ps.maxScaleY = 18;
    ps.color1 = new B.Color4(0.78, 0.82, 0.9, 0.42); ps.color2 = new B.Color4(0.7, 0.75, 0.85, 0.3); ps.colorDead = new B.Color4(0.7, 0.75, 0.85, 0);
    ps.blendMode = B.ParticleSystem.BLENDMODE_STANDARD;
    ps.emitRate = 0; ps.updateSpeed = 1 / 60;
    ps.start();
    this.ps = ps; this.cap = cap;
  };

  // Quality: fewer drops on Low and Medium; mirror-like wet streets on High and Ultra.
  W.setQuality = function (q) {
    this.q = q;
    if (this.tex && CAP[q] !== this.cap) this.build(CAP[q]);
    if (this.mirror) this.dropMirror();
  };

  // Wet-street reflections: a planar mirror at street level, blurred into vertical streaks
  // the way lights smear on wet asphalt.
  W.ensureMirror = function () {
    if (this.mirror) return;
    const ultra = this.q === 'ultra';
    const mt = new B.MirrorTexture('wetMirror', { ratio: ultra ? 0.5 : 0.35 }, this.scene, true);
    mt.mirrorPlane = B.Plane.FromPositionAndNormal(new B.Vector3(0, 0.02, 0), new B.Vector3(0, -1, 0));
    mt.blurKernelX = ultra ? 14 : 10; mt.blurKernelY = ultra ? 48 : 36;
    mt.refreshRate = ultra ? 1 : 2;
    mt.level = 0;
    this.mirror = mt; this.listT = 0;
    const g = CB.City.mats.ground;
    g.reflectionTexture = mt;
    g.reflectionFresnelParameters = new B.FresnelParameters();
    g.reflectionFresnelParameters.bias = 0.12; g.reflectionFresnelParameters.power = 1.6;
    g.reflectionFresnelParameters.leftColor = B.Color3.White(); g.reflectionFresnelParameters.rightColor = new B.Color3(0.2, 0.2, 0.2);
  };
  W.dropMirror = function () {
    if (!this.mirror) return;
    const g = CB.City.mats.ground;
    g.reflectionTexture = null; g.reflectionFresnelParameters = null;
    this.mirror.dispose(); this.mirror = null;
  };

  // Weather setting: 'auto' (it changes now and then), 'clear' or 'rain'.
  function schedule(dt) {
    const mode = CB.settings.weather || 'auto';
    if (mode === 'clear') { W.target = 0; W.storm = false; return; }
    if (mode === 'rain') { W.target = 0.85; W.storm = true; return; }
    W.phaseT -= dt;
    if (W.phaseT > 0) return;
    if (W.phase === 'clear') {
      W.phase = 'rain'; W.phaseT = M.rand(80, 170);
      W.target = M.rand(0.45, 1); W.storm = W.target > 0.75;
    } else {
      W.phase = 'clear'; W.phaseT = M.rand(150, 320);
      W.target = 0; W.storm = false;
    }
  }
  W.force = function (rain) { // for tests and screenshots
    this.target = rain; this.cover = rain > 0 ? 1 : 0; this.rain = rain; this.wet = Math.min(1, rain * 1.3); this.storm = rain > 0.75;
  };

  W.update = function (dt, game, camera) {
    if (!this.ps) return;
    schedule(dt);
    // clouds roll in first, then it starts to pour; streets dry slowly afterwards
    const wantCover = this.target > 0 ? 1 : 0;
    this.cover = M.clamp(this.cover + Math.sign(wantCover - this.cover) * dt / 22, 0, 1);
    const wantRain = this.cover > 0.75 ? this.target : 0;
    this.rain = M.clamp(this.rain + M.clamp(wantRain - this.rain, -dt / 10, dt / 14), 0, 1);
    const wantWet = Math.min(1, this.rain * 1.4);
    this.wet = M.clamp(this.wet + (wantWet > this.wet ? dt / 18 : -dt / 75), 0, 1);

    const cp = camera.position, pl = game.player;
    const indoor = game.state === 'playing' && pl && !pl.inCar && CB.City.roomAt(pl.x, pl.z);
    // rain box ahead of the camera (and ahead of a fast car)
    const fy = game.camYaw || 0, lead = 9 + (pl && pl.inCar && pl.car ? Math.min(30, pl.car.speed * 0.8) : 0);
    this.emitter.set(cp.x + Math.sin(fy) * lead, Math.max(0, cp.y - 14), cp.z + Math.cos(fy) * lead);
    const day = 1 - (game.night || 0);
    const k = 0.4 + 0.6 * day;
    this.ps.color1.set(0.8 * k + 0.12, 0.84 * k + 0.12, 0.92 * k + 0.12, 0.5);
    this.ps.color2.set(0.72 * k + 0.12, 0.77 * k + 0.12, 0.87 * k + 0.12, 0.36);
    this.ps.emitRate = indoor ? 0 : this.rain * this.cap / 0.95;
    this.splash.color1.set(0.85 * k, 0.9 * k, 1 * k, 0.5); this.splash.color2.set(0.8 * k, 0.85 * k, 0.95 * k, 0.35);
    this.splashAt.set(cp.x + Math.sin(fy) * 8, 0.06, cp.z + Math.cos(fy) * 8);
    this.splash.emitRate = indoor || cp.y > 30 ? 0 : this.rain * 900;
    CB.Audio.loop('rain', this.rain * (indoor ? 0.05 : 0.13));

    // wet streets: darker, glossy, and (from Medium) reflecting the city around you
    const g = CB.City.mats.ground, wet = this.wet;
    g.specularColor.set(0.12 + 0.5 * wet, 0.12 + 0.52 * wet, 0.12 + 0.56 * wet);
    g.specularPower = 24 + 90 * wet;
    g.diffuseColor.set(1 - 0.3 * wet, 1 - 0.3 * wet, 1 - 0.27 * wet);
    for (const n of ['office', 'brick', 'stone']) { const m = CB.City.mats[n]; if (m) m.diffuseColor.set(1 - 0.16 * wet, 1 - 0.16 * wet, 1 - 0.14 * wet); }
    const mirrorQ = this.q === 'high' || this.q === 'ultra';
    if (wet > 0.03 && mirrorQ) this.ensureMirror();
    else if ((wet <= 0.01 || !mirrorQ) && this.mirror) this.dropMirror();
    if (this.mirror) {
      this.mirror.level = wet * (0.34 + 0.34 * (game.night || 0)); // lights at night, a softer sheen by day
      this.listT -= dt;
      if (this.listT <= 0) {
        // what can show up in the puddles: nearby buildings, signs, billboards, lamps and the sky
        this.listT = 0.6;
        const rl = this.mirror.renderList; rl.length = 0;
        rl.push(this.sky);
        for (const c of CB.City.chunkMeshes) if (c.kind !== 'interior' && c.mesh.isEnabled() && M.dist(c.x, c.z, cp.x, cp.z) < 240) rl.push(c.mesh);
        for (const m of [CB.City.signMesh, CB.City.adMesh].concat(CB.Pools.glowMeshes || [])) if (m) rl.push(m);
      }
    }

    // lightning in storms: a double flash, thunder a moment later (sooner when it's close)
    this.flash = Math.max(0, this.flash - dt * 6);
    if (this.flick > 0) { this.flick -= dt; if (this.flick <= 0) this.flash = Math.max(this.flash, 0.8); }
    if (this.storm && this.rain > 0.55) {
      this.boltT -= dt;
      if (this.boltT <= 0) {
        this.boltT = M.rand(7, 20);
        const close = Math.random();
        this.flash = 0.7 + 0.3 * close; this.flick = 0.13;
        if (close > 0.7 && CB.FX && CB.FX.flash) CB.FX.flash('#dfe8ff', 0.18);
        this.thunder.push({ t: M.lerp(2.4, 0.25, close), v: 0.45 + 0.55 * close });
      }
    }
    for (let i = this.thunder.length - 1; i >= 0; i--) {
      const th = this.thunder[i];
      th.t -= dt;
      if (th.t <= 0) { CB.Audio.play('thunder', th.v * (indoor ? 0.6 : 1)); this.thunder.splice(i, 1); }
    }
  };
})(window.CB);
