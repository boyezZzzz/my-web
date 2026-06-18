/* ================================================
   BACKGROUND 3D PARTICLE CANVAS — bg.js
   Efek: partikel mengambang + garis penghubung,
   dengan parallax mouse, warna RGB cycling,
   dan depth (z-axis simulasi 3D)
   ================================================ */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ---- Config ---- */
  const CFG = {
    COUNT:        120,      // jumlah partikel
    MAX_DIST:     140,      // jarak max untuk draw garis
    SPEED:        0.35,     // kecepatan dasar
    MOUSE_RADIUS: 180,      // radius pengaruh mouse
    MOUSE_FORCE:  0.04,     // kekuatan tolakan mouse
    DEPTH:        4,        // jumlah lapisan kedalaman (z)
    PARALLAX:     0.025,    // intensitas parallax
    GLOW:         true,     // efek glow
  };

  let W, H, raf;
  let mouse = { x: -9999, y: -9999 };
  let hue = 0; // cycling hue untuk warna RGB

  /* ---- Particle class ---- */
  class Particle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : (Math.random() < 0.5 ? -10 : H + 10);
      this.z  = Math.random() * CFG.DEPTH + 0.5; // depth 0.5–4.5
      this.vx = (Math.random() - 0.5) * CFG.SPEED * (1 / this.z);
      this.vy = (Math.random() - 0.5) * CFG.SPEED * (1 / this.z);
      this.r  = (1.2 + Math.random() * 2.2) * (this.z / CFG.DEPTH);
      this.hueOffset = Math.random() * 360;
      this.alpha = 0.4 + (this.z / CFG.DEPTH) * 0.5;
    }

    update() {
      // Parallax mouse
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CFG.MOUSE_RADIUS) {
        const force = (CFG.MOUSE_RADIUS - dist) / CFG.MOUSE_RADIUS;
        this.vx += (dx / dist) * force * CFG.MOUSE_FORCE * (1 / this.z);
        this.vy += (dy / dist) * force * CFG.MOUSE_FORCE * (1 / this.z);
      }

      // Damping
      this.vx *= 0.98;
      this.vy *= 0.98;

      this.x += this.vx;
      this.y += this.vy;

      // Wrap edges
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    }

    draw() {
      const ph = (hue + this.hueOffset) % 360;
      const color = `hsla(${ph}, 80%, 65%, ${this.alpha})`;

      if (CFG.GLOW) {
        ctx.shadowBlur  = 8 * (this.z / CFG.DEPTH);
        ctx.shadowColor = `hsla(${ph}, 80%, 65%, 0.7)`;
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* ---- Init particles ---- */
  let particles = [];
  function initParticles() {
    particles = [];
    const count = Math.min(CFG.COUNT, Math.floor((W * H) / 8000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  /* ---- Draw connecting lines ---- */
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);

        if (d < CFG.MAX_DIST) {
          const alpha = (1 - d / CFG.MAX_DIST) * 0.18 * Math.min(a.z, b.z) / CFG.DEPTH;
          const ph = (hue + (a.hueOffset + b.hueOffset) / 2) % 360;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${ph}, 70%, 60%, ${alpha})`;
          ctx.lineWidth   = 0.6 * Math.min(a.z, b.z) / CFG.DEPTH;
          ctx.stroke();
        }
      }
    }
  }

  /* ---- Animated grid (3D perspective illusion) ---- */
  function drawGrid() {
    const vanishX = W / 2 + (mouse.x - W / 2) * CFG.PARALLAX * 3;
    const vanishY = H * 0.45 + (mouse.y - H / 2) * CFG.PARALLAX * 2;
    const cols = 12;
    const rows = 8;

    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = `hsl(${hue}, 60%, 55%)`;
    ctx.lineWidth = 0.8;

    // Horizontal lines
    for (let r = 0; r <= rows; r++) {
      const t = r / rows;
      const y = H * 0.55 + t * H * 0.55;
      const left  = vanishX + (0    - vanishX) * (1 - t * 0.6);
      const right = vanishX + (W    - vanishX) * (1 - t * 0.6);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // Vertical lines converging to vanishing point
    for (let c = 0; c <= cols; c++) {
      const x = (c / cols) * W;
      ctx.beginPath();
      ctx.moveTo(vanishX, vanishY);
      ctx.lineTo(x, H + 10);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /* ---- Main loop ---- */
  function loop() {
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    grd.addColorStop(0, `hsla(${(hue + 240) % 360}, 30%, 8%, 1)`);
    grd.addColorStop(1, `hsla(${hue % 360}, 20%, 4%, 1)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    drawGrid();
    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });

    hue = (hue + 0.25) % 360;
    raf = requestAnimationFrame(loop);
  }

  /* ---- Resize ---- */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initParticles();
  }

  /* ---- Mouse / touch ---- */
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('touchmove', e => {
    if (e.touches.length) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* ---- Start ---- */
  window.addEventListener('resize', resize);
  resize();
  loop();
})();
