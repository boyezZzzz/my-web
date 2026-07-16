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

  /* ---- 3D wireframe shape class ---- */
  class Floating3DShape {
    constructor(type, size) {
      this.type = type;
      this.size = size;
      this.reset(true);
    }

    reset(init = false) {
      this.cx = Math.random() * W;
      this.cy = init ? Math.random() * H : (Math.random() < 0.5 ? -this.size * 2 : H + this.size * 2);
      this.cz = Math.random() * 200 - 100;
      this.rx = Math.random() * Math.PI * 2;
      this.ry = Math.random() * Math.PI * 2;
      this.rz = Math.random() * Math.PI * 2;
      
      this.srx = (Math.random() - 0.5) * 0.007;
      this.sry = (Math.random() - 0.5) * 0.007;
      this.srz = (Math.random() - 0.5) * 0.007;
      
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;

      this.hueOffset = Math.random() * 360;

      const s = this.size / 2;
      if (this.type === 'cube') {
        this.vertices = [
          {x: -s, y: -s, z: -s}, {x: s, y: -s, z: -s}, {x: s, y: s, z: -s}, {x: -s, y: s, z: -s},
          {x: -s, y: -s, z: s},  {x: s, y: -s, z: s},  {x: s, y: s, z: s},  {x: -s, y: s, z: s}
        ];
        this.edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];
      } else if (this.type === 'pyramid') {
        this.vertices = [
          {x: 0, y: -s * 1.2, z: 0},
          {x: -s, y: s, z: -s}, {x: s, y: s, z: -s},
          {x: s, y: s, z: s}, {x: -s, y: s, z: s}
        ];
        this.edges = [
          [1, 2], [2, 3], [3, 4], [4, 1],
          [0, 1], [0, 2], [0, 3], [0, 4]
        ];
      } else { // octahedron
        this.vertices = [
          {x: 0, y: -s * 1.3, z: 0},
          {x: 0, y: s * 1.3, z: 0},
          {x: -s, y: 0, z: -s}, {x: s, y: 0, z: -s},
          {x: s, y: 0, z: s}, {x: -s, y: 0, z: s}
        ];
        this.edges = [
          [2, 3], [3, 4], [4, 5], [5, 2],
          [0, 2], [0, 3], [0, 4], [0, 5],
          [1, 2], [1, 3], [1, 4], [1, 5]
        ];
      }
    }

    update() {
      this.rx += this.srx;
      this.ry += this.sry;
      this.rz += this.srz;
      
      this.cx += this.vx;
      this.cy += this.vy;

      if (this.cx < -this.size * 2) this.cx = W + this.size * 2;
      if (this.cx > W + this.size * 2) this.cx = -this.size * 2;
      if (this.cy < -this.size * 2) this.cy = H + this.size * 2;
      if (this.cy > H + this.size * 2) this.cy = -this.size * 2;
    }

    draw() {
      const projected = [];
      const fov = 350;
      
      for (let i = 0; i < this.vertices.length; i++) {
        const v = this.vertices[i];
        
        // Rotate X
        let y1 = v.y * Math.cos(this.rx) - v.z * Math.sin(this.rx);
        let z1 = v.y * Math.sin(this.rx) + v.z * Math.cos(this.rx);
        
        // Rotate Y
        let x2 = v.x * Math.cos(this.ry) - z1 * Math.sin(this.ry);
        let z2 = v.x * Math.sin(this.ry) + z1 * Math.cos(this.ry);
        
        // Rotate Z
        let x3 = x2 * Math.cos(this.rz) - y1 * Math.sin(this.rz);
        let y3 = x2 * Math.sin(this.rz) + y1 * Math.cos(this.rz);
        
        // Scale/Project
        const scale = fov / (fov + z2 + this.cz + 200);
        const px = this.cx + x3 * scale;
        const py = this.cy + y3 * scale;
        
        projected.push({x: px, y: py});
      }

      const ph = (hue + this.hueOffset) % 360;
      ctx.strokeStyle = `hsla(${ph}, 75%, 65%, 0.12)`;
      ctx.lineWidth = 0.95;

      for (let i = 0; i < this.edges.length; i++) {
        const e = this.edges[i];
        const p1 = projected[e[0]];
        const p2 = projected[e[1]];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  /* ---- Init particles ---- */
  let particles = [];
  let shapes3d = [];

  function initParticles() {
    particles = [];
    const count = Math.min(CFG.COUNT, Math.floor((W * H) / 8000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function init3DShapes() {
    shapes3d = [];
    const shapeTypes = ['cube', 'pyramid', 'octahedron'];
    const isMobile = W < 600;
    const count = isMobile ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const type = shapeTypes[i % shapeTypes.length];
      const size = isMobile ? (35 + Math.random() * 20) : (60 + Math.random() * 45);
      shapes3d.push(new Floating3DShape(type, size));
    }
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
    let mx = mouse.x;
    let my = mouse.y;
    if (mx === -9999) {
      const t = Date.now() * 0.0006;
      mx = W / 2 + Math.cos(t) * (W < 600 ? 50 : 120);
      my = H / 2 + Math.sin(t * 1.4) * (W < 600 ? 30 : 70);
    }
    const vanishX = W / 2 + (mx - W / 2) * CFG.PARALLAX * 3;
    const vanishY = H * 0.45 + (my - H / 2) * CFG.PARALLAX * 2;
    const cols = W < 600 ? 8 : 12;
    const rows = W < 600 ? 6 : 8;

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
    shapes3d.forEach(s => { s.update(); s.draw(); });

    hue = (hue + 0.25) % 360;
    if (isLoopActive) {
      raf = requestAnimationFrame(loop);
    }
  }

  let isLoopActive = false;

  function startLoop() {
    if (!isLoopActive) {
      isLoopActive = true;
      loop();
    }
  }

  function stopLoop() {
    if (isLoopActive) {
      isLoopActive = false;
      cancelAnimationFrame(raf);
    }
  }

  /* ---- Resize ---- */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    if (W < 992) {
      canvas.style.display = 'none';
      stopLoop();
      return;
    }

    canvas.style.display = 'block';
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    initParticles();
    init3DShapes();
    startLoop();
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
})();
