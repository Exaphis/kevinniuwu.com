import {
  patternKinds,
  zigzag,
  hilbertPoints,
  mazeTrace,
  segmentTreeTrace,
  type Point,
  type PatternKind,
  type SegmentNode,
} from "./background-patterns";

// One randomly selected technical pattern per homepage visit.
const hero = document.querySelector<HTMLElement>(".hero");
if (hero) initializeBackground(hero);

function initializeBackground(hero: HTMLElement): void {
  const canvas = hero.querySelector<HTMLCanvasElement>("canvas");
  const control = hero.querySelector<HTMLButtonElement>(".animation-toggle");
  const heading = hero.querySelector("h1");
  if (!canvas || !control || !heading) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  startBackground(hero, canvas, control, heading, ctx);
}

function startBackground(
  hero: HTMLElement,
  canvas: HTMLCanvasElement,
  control: HTMLButtonElement,
  heading: HTMLHeadingElement,
  ctx: CanvasRenderingContext2D,
): void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    pattern: patternKinds[Math.floor(Math.random() * patternKinds.length)],
    running: !reduced.matches,
  };
  canvas.dataset.pattern = state.pattern;
  // Start partway through the trace so the initial frame is interesting even
  // with reduced motion. `dirty` allows one redraw while otherwise paused.
  let clock = 15000,
    lastTick = performance.now(),
    lastPaint = -Infinity,
    dirty = true,
    frame = 0,
    heroVisible = true;
  function updateControl() {
    const label = state.running
      ? "Pause background animation"
      : "Play background animation";
    control.setAttribute("aria-label", label);
    control.setAttribute("title", label);
    control.setAttribute("aria-pressed", String(!state.running));
  }
  function schedule() {
    if (!frame && heroVisible && !document.hidden) {
      lastTick = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function tick(now: DOMHighResTimeStamp): void {
    frame = 0;
    // Avoid a large time jump after a suspended tab or a slow frame.
    const dt = Math.min(100, now - lastTick);
    lastTick = now;
    if (!heroVisible || document.hidden) return;
    if (state.running) clock += dt;
    // Follow the browser's clock, but repaint this background at about 20 fps.
    if (dirty || (state.running && now - lastPaint > 50)) {
      draw();
      lastPaint = now;
    }
    if (state.running) frame = requestAnimationFrame(tick);
  }
  // Build algorithm traces once; drawing only samples them as time advances.
  const maze = mazeTrace();
  const segment = segmentTreeTrace();
  function stroke(points: Point[], alpha = 0.5, width = 1): void {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  function dot(x: number, y: number, r = 2, alpha = 1): void {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Draw in a local square, with p running from the start (0) to the end (1).
  function drawMotif(kind: PatternKind, p: number, size: number): void {
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
    if (kind === "hilbert" || kind === "zigzag") {
      const points = kind === "hilbert" ? hilbertPoints : zigzag,
        n = kind === "hilbert" ? 32 : 8,
        coords = points.map(([x, y]): Point => [
          ((x + 0.5) * size) / n,
          ((y + 0.5) * size) / n,
        ]);
      stroke(coords, 0.42, 1);
      // Interpolate both ends of the bright trail between cell centers. Moving
      // only the head would leave the tail snapping forward one cell at a time.
      const f = p * (coords.length - 1),
        i = Math.floor(f),
        a = coords[i],
        b = coords[Math.min(i + 1, coords.length - 1)],
        head: Point = [lerp(a[0], b[0], f - i), lerp(a[1], b[1], f - i)],
        tailPosition = Math.max(0, f - (kind === "hilbert" ? 44 : 6)),
        tailIndex = Math.floor(tailPosition),
        tailStart = coords[tailIndex],
        tailEnd = coords[Math.min(tailIndex + 1, coords.length - 1)],
        tail: Point = [
          lerp(tailStart[0], tailEnd[0], tailPosition - tailIndex),
          lerp(tailStart[1], tailEnd[1], tailPosition - tailIndex),
        ];
      stroke([tail, ...coords.slice(tailIndex + 1, i + 1), head], 1, 1.5);
      dot(...head, 2, 1);
    } else if (kind === "maze") {
      // Blend neighboring DFS snapshots: fade the wall being carved and slide
      // the cursor to the next cell. Decreasing p naturally reverses the carving.
      const position = p * (maze.steps.length - 1),
        index = Math.floor(position),
        snap = maze.steps[index],
        next = maze.steps[Math.min(index + 1, maze.steps.length - 1)],
        fraction = position - index,
        cell = size / maze.w,
        h = cell * maze.h,
        oy = (size - h) / 2,
        open = new Set(
          snap.edges.map(([a, b]) => Math.min(a, b) + "," + Math.max(a, b)),
        ),
        nextOpen = new Set(
          next.edges.map(([a, b]) => Math.min(a, b) + "," + Math.max(a, b)),
        ),
        changingWalls: [Point, Point][] = [];
      function wall(a: number, b: number, points: [Point, Point]): void {
        const key = a + "," + b,
          from = open.has(key) ? 0 : 1,
          to = nextOpen.has(key) ? 0 : 1;
        if (from !== to) changingWalls.push(points);
        else if (from) {
          ctx.moveTo(...points[0]);
          ctx.lineTo(...points[1]);
        }
      }
      ctx.lineWidth = 0.9;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.rect(0, oy, size, h);
      for (let y = 0; y < maze.h; y++)
        for (let x = 0; x < maze.w; x++) {
          const n = y * maze.w + x;
          if (x < maze.w - 1)
            wall(n, n + 1, [
              [(x + 1) * cell, oy + y * cell],
              [(x + 1) * cell, oy + (y + 1) * cell],
            ]);
          if (y < maze.h - 1)
            wall(n, n + maze.w, [
              [x * cell, oy + (y + 1) * cell],
              [(x + 1) * cell, oy + (y + 1) * cell],
            ]);
        }
      ctx.stroke();
      changingWalls.forEach((points) =>
        stroke(points, 0.65 * (1 - fraction), 0.9),
      );
      dot(
        (lerp(snap.current % maze.w, next.current % maze.w, fraction) + 0.5) *
          cell,
        oy +
          (lerp(
            Math.floor(snap.current / maze.w),
            Math.floor(next.current / maze.w),
            fraction,
          ) +
            0.5) *
            cell,
        2.3,
        1,
      );
    } else if (kind === "segment") {
      const queryIndex = Math.min(
          segment.queries.length - 1,
          Math.floor(p * segment.queries.length),
        ),
        q = segment.queries[queryIndex],
        local = Math.min(1, p * segment.queries.length - queryIndex),
        // Return to the neutral tree before switching query ranges.
        fade = Math.min(1, local / 0.08, (1 - local) / 0.08),
        visibility = fade * fade * (3 - 2 * fade),
        snap =
          q.steps[
            Math.min(q.steps.length - 1, Math.floor(local * q.steps.length))
          ];
      const height = size * 0.55,
        top = (size - height) / 2,
        level = height / 5;
      const point = (n: SegmentNode): Point => [
        (((n.lo + n.hi) / 2) * size) / segment.values.length,
        top + (n.depth + 0.5) * level,
      ];
      // Each node spans its stored interval; depth determines its vertical level.
      for (const n of segment.nodes) {
        const [x, y] = point(n);
        if (n.left >= 0) {
          stroke(
            [
              point(segment.nodes[n.left]),
              [x, y],
              point(segment.nodes[n.right]),
            ],
            0.45,
            0.95,
          );
        }
        const accepted = snap.selected.includes(n.id),
          active = snap.active === n.id;
        const inset = 2,
          x0 = (n.lo * size) / segment.values.length + inset,
          x1 = (n.hi * size) / segment.values.length - inset;
        stroke(
          [
            [x0, y],
            [x1, y],
          ],
          lerp(0.48, accepted ? 1 : active ? 0.95 : 0.48, visibility),
          lerp(1, accepted ? 2.2 : 1, visibility),
        );
        if (active) dot(x, y, 2.3, visibility);
      }
      const baseline = top + height + 7,
        x0 = (q.lo * size) / segment.values.length,
        x1 = (q.hi * size) / segment.values.length;
      stroke(
        [
          [x0, baseline - 3],
          [x0, baseline],
          [x1, baseline],
          [x1, baseline - 3],
        ],
        0.85 * visibility,
        1.1,
      );
    }
  }

  function draw() {
    // Keep CSS coordinates independent of display density, capped at 2× to
    // bound the canvas allocation and painting cost on high-density screens.
    const w = hero.clientWidth,
      h = hero.clientHeight,
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (!w || !h) return;
    const rw = Math.round(w * dpr),
      rh = Math.round(h * dpr);
    if (canvas.width !== rw || canvas.height !== rh) {
      canvas.width = rw;
      canvas.height = rh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ctx.strokeStyle = getComputedStyle(heading).color;
    const size = Math.min(w <= 600 ? 240 : 320, h - 30),
      x = w - size - 18,
      y = 10,
      // Retrace the same path, easing to a stop at each end instead of resetting.
      phase = (clock % 132000) / 132000,
      p = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    ctx.save();
    ctx.translate(x, y);
    drawMotif(state.pattern, p, size);
    ctx.restore();
    ctx.globalAlpha = 1;
    // Multiply the drawing's alpha by two gradient masks, fading it beneath
    // the introduction rather than painting a colored overlay over the text.
    ctx.globalCompositeOperation = "destination-in";
    const horizontal = ctx.createLinearGradient(x, 0, x + size, 0);
    for (const [t, alpha] of [
      [0, 0.3],
      [0.2, 0.5],
      [0.55, 0.8],
      [0.85, 1],
      [1, 0.8],
    ])
      horizontal.addColorStop(t, "rgba(0,0,0," + alpha + ")");
    ctx.fillStyle = horizontal;
    ctx.fillRect(0, 0, w, h);
    const vertical = ctx.createLinearGradient(0, y, 0, y + size);
    for (const [t, alpha] of [
      [0, 0.7],
      [0.15, 1],
      [0.75, 0.9],
      [1, 0.3],
    ])
      vertical.addColorStop(t, "rgba(0,0,0," + alpha + ")");
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    dirty = false;
  }

  control.hidden = false;
  control.addEventListener("click", () => {
    state.running = !state.running;
    updateControl();
    dirty = true;
    schedule();
  });
  reduced.addEventListener("change", () => {
    state.running = !reduced.matches;
    updateControl();
    dirty = true;
    schedule();
  });
  new ResizeObserver(() => {
    dirty = true;
    schedule();
  }).observe(hero);
  // Offscreen/hidden pages stop requesting frames. These events restart the
  // scheduler when visible again, including restoration from the back-forward cache.
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (heroVisible) schedule();
  }).observe(hero);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pageshow", schedule);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    frame = 0;
  });
  updateControl();
  schedule();
}
