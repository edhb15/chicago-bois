// Chicago Bois – character select / customisation screen with a live 3D preview on the pier.
'use strict';
(function (CB) {
  const M = CB.M;
  const $ = (id) => document.getElementById(id);
  const css = (c) => '#' + c.toString(16).padStart(6, '0');

  const LABEL = {
    body: { m: 'Male', f: 'Female' },
    build: { slim: 'Slim', regular: 'Regular', heavy: 'Heavy' },
    height: { 0.94: 'Short', 0.97: 'Below average', 1: 'Average', 1.03: 'Tall', 1.06: 'Very tall' },
    hair: { short: 'Short', buzz: 'Buzz cut', curly: 'Curly', long: 'Long', ponytail: 'Ponytail', bun: 'Bun', afro: 'Afro', mohawk: 'Mohawk', bald: 'Bald' },
    facial: { none: 'None', stubble: 'Stubble', mustache: 'Mustache', goatee: 'Goatee', beard: 'Full beard' },
    hat: { none: 'None', cap: 'Baseball cap', beanie: 'Beanie' },
    glasses: { none: 'None', shades: 'Shades' },
    top: { tee: 'T-shirt', long: 'Long sleeves', hoodie: 'Hoodie', jacket: 'Open jacket', tank: 'Tank top' },
    bottom: { jeans: 'Long pants', shorts: 'Shorts' },
  };
  // [label, kind, key, palette name, colour key, colour palette]
  const ROWS = [
    ['Body', 'cycle', 'body'], ['Build', 'cycle', 'build'], ['Height', 'cycle', 'height'],
    ['Skin', 'swatch', 'skin', 'SKINS'],
    ['Hair', 'cycle', 'hair', null, 'hairCol', 'HAIR_COLS'],
    ['Facial hair', 'cycle', 'facial'],
    ['Eyes', 'swatch', 'eyes', 'EYE_COLS'],
    ['Hat', 'cycle', 'hat', null, 'hatCol', 'TOP_COLS'],
    ['Glasses', 'cycle', 'glasses'],
    ['Top', 'cycle', 'top', null, 'topCol', 'TOP_COLS'],
    ['Inner shirt', 'swatch', 'accent', 'TOP_COLS'],
    ['Pants', 'cycle', 'bottom', null, 'pantsCol', 'PANTS_COLS'],
    ['Shoes', 'swatch', 'shoes', 'SHOE_COLS'],
    ['Gold chain', 'toggle', 'chain'],
  ];

  const CS = CB.CharScreen = {
    built: false, yaw: 0.5, dist: 3.0, drag: null,

    build() {
      const L = CB.LOOK;
      let html = '';
      for (const [label, kind, key, pal, ckey, cpal] of ROWS) {
        html += `<div class="crow" data-row="${key}"><span class="clab">${label}</span>`;
        if (kind === 'cycle') html += `<span class="ccyc"><button class="carr" data-k="${key}" data-d="-1" aria-label="Previous ${label}">◀</button><b id="cv_${key}"></b><button class="carr" data-k="${key}" data-d="1" aria-label="Next ${label}">▶</button></span>`;
        if (kind === 'toggle') html += `<span class="ccyc"><button class="ctog" data-k="${key}" id="cv_${key}"></button></span>`;
        const swatches = (k, p) => `<span class="csw" data-k="${k}">${L[p].map((c) => `<button class="sw" data-k="${k}" data-c="${c}" style="background:${css(c)}" aria-label="${label} colour"></button>`).join('')}</span>`;
        if (kind === 'swatch') html += swatches(key, pal);
        if (ckey) html += swatches(ckey, cpal);
        html += '</div>';
      }
      $('charOpts').innerHTML = html;
      $('charPresets').innerHTML = CB.PRESETS.map((p, i) => `<button data-p="${i}">${p.name}</button>`).join('');

      $('charOpts').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        const k = b.dataset.k;
        if (b.classList.contains('carr')) {
          const opts = CB.LOOK.OPT[k], i = opts.indexOf(this.look[k]);
          this.look[k] = opts[(i + Number(b.dataset.d) + opts.length) % opts.length];
          if (k === 'body') { // sensible defaults when switching body
            if (this.look.body === 'f') this.look.facial = 'none';
          }
        } else if (b.classList.contains('sw')) this.look[k] = Number(b.dataset.c);
        else if (b.classList.contains('ctog')) this.look[k] = !this.look[k];
        this.look.name = 'Custom';
        CB.Audio.play('blip', 0.35);
        this.apply();
      });
      $('charPresets').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        this.look = Object.assign({}, CB.PRESETS[Number(b.dataset.p)]);
        CB.Audio.play('whoosh', 0.5);
        this.apply();
      });
      $('btnCharRandom').addEventListener('click', (e) => {
        e.stopPropagation();
        this.look = Object.assign(CB.randomLook(), { chain: Math.random() < 0.5, name: 'Custom' });
        CB.Audio.play('whoosh', 0.5);
        this.apply();
      });
      // drag the stage to turn the character, wheel to zoom
      const scr = $('character');
      scr.addEventListener('pointerdown', (e) => { if (e.target.closest('.char-panel')) return; this.drag = { x: e.clientX }; scr.classList.add('dragging'); });
      window.addEventListener('pointermove', (e) => { if (!this.drag) return; this.yaw += (e.clientX - this.drag.x) * 0.012; this.drag.x = e.clientX; });
      window.addEventListener('pointerup', () => { this.drag = null; scr.classList.remove('dragging'); });
      scr.addEventListener('wheel', (e) => { if (e.target.closest('.char-opts')) return; e.preventDefault(); this.dist = M.clamp(this.dist + e.deltaY * 0.0025, 1.5, 4.6); }, { passive: false });
      this.built = true;
    },

    // Show the current look in the panel.
    refresh() {
      const L = this.look;
      for (const [, kind, key] of ROWS) {
        const el = $('cv_' + key);
        if (kind === 'cycle') el.textContent = LABEL[key][L[key]] || L[key];
        if (kind === 'toggle') { el.textContent = L[key] ? 'ON' : 'OFF'; el.classList.toggle('on', !!L[key]); }
      }
      for (const s of document.querySelectorAll('#charOpts .sw')) s.classList.toggle('on', Number(s.dataset.c) === L[s.dataset.k]);
      // dim colour pickers that don't apply
      const dim = { hatCol: L.hat === 'none', hairCol: L.hair === 'bald' && L.facial === 'none', accent: L.top !== 'jacket' };
      for (const s of document.querySelectorAll('#charOpts .csw')) s.classList.toggle('dim', !!dim[s.dataset.k]);
      const same = (p) => Object.keys(CB.LOOK.OPT).every((k) => p[k] === L[k]) && ['skin', 'hairCol', 'topCol', 'pantsCol', 'shoes'].every((k) => p[k] === L[k]);
      let on = -1;
      CB.PRESETS.forEach((p, i) => { if (on < 0 && same(p)) on = i; });
      for (const b of document.querySelectorAll('#charPresets button')) b.classList.toggle('on', Number(b.dataset.p) === on);
      $('charName').textContent = on >= 0 ? CB.PRESETS[on].name : 'Custom';
    },

    // Rebuild the player model with the look and save it.
    apply() {
      const G = this.game;
      this.look = CB.cleanLook(this.look);
      G.character = this.look;
      CB.saveCharacter(this.look);
      G.player.human.recolor(this.look);
      G.player.human.setVisible(true);
      this.refresh();
    },

    open(game) {
      this.game = game;
      if (!this.built) this.build();
      this.look = CB.cleanLook(game.character);
      this.prevDay = game.dayT;
      if (game.night > 0.25) game.dayT = 0.4; // show the character in daylight
      this.apply();
    },

    close() {
      const G = this.game;
      G.dayT = this.prevDay;
      G.player.human.setVisible(false);
      G.player.human.rig.update();
    },

    // Called every frame while the screen is open: turntable + camera.
    update(dt) {
      const G = this.game, h = G.player.human, cam = G.scene.activeCamera;
      const sx = CB.C.SHORE + 46, sz = 0, sy = CB.City.groundY(sx, sz);
      if (!this.drag) this.yaw += dt * 0.22;
      h.animate(dt, 0, 'pose');
      h.place(sx, sy, sz, this.yaw, 0, 0);
      // the camera looks west at the skyline; the character stands right of the panel
      const d = this.dist, off = d * 0.27;
      cam.position.set(sx + d, sy + 1.15 + (d - 2) * 0.12, sz - off);
      cam.setTarget(new BABYLON.Vector3(sx, sy + 0.95 + (3 - d) * 0.12, sz - off));
      cam.fov = 0.8;
      CB.Audio.lx = cam.position.x; CB.Audio.lz = cam.position.z; CB.Audio.lyaw = -Math.PI / 2;
    },
  };
})(window.CB);
