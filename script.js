// ── 최종 업데이트 시각 표시 ──────────────────────
(function showBuildTime() {
  const el = document.getElementById("build-time");
  if (!el) return;

  // 문서가 마지막으로 수정된 시각(브라우저 제공)
  const d = new Date(document.lastModified);
  const pad = (n) => String(n).padStart(2, "0");

  el.textContent =
    `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();

// ── 배경 파티클 네트워크 ─────────────────────────
(function backgroundNetwork() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const COUNT = 46; // 점 개수
  const LINK_DIST = 150; // 선을 잇는 최대 거리
  let dots = [];
  let width = 0;
  let height = 0;

  // 캔버스 크기를 실제 레이아웃 크기에 맞춤 (고해상도 대응)
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    if (!width || !height) return false; // 아직 화면에 그려지기 전

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  // 점 초기화
  function seed() {
    dots = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // 점 이동 + 벽 반사
    for (const d of dots) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > width) d.vx *= -1;
      if (d.y < 0 || d.y > height) d.vy *= -1;
    }

    // 가까운 점끼리 선 연결
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist > LINK_DIST) continue;

        ctx.strokeStyle = `rgba(79, 156, 255, ${
          (1 - dist / LINK_DIST) * 0.22
        })`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(dots[j].x, dots[j].y);
        ctx.stroke();
      }
    }

    // 점 그리기
    ctx.fillStyle = "rgba(79, 156, 255, 0.55)";
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // 캔버스 크기가 바뀔 때마다 다시 계산
  // (탭이 숨겨진 상태로 로드돼 크기가 0인 경우까지 처리)
  let lastW = 0;
  let lastH = 0;
  new ResizeObserver(() => {
    if (!resize()) return;
    if (width === lastW && height === lastH) return;
    lastW = width;
    lastH = height;
    seed();
  }).observe(canvas);

  resize();
  seed();
  draw();
})();
