/**
 * travel-scenes.js
 * Canvas-based cinematic travel scene animations (low saturation, moody)
 * 5 scenes: Highway, Train, Hiking, Campfire, Fishing
 * Each scene runs for ~5 seconds, then crossfades to the next in a loop.
 */

(function () {
  'use strict';

  // ??? Palette (low saturation, desaturated cinematic tones) ???????????????
  const C = {
    // Highway - grey asphalt dawn
    hwy: { sky: ['#2c2e30', '#3a3d42', '#4a4f56'], road: '#1a1b1d', line: '#c8c4b0', car: '#0d0e10' },
    // Train - foggy dusk steel
    trn: { sky: ['#2a2d32', '#3d4148', '#545c66'], rail: '#1c1d1f', beam: '#e8dfc8', fog: '#7a8090' },
    // Hiking - misty mountain morning
    hike: { sky: ['#2d3035', '#404850', '#566070'], mnt: '#3a4048', fog: '#8090a0', tree: '#2a3030' },
    // Campfire - amber ember night
    fire: { sky: '#0d0e10', ember: ['#c04818', '#d06020', '#e08030', '#f0a040', '#ffc060'], log: '#1a1410' },
    // Fishing - still lake dawn
    fish: { sky: ['#2a2e34', '#363c44', '#444c58'], water: '#1e2228', reed: '#3a3830', float: '#c08048' },
  };

  // ??? Scene Registry ?????????????????????????????????????????????????????
  const SCENES = [
    { name: 'highway', draw: drawHighway, init: initHighway, state: {} },
    { name: 'train',   draw: drawTrain,   init: initTrain,   state: {} },
    { name: 'hiking',  draw: drawHiking,  init: initHiking,  state: {} },
    { name: 'campfire',draw: drawCampfire,init: initCampfire, state: {} },
    { name: 'fishing', draw: drawFishing, init: initFishing,  state: {} },
  ];

  const SCENE_DURATION = 5000; // ms per scene
  const FADE_DURATION  = 800;  // ms crossfade

  // ??? Main Init ???????????????????????????????????????????????????????????
  function initTravelSlideshow() {
    const wrapper = document.querySelector('.narrative-video-wrapper');
    if (!wrapper) return;

    // Clear existing video elements
    wrapper.innerHTML = '';

    // Create two canvases for crossfade (A/B ping-pong)
    const canvasA = createCanvas(wrapper);
    const canvasB = createCanvas(wrapper);
    canvasA.style.opacity = '1';
    canvasB.style.opacity = '0';
    canvasA.style.transition = `opacity ${FADE_DURATION}ms ease-in-out`;
    canvasB.style.transition = `opacity ${FADE_DURATION}ms ease-in-out`;
    canvasA.style.position = 'absolute';
    canvasA.style.inset = '0';
    canvasA.style.width = '100%';
    canvasA.style.height = '100%';
    canvasB.style.position = 'absolute';
    canvasB.style.inset = '0';
    canvasB.style.width = '100%';
    canvasB.style.height = '100%';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';

    const canvases = [canvasA, canvasB];
    let activeIdx = 0;    // which canvas is currently shown
    let sceneIdx  = 0;    // which scene is playing
    let running   = false;

    // Init all scene states
    SCENES.forEach(s => s.init(s.state));

    // ?? Per-scene animation loop ??????????????????????????????????????????
    let animFrame = null;
    let sceneStart = performance.now();

    function tick(now) {
      if (!running) return;
      const active = canvases[activeIdx];
      const scene  = SCENES[sceneIdx];
      const elapsed = now - sceneStart;
      const t = elapsed / SCENE_DURATION; // 0 ??1

      // Sync canvas resolution
      syncSize(active);

      // Draw current scene
      scene.draw(active, scene.state, now, t);

      // Schedule next scene at SCENE_DURATION
      if (t >= 1) {
        // Crossfade to next scene
        const nextSceneIdx  = (sceneIdx + 1) % SCENES.length;
        const nextActiveIdx = (activeIdx + 1) % 2;
        const nextCanvas    = canvases[nextActiveIdx];

        // Init next scene on the offscreen canvas
        SCENES[nextSceneIdx].init(SCENES[nextSceneIdx].state);
        syncSize(nextCanvas);
        SCENES[nextSceneIdx].draw(nextCanvas, SCENES[nextSceneIdx].state, now, 0);

        // Crossfade
        nextCanvas.style.opacity = '1';
        canvases[activeIdx].style.opacity = '0';

        sceneIdx   = nextSceneIdx;
        activeIdx  = nextActiveIdx;
        sceneStart = now;
      }

      animFrame = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      sceneStart = performance.now();
      animFrame = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    }

    // ?? IntersectionObserver ??play when visible ??????????????????????????
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.1 });

    observer.observe(wrapper);

    // Kick off immediately if already visible
    const rect = wrapper.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) start();
  }

  // ??? Helpers ?????????????????????????????????????????????????????????????
  function createCanvas(parent) {
    const c = document.createElement('canvas');
    c.style.display = 'block';
    parent.appendChild(c);
    return c;
  }

  function syncSize(canvas) {
    const w = canvas.offsetWidth  || canvas.parentElement.offsetWidth  || 1200;
    const h = canvas.offsetHeight || canvas.parentElement.offsetHeight || 540;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t)   { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

  // ?? Gradient helper ??????????????????????????????????????????????????????
  function skyGrad(ctx, w, h, colors) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // ?????????????????????????????????????????????????????????????????????????
  // SCENE 1 ??HIGHWAY (李⑥갹 諛?怨좎냽?꾨줈)
  // ?????????????????????????????????????????????????????????????????????????
  function initHighway(s) {
    s.lines = Array.from({ length: 14 }, (_, i) => ({
      y: rand(0, 1),   // normalised position on road (0=top horizon, 1=bottom)
      speed: rand(0.18, 0.35),
    }));
    s.cars = Array.from({ length: 5 }, () => ({
      laneX: rand(0.3, 0.5),
      y: rand(0, 1),
      speed: rand(0.06, 0.14),
      w: rand(0.04, 0.07),
      tailBrightness: rand(0.6, 1),
    }));
    s.t0 = null;
  }

  function drawHighway(canvas, s, now, t) {
    if (!s.t0) s.t0 = now;
    const elapsed = (now - s.t0) * 0.001;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Sky (dawn grey)
    skyGrad(ctx, W, H * 0.45, C.hwy.sky);

    // Road surface (perspective trapezoid)
    const VP = { x: W * 0.5, y: H * 0.40 }; // vanishing point
    ctx.fillStyle = '#1a1c1f';
    ctx.beginPath();
    ctx.moveTo(VP.x - W * 0.04, VP.y);
    ctx.lineTo(VP.x + W * 0.04, VP.y);
    ctx.lineTo(W * 0.85, H);
    ctx.lineTo(W * 0.15, H);
    ctx.closePath();
    ctx.fill();

    // Side shoulders
    const grad = ctx.createLinearGradient(0, VP.y, 0, H);
    grad.addColorStop(0, '#272a2e');
    grad.addColorStop(1, '#1c1e22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, VP.y, W, H - VP.y);

    // Road edges (perspective lines)
    ctx.strokeStyle = '#3a3d42';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(VP.x - W * 0.04, VP.y); ctx.lineTo(W * 0.16, H); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(VP.x + W * 0.04, VP.y); ctx.lineTo(W * 0.84, H); ctx.stroke();

    // Dashed centre lines (moving)
    const dashCount = 10;
    for (let i = 0; i < dashCount; i++) {
      // each dash's normalised y position, scrolling
      let ny = ((i / dashCount + elapsed * 0.4) % 1);
      const perspScale = Math.pow(ny, 1.8);
      const roadW = lerp(W * 0.04, W * 0.38, perspScale);
      const x = VP.x;
      const y = lerp(VP.y, H, perspScale);
      const dashH = lerp(2, 20, perspScale);
      if (ny < 0.05) continue; // hide near vanishing point
      ctx.fillStyle = `rgba(200, 196, 176, ${0.3 + 0.5 * perspScale})`;
      ctx.fillRect(x - 2, y, 4, dashH);
    }

    // Oncoming headlights (left lane)
    s.cars.forEach(car => {
      car.y = (car.y + car.speed * 0.005) % 1;
      const invY = 1 - car.y; // oncoming comes from top to bottom on left
      const perspScale = Math.pow(car.y, 2);
      const roadW = lerp(W * 0.035, W * 0.34, perspScale);
      const cx = VP.x - roadW * car.laneX * 0.6;
      const cy = lerp(VP.y + 5, H - 10, perspScale);
      const r  = lerp(1, 12, perspScale);
      // headlight glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
      grd.addColorStop(0, `rgba(220, 210, 180, ${0.7 * car.tailBrightness})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(cx - r * 4, cy - r * 4, r * 8, r * 8);
    });

    // Misty horizon
    const haze = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.50);
    haze.addColorStop(0, 'transparent');
    haze.addColorStop(1, 'rgba(50, 55, 65, 0.35)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, H * 0.35, W, H * 0.15);

    // Vignette
    vignette(ctx, W, H);
  }

  // ?????????????????????????????????????????????????????????????????????????
  // SCENE 2 ??TRAIN PASSING
  // ?????????????????????????????????????????????????????????????????????????
  function initTrain(s) {
    s.offset = 0;
    s.carCount = 8;
    s.windows = Array.from({ length: 40 }, () => ({
      lit: Math.random() > 0.4,
      flicker: rand(0.97, 1.0),
    }));
    s.t0 = null;
  }

  function drawTrain(canvas, s, now, t) {
    if (!s.t0) s.t0 = now;
    const elapsed = (now - s.t0) * 0.001;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Foggy sky
    skyGrad(ctx, W, H, C.trn.sky);

    // Fog layer
    const fog = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.65);
    fog.addColorStop(0, 'transparent');
    fog.addColorStop(0.5, 'rgba(120, 130, 145, 0.18)');
    fog.addColorStop(1, 'transparent');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, W, H);

    // Ground / platform
    ctx.fillStyle = '#1a1c20';
    ctx.fillRect(0, H * 0.62, W, H * 0.38);

    // Rails
    const railY1 = H * 0.63, railY2 = H * 0.66;
    ctx.fillStyle = '#2e3238'; ctx.fillRect(0, railY1, W, 3);
    ctx.fillStyle = '#252830'; ctx.fillRect(0, railY2, W, 3);

    // Sleepers (train ties)
    const sleeperSpacing = 40;
    const sleeperOffset  = (elapsed * 320) % sleeperSpacing;
    for (let x = -sleeperOffset; x < W + sleeperSpacing; x += sleeperSpacing) {
      ctx.fillStyle = '#1e2026';
      ctx.fillRect(x - 4, railY1 - 2, 8, railY2 - railY1 + 8);
    }

    // Train body (scrolls left)
    const trainSpeed = 280; // px / s
    const carW = Math.round(W * 0.28);
    const carH = Math.round(H * 0.30);
    const trainY = H * 0.33;

    const totalTrainW = s.carCount * carW;
    // Start far right, scroll left continuously
    const trainX = W * 0.9 - (elapsed * trainSpeed % (totalTrainW + W));

    for (let i = 0; i < s.carCount; i++) {
      const cx = trainX + i * carW;
      if (cx > W + 50 || cx + carW < -50) continue;

      // Car body
      ctx.fillStyle = '#2a2d34';
      roundRect(ctx, cx, trainY, carW - 3, carH, 4);
      ctx.fill();

      // Car top stripe
      ctx.fillStyle = '#323640';
      ctx.fillRect(cx, trainY, carW - 3, 6);

      // Windows
      const winCount = 5;
      const winW = carW * 0.12, winH = carH * 0.28;
      const winSpacing = (carW - 3 - winW * winCount) / (winCount + 1);
      for (let w = 0; w < winCount; w++) {
        const wIdx = (i * winCount + w) % s.windows.length;
        const win  = s.windows[wIdx];
        const wx = cx + winSpacing * (w + 1) + winW * w;
        const wy = trainY + carH * 0.18;
        if (win.lit) {
          const flicker = win.flicker > 0.99 ? 1 : (Math.random() > 0.995 ? rand(0.5, 1) : win.flicker);
          ctx.fillStyle = `rgba(210, 190, 140, ${0.5 * flicker})`;
        } else {
          ctx.fillStyle = 'rgba(20, 22, 28, 0.8)';
        }
        roundRect(ctx, wx, wy, winW, winH, 2);
        ctx.fill();
      }

      // Wheel axle dots
      ctx.fillStyle = '#181a1e';
      [0.2, 0.8].forEach(fx => {
        ctx.beginPath();
        ctx.arc(cx + carW * fx, trainY + carH + 2, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Motion blur overlay
    const blur = ctx.createLinearGradient(0, trainY - 10, 0, trainY + carH + 20);
    blur.addColorStop(0, 'transparent');
    blur.addColorStop(0.1, 'rgba(40,44,52,0.08)');
    blur.addColorStop(0.9, 'rgba(40,44,52,0.08)');
    blur.addColorStop(1, 'transparent');
    ctx.fillStyle = blur;
    ctx.fillRect(0, trainY - 10, W, carH + 30);

    vignette(ctx, W, H);
  }

  // ?????????????????????????????????????????????????????????????????????????
  // SCENE 3 ??HIKING (misty mountain)
  // ?????????????????????????????????????????????????????????????????????????
  function initHiking(s) {
    s.fogOffset = 0;
    s.figureX = 0.48;
    s.step = 0;
    s.t0 = null;
    // Pre-calculate pine positions/heights to avoid per-frame flicker
    s.pines1 = Array.from({ length: 12 }, (_, i) => ({ x: i / 12, h: rand(0.10, 0.18) }));
    s.pines2 = Array.from({ length: 7 },  (_, i) => ({ x: i / 7,  h: rand(0.10, 0.18) }));
  }

  function drawHiking(canvas, s, now, t) {
    if (!s.t0) s.t0 = now;
    const elapsed = (now - s.t0) * 0.001;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Sky gradient
    skyGrad(ctx, W, H, C.hike.sky);

    // Far mountains
    drawMountainLayer(ctx, W, H, '#2e343c', 0.55, 0.0, 6);
    drawMountainLayer(ctx, W, H, '#363e48', 0.65, 0.04, 5);
    drawMountainLayer(ctx, W, H, '#3e4850', 0.72, 0.08, 4);

    // Fog layers (drifting)
    for (let f = 0; f < 3; f++) {
      const fogY = H * (0.50 + f * 0.06);
      const fogOff = (elapsed * 15 * (f + 1) * 0.3) % W;
      const fGrad = ctx.createLinearGradient(0, fogY - 30, 0, fogY + 40);
      fGrad.addColorStop(0, 'transparent');
      fGrad.addColorStop(0.4, `rgba(115,130,148, ${0.12 - f * 0.02})`);
      fGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fGrad;
      // Two copies side by side for seamless scroll
      ctx.fillRect(-fogOff, fogY - 30, W, 70);
      ctx.fillRect(W - fogOff, fogY - 30, W, 70);
    }

    // Foreground pine silhouettes
    drawPines(ctx, W, H, '#1e2428', 0.80, s.pines1, 0);
    drawPines(ctx, W, H, '#171c20', 0.90, s.pines2, W * 0.1);

    // Walking figure
    s.figureX = 0.50 + Math.sin(elapsed * 0.15) * 0.02;
    const bobY = Math.abs(Math.sin(elapsed * 2.8)) * 3;
    const fx = W * s.figureX, fy = H * 0.79 - bobY;
    drawHiker(ctx, fx, fy, H * 0.065, elapsed);

    // Path
    const pathGrad = ctx.createLinearGradient(0, H * 0.78, 0, H);
    pathGrad.addColorStop(0, '#2a3030');
    pathGrad.addColorStop(1, '#1e2428');
    ctx.fillStyle = pathGrad;
    ctx.beginPath();
    ctx.moveTo(W * 0.35, H * 0.78);
    ctx.lineTo(W * 0.65, H * 0.78);
    ctx.lineTo(W * 0.80, H);
    ctx.lineTo(W * 0.20, H);
    ctx.closePath();
    ctx.fill();

    vignette(ctx, W, H);
  }

  function drawMountainLayer(ctx, W, H, color, baseY, offset, peaks) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    const segW = W / (peaks - 1);
    for (let i = 0; i < peaks; i++) {
      const x = i * segW;
      const y = H * (baseY - 0.12 + Math.sin(i * 2.3 + offset * 10) * 0.08);
      i === 0 ? ctx.lineTo(x, y) : ctx.quadraticCurveTo(x - segW / 2, H * (baseY + 0.02), x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawPines(ctx, W, H, color, baseY, pines, offsetX) {
    ctx.fillStyle = color;
    pines.forEach(p => {
      const x = offsetX + p.x * W * 1.2;
      const h = H * p.h;
      const y = H * baseY - h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - h * 0.28, H * baseY);
      ctx.lineTo(x + h * 0.28, H * baseY);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawHiker(ctx, x, y, h, t) {
    const legSwing = Math.sin(t * 3.5) * 0.25;
    ctx.strokeStyle = '#1a1e22';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, h * 0.12);

    // Body
    ctx.beginPath(); ctx.moveTo(x, y - h * 0.5); ctx.lineTo(x, y - h * 0.2); ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(x, y - h * 0.6, h * 0.12, 0, Math.PI * 2); ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.45);
    ctx.lineTo(x - h * 0.22, y - h * 0.28 + legSwing * h * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.45);
    ctx.lineTo(x + h * 0.22, y - h * 0.28 - legSwing * h * 0.1);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.2);
    ctx.lineTo(x - h * 0.18, y + legSwing * h * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.2);
    ctx.lineTo(x + h * 0.18, y - legSwing * h * 0.3);
    ctx.stroke();
    // Trekking pole
    ctx.beginPath();
    ctx.moveTo(x + h * 0.20, y - h * 0.30);
    ctx.lineTo(x + h * 0.28, y + h * 0.05);
    ctx.stroke();
  }

  // ?????????????????????????????????????????????????????????????????????????
  // SCENE 4 ??CAMPFIRE
  // ?????????????????????????????????????????????????????????????????????????
  function initCampfire(s) {
    s.particles = Array.from({ length: 60 }, () => newEmber());
    s.t0 = null;
  }

  function newEmber() {
    return {
      x: 0.5 + rand(-0.015, 0.015),
      y: rand(0.64, 0.70),
      vx: rand(-0.0004, 0.0004),
      vy: -rand(0.0006, 0.0018),
      life: rand(0.3, 1.0),
      decay: rand(0.006, 0.016),
      size: rand(1.5, 5),
      colorIdx: randInt(0, C.fire.ember.length - 1),
    };
  }

  function drawCampfire(canvas, s, now, t) {
    if (!s.t0) s.t0 = now;
    const elapsed = (now - s.t0) * 0.001;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Night sky
    ctx.fillStyle = C.fire.sky;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 80; i++) {
      // Use seeded positions with twinkle
      const sx = ((i * 127.3 + 41) % 1000) / 1000 * W;
      const sy = ((i * 233.7 + 17) % 1000) / 1000 * H * 0.60;
      const alpha = 0.3 + 0.5 * Math.abs(Math.sin(elapsed * 0.8 + i));
      ctx.fillStyle = `rgba(200, 210, 220, ${alpha})`;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // Ground
    ctx.fillStyle = '#100e0c';
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    // Log silhouettes
    const logY = H * 0.72;
    ctx.fillStyle = '#1a1410';
    // Left log
    ctx.save(); ctx.translate(W * 0.5, logY);
    ctx.rotate(-0.4);
    ctx.fillRect(-W * 0.12, -6, W * 0.22, 12);
    ctx.restore();
    // Right log
    ctx.save(); ctx.translate(W * 0.5, logY);
    ctx.rotate(0.35);
    ctx.fillRect(-W * 0.02, -6, W * 0.22, 12);
    ctx.restore();

    // Firelight glow on ground
    const gndGlow = ctx.createRadialGradient(W * 0.5, logY, 0, W * 0.5, logY, W * 0.25);
    gndGlow.addColorStop(0, `rgba(180, 80, 20, ${0.25 + Math.sin(elapsed * 4.5) * 0.06})`);
    gndGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = gndGlow;
    ctx.fillRect(0, logY - 30, W, H * 0.30);

    // Ambient warm circle behind fire
    const ambGlow = ctx.createRadialGradient(W * 0.5, logY, 0, W * 0.5, logY, W * 0.18);
    ambGlow.addColorStop(0, `rgba(200, 100, 30, ${0.3 + Math.sin(elapsed * 3.7) * 0.07})`);
    ambGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = ambGlow;
    ctx.fillRect(0, 0, W, H);

    // Flame core (layered ellipses)
    for (let layer = 0; layer < 5; layer++) {
      const flicker = Math.sin(elapsed * (4 + layer) + layer) * 0.04;
      const fw = W * (0.028 - layer * 0.003);
      const fh = H * (0.18 + layer * 0.02 + flicker);
      const alpha = (1 - layer * 0.18) * (0.7 + Math.sin(elapsed * 5 + layer * 1.2) * 0.15);
      const cIdx = Math.min(layer, C.fire.ember.length - 1);
      const grd = ctx.createRadialGradient(W * 0.5, logY - fh * 0.3, 0, W * 0.5, logY - fh * 0.3, fh);
      grd.addColorStop(0, C.fire.ember[C.fire.ember.length - 1 - cIdx]);
      grd.addColorStop(0.5, C.fire.ember[cIdx] + 'cc');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(W * 0.5 - fw, logY - fh, fw * 2, fh);
    }

    // Embers / particles
    s.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { s.particles[i] = newEmber(); s.particles[i].x = 0.5 + rand(-0.015, 0.015); return; }
      const alpha = Math.min(p.life, 0.9);
      const col   = C.fire.ember[p.colorIdx];
      ctx.fillStyle = col + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });

    vignette(ctx, W, H, 0.85);
  }

  // ?????????????????????????????????????????????????????????????????????????
  // SCENE 5 ??FISHING (still lake at dawn)
  // ?????????????????????????????????????????????????????????????????????????
  function initFishing(s) {
    s.ripples = [];
    s.nextRipple = 0;
    s.fishX = 0.6;
    s.t0 = null;
    // Pre-calculate reed heights to avoid per-frame flickering
    s.reeds = Array.from({ length: 18 }, () => rand(0.06, 0.12));
  }


  function drawFishing(canvas, s, now, t) {
    if (!s.t0) s.t0 = now;
    const elapsed = (now - s.t0) * 0.001;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Dawn sky
    skyGrad(ctx, W, H * 0.52, C.fish.sky);

    // Horizon mist
    const mist = ctx.createLinearGradient(0, H * 0.45, 0, H * 0.58);
    mist.addColorStop(0, 'transparent');
    mist.addColorStop(0.5, 'rgba(100, 115, 130, 0.2)');
    mist.addColorStop(1, 'transparent');
    ctx.fillStyle = mist;
    ctx.fillRect(0, H * 0.45, W, H * 0.13);

    // Water surface
    const waterGrad = ctx.createLinearGradient(0, H * 0.52, 0, H);
    waterGrad.addColorStop(0, '#252c36');
    waterGrad.addColorStop(1, '#1a2028');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, H * 0.52, W, H);

    // Water shimmer lines
    for (let i = 0; i < 12; i++) {
      const wy = H * 0.54 + (i / 12) * H * 0.40;
      const shimmer = Math.sin(elapsed * 1.2 + i * 0.7) * 0.04;
      ctx.strokeStyle = `rgba(180, 200, 220, ${0.06 + shimmer})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.05, wy);
      ctx.bezierCurveTo(W * 0.35, wy + 3, W * 0.65, wy - 3, W * 0.95, wy);
      ctx.stroke();
    }

    // Sky reflection on water (blurred)
    const ref = ctx.createLinearGradient(0, H * 0.52, 0, H * 0.70);
    ref.addColorStop(0, 'rgba(70, 90, 110, 0.12)');
    ref.addColorStop(1, 'transparent');
    ctx.fillStyle = ref;
    ctx.fillRect(0, H * 0.52, W, H * 0.18);

    // Far reeds / silhouette treeline
    for (let r = 0; r < 18; r++) {
      const rx = (r / 18) * W;
      const rh = H * s.reeds[r];
      const ry = H * 0.52 - rh;

      ctx.fillStyle = '#2a2e2c';
      ctx.fillRect(rx, ry, Math.max(2, W * 0.008), rh);
      // Reed head
      ctx.fillStyle = '#3a3830';
      ctx.beginPath();
      ctx.ellipse(rx + 2, ry, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fishing rod & line
    const rodBase = { x: W * 0.25, y: H * 0.62 };
    const rodTip  = { x: W * 0.62, y: H * 0.38 };
    ctx.strokeStyle = '#2a2c30';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(rodBase.x, rodBase.y);
    ctx.lineTo(rodTip.x,  rodTip.y);
    ctx.stroke();

    // Fishing line from tip to float
    const lineWave = Math.sin(elapsed * 0.8) * 0.005;
    const floatX = W * (0.58 + lineWave), floatY = H * 0.545;
    ctx.strokeStyle = 'rgba(200, 200, 180, 0.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(rodTip.x, rodTip.y);
    ctx.quadraticCurveTo(W * 0.65, H * 0.48, floatX, floatY);
    ctx.stroke();

    // Float bobber
    const bob = Math.sin(elapsed * 1.5) * 2;
    ctx.fillStyle = C.fish.float;
    ctx.beginPath();
    ctx.ellipse(floatX, floatY + bob, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dfc8';
    ctx.beginPath();
    ctx.ellipse(floatX, floatY + bob - 4, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Float ripples (periodic)
    if (now > s.nextRipple) {
      s.ripples.push({ x: floatX, y: floatY, r: 2, maxR: W * 0.07, born: now });
      s.nextRipple = now + rand(1800, 2800);
    }
    s.ripples = s.ripples.filter(rp => {
      const age = (now - rp.born) / 1000;
      rp.r = age * 50;
      const alpha = Math.max(0, 0.3 - age * 0.12);
      if (alpha <= 0) return false;
      ctx.strokeStyle = `rgba(180, 200, 210, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      return rp.r < rp.maxR;
    });

    // Sitting figure silhouette
    const figX = W * 0.22, figY = H * 0.64;
    ctx.fillStyle = '#151820';
    // Body
    ctx.beginPath();
    ctx.ellipse(figX, figY, W * 0.022, H * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(figX + W * 0.01, figY - H * 0.055, H * 0.025, 0, Math.PI * 2);
    ctx.fill();
    // Arm holding rod
    ctx.strokeStyle = '#151820';
    ctx.lineWidth = Math.max(3, H * 0.012);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(figX + W * 0.01, figY - H * 0.02);
    ctx.lineTo(rodBase.x, rodBase.y);
    ctx.stroke();

    vignette(ctx, W, H, 0.9);
  }

  // ?????????????????????????????????????????????????????????????????????????
  // Shared Utilities
  // ?????????????????????????????????????????????????????????????????????????
  function vignette(ctx, W, H, strength = 0.75) {
    const g = ctx.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ??? Boot ????????????????????????????????????????????????????????????????
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTravelSlideshow);
  } else {
    initTravelSlideshow();
  }

})();
