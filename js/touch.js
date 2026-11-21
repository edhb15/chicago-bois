// Touch controls for phones and tablets.
// Left side: a floating joystick (walk / drive; push it all the way to sprint).
// Right side: drag to look around. Buttons press the same virtual keys as the keyboard,
// so every action goes through the normal game code.
(function (CB) {
  const M = CB.M;
  const T = CB.Touch = { on: false, stick: { x: 0, y: 0, mag: 0 }, looking: false };

  // Phones and tablets: a coarse pointer and no mouse. A setting can force it on or off.
  T.detect = function () {
    const mm = (q) => window.matchMedia && window.matchMedia(q).matches;
    return mm('(pointer: coarse)') || (navigator.maxTouchPoints > 0 && !mm('(pointer: fine)'));
  };
  T.wanted = function () {
    const s = CB.settings.touch || 'auto';
    return s === 'on' || (s === 'auto' && T.detect());
  };

  // Keyboard hints in HUD texts become the matching touch button.
  T.text = function (s) {
    if (!T.on || !s) return s;
    return s.replace(/<kbd>E<\/kbd>/g, '<kbd>✋</kbd>').replace(/<b>E<\/b>/g, '<b>✋</b>')
      .replace(/\(click \/ F\)/g, '(👊)').replace(/\(F \/ click\)/g, '(👊)').replace(/press M to close/g, 'tap 🗺 to close')
      .replace(/Hold E/g, 'Hold ✋').replace(/hold E\b/g, 'hold ✋').replace(/Press R to switch the radio off/g, 'Tap 📻 to switch the radio off')
      .replace(/Press M for the map/g, 'Tap 🗺 for the map');
  };

  const BTN = {
    attack: { key: 'KeyF', icon: '👊', label: '', big: true },
    jump: { key: 'Space', icon: '⤒', label: 'JUMP' },
    act: { key: 'KeyE', icon: '✋', label: '' },
    aim: { toggle: true, icon: '🎯', label: 'AIM' },
    weapon: { key: 'KeyQ', icon: '🔄', label: 'SWITCH' },
    horn: { key: 'KeyH', icon: '📢', label: 'HORN' },
    radio: { key: 'KeyR', icon: '📻', label: 'RADIO' },
    reload: { key: 'KeyR', icon: '🔃', label: 'RELOAD' },
    map: { key: 'KeyM', icon: '🗺', label: '', small: true },
    pause: { fn: 'pause', icon: '⏸', label: '', small: true },
  };

  T.init = function (game) {
    T.game = game;
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = '<div id="tJoy"></div><div id="tLook"></div><div id="tStick" class="hidden"><div class="tknob"></div></div>';
    document.body.appendChild(root);
    T.root = root;
    T.el = {};
    for (const [id, b] of Object.entries(BTN)) {
      const el = document.createElement('div');
      el.className = 'tbtn' + (b.big ? ' big' : '') + (b.small ? ' small' : '');
      el.id = 'tb_' + id;
      el.innerHTML = `<span class="ti">${b.icon}</span>` + (b.label ? `<small>${b.label}</small>` : '') + '<em></em>';
      root.appendChild(el);
      T.el[id] = el;
      bindButton(el, id, b);
    }
    const rot = document.createElement('div');
    rot.id = 'rotate';
    rot.innerHTML = '<div><div class="rot-phone">📱</div><b>TURN YOUR PHONE SIDEWAYS</b><span>Chicago Bois plays in landscape.</span></div>';
    document.body.appendChild(rot);
    bindStick(document.getElementById('tJoy'));
    bindLook(document.getElementById('tLook'));
    T.apply();
  };

  // Switch touch mode on or off (from the settings).
  T.apply = function () {
    T.on = T.wanted();
    document.body.classList.toggle('touch', T.on);
    for (const el of document.querySelectorAll('[data-touch-text]')) {
      if (!el.dataset.keyText) el.dataset.keyText = el.innerHTML;
      el.innerHTML = T.on ? el.dataset.touchText : el.dataset.keyText;
    }
    if (!T.on) T.release();
  };

  // Let go of everything (pause, menus, losing focus).
  T.release = function () {
    T.stick.x = T.stick.y = T.stick.mag = 0;
    T.stickId = T.lookId = null; T.looking = false;
    const st = document.getElementById('tStick'); if (st) st.classList.add('hidden');
    for (const id in T.el) T.el[id].classList.remove('down');
    if (T.game) for (const k of ['KeyF', 'Space', 'KeyE', 'KeyQ', 'KeyH', 'KeyR', 'KeyM']) T.game.keys[k] = false;
  };

  function bindButton(el, id, b) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      CB.Audio.init();
      el.classList.add('down');
      const g = T.game;
      if (b.fn === 'pause') { g.pause(); return; }
      if (b.toggle) { g.aimHeld = !g.aimHeld; el.classList.toggle('on', g.aimHeld); return; }
      g.vkey(b.key, true);
    });
    const up = (e) => {
      el.classList.remove('down');
      if (b.key) T.game.vkey(b.key, false);
      void e;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Floating joystick: it appears where the thumb lands.
  function bindStick(zone) {
    const stick = document.getElementById('tStick'), knob = stick.firstChild;
    const R = 58;
    let ox = 0, oy = 0;
    zone.addEventListener('pointerdown', (e) => {
      if (T.stickId != null) return;
      e.preventDefault();
      T.stickId = e.pointerId;
      try { zone.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      ox = e.clientX; oy = e.clientY;
      stick.style.left = ox + 'px'; stick.style.top = oy + 'px';
      knob.style.transform = 'translate(0px, 0px)';
      stick.classList.remove('hidden');
      CB.Audio.init();
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== T.stickId) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      // drag the base along when the thumb runs past the edge
      if (d > R * 1.35) { const k = (d - R * 1.35) / d; ox += dx * k; oy += dy * k; dx = e.clientX - ox; dy = e.clientY - oy; stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; }
      const dd = Math.min(R, Math.hypot(dx, dy)) / (Math.hypot(dx, dy) || 1);
      knob.style.transform = `translate(${dx * dd}px, ${dy * dd}px)`;
      T.stick.x = M.clamp(dx / R, -1, 1); T.stick.y = M.clamp(-dy / R, -1, 1);
      T.stick.mag = Math.min(1, Math.hypot(dx, dy) / R);
    });
    const end = (e) => {
      if (e.pointerId !== T.stickId) return;
      T.stickId = null; T.stick.x = T.stick.y = T.stick.mag = 0;
      stick.classList.add('hidden');
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  // Drag anywhere on the right to look around.
  function bindLook(zone) {
    let lx = 0, ly = 0;
    zone.addEventListener('pointerdown', (e) => {
      if (T.lookId != null) return;
      e.preventDefault();
      T.lookId = e.pointerId; T.looking = true;
      try { zone.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      lx = e.clientX; ly = e.clientY;
      CB.Audio.init();
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== T.lookId) return;
      const g = T.game, s = 0.0058 * CB.settings.sens;
      g.camYaw += (e.clientX - lx) * s;
      g.camPitch = M.clamp(g.camPitch + (e.clientY - ly) * s * 0.8 * (CB.settings.invertY ? -1 : 1), -0.45, 1.15);
      g.mouseIdle = 0;
      lx = e.clientX; ly = e.clientY;
    });
    const end = (e) => { if (e.pointerId !== T.lookId) return; T.lookId = null; T.looking = false; };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  // Show the buttons that make sense right now.
  T.update = function (game) {
    if (!T.root) return;
    const playing = T.on && game.state === 'playing';
    document.body.classList.toggle('playing', game.state === 'playing');
    T.root.classList.toggle('on', playing);
    if (!playing) { if (T.stickId != null || T.lookId != null) T.release(); return; }
    const pl = game.player, A = CB.Activities, inCar = !!pl.inCar;
    const show = (id, v) => T.el[id].classList.toggle('hidden', !v);
    const map = !!CB.HUD.bigOpen;
    T.root.classList.toggle('map', map);
    const foot = !inCar && !pl.hidden && !pl.dead;
    show('attack', foot); show('jump', !pl.hidden); show('weapon', foot); show('aim', foot && pl.weapon === 'pistol');
    show('reload', foot && pl.weapon === 'pistol' && pl.ammo < 12 && pl.reloadT <= 0);
    show('horn', inCar); show('radio', inCar);
    // jump becomes the handbrake in a car
    const jl = T.el.jump.querySelector('small'), ji = T.el.jump.querySelector('.ti');
    const jt = inCar ? 'BRAKE' : 'JUMP';
    if (jl.textContent !== jt) { jl.textContent = jt; ji.textContent = inCar ? '🅿' : '⤒'; }
    // attack shows the weapon in hand
    const wi = CB.WEAPON_INFO && CB.WEAPON_INFO[pl.weapon];
    const ai = T.el.attack.querySelector('.ti');
    if (wi && ai.textContent !== wi.icon) ai.textContent = wi.icon;
    const ammo = pl.weapon === 'pistol' ? (pl.reloadT > 0 ? '…' : String(pl.ammo)) : '';
    const am = T.el.attack.querySelector('em');
    if (am.textContent !== ammo) am.textContent = ammo;
    if (pl.weapon !== 'pistol' || inCar) { if (game.aimHeld && !inCar) game.aimHeld = false; }
    T.el.aim.classList.toggle('on', !!game.aimHeld);
    // the action button lights up when there's something to do
    const hud = CB.HUD, can = (hud._pt && !hud.el.prompt.classList.contains('no')) || A.pick || A.hold || pl.hidden;
    const label = inCar ? '🚪' : pl.hidden ? '🚪' : '✋';
    const ac = T.el.act.querySelector('.ti');
    if (ac.textContent !== label) ac.textContent = label;
    T.el.act.classList.toggle('hot', !!can);
    T.el.act.classList.toggle('dim', !can && !inCar);
  };
})(window.CB);
