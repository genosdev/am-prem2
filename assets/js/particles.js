export function initParticles() {
  const c = document.createElement("canvas");
  Object.assign(c.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    zIndex: "-1",
    pointerEvents: "none",
    opacity: ".35"
  });
  document.body.appendChild(c);
  const ctx = c.getContext("2d");

  let w, h, parts = [];

  function resize() {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
    const count = Math.min(60, Math.floor((w * h) / 28000));
    parts = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + .4,
        vx: (Math.random() - .5) * .28,
        vy: (Math.random() - .5) * .28,
        c: Math.random() > .5 ? "#2196F3" : "#7C4DFF"
      });
    }
  }
  resize();
  window.addEventListener("resize", resize);

  (function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = p.c;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.c;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x;
        const dy = parts[i].y - parts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.strokeStyle = `rgba(33,150,243,${(1 - d / 120) * .12})`;
          ctx.lineWidth = .7;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.moveTo(parts[i].x, parts[i].y);
          ctx.lineTo(parts[j].x, parts[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  })();
}