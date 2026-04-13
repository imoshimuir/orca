// @ts-nocheck — ported canvas animation; parity with original script.
export function initHeroGrid(): (() => void) | undefined {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let canvas = document.querySelector<HTMLCanvasElement>(".hero__grid-canvas");
    let hero = document.querySelector<HTMLElement>(".hero");
    if (!canvas || !hero) return undefined;

    let contentOffsetY = 0;
    try {
      let raw = getComputedStyle(hero).getPropertyValue("--hero-content-offset").trim();
      contentOffsetY = parseFloat(raw) || 0;
    } catch (e) {}

    let ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let CELL = 48;
    /** Pipe body colour; gradient stops are derived from this hue. */
    let PIPE_BASE = "#14b897";
    let raf = 0;
    let pathPointsMain = [];
    let pathPointsBranch1 = [];
    let pathPointsBranch2 = [];
    /** One-time draw-in length (seconds); then the line stays */
    let revealSec = 10;
    let animStartMs = null;
    let revealDone = false;
    let lastHeroW = 0;
    let lastHeroH = 0;

    /**
     * Main: L4 → D6 → L9 → D4 → L10 → L12 → L30 → rest left.
     * Forks: (1) after D6 — second bend (down→left), stays on-screen; (2) after L10 from P.
     */
    /**
     * Vertical along grid lines, then a final segment to y = h when the fork sits on/near the
     * last row (otherwise nextY >= h immediately and there was no visible drop — branches looked
     * identical to the main line).
     */
    function appendGridDownToBottom(arr, forkI, forkJ, h) {
      let x = forkI * CELL;
      let jb = forkJ;
      while (true) {
        let nextY = (jb + 1) * CELL;
        if (nextY >= h) break;
        jb++;
        arr.push({ x: x, y: nextY });
      }
      let last = arr[arr.length - 1];
      if (last.y < h - 1e-6) {
        arr.push({ x: x, y: h });
      }
    }

    function branchFromMainAtIndex(main, forkIndex, h) {
      if (forkIndex < 0 || forkIndex >= main.length) return main.slice();
      let pt = main[forkIndex];
      let forkI = Math.round(pt.x / CELL);
      let forkJ = Math.round(pt.y / CELL);
      let out = main.slice(0, forkIndex + 1);
      appendGridDownToBottom(out, forkI, forkJ, h);
      return out;
    }

    function buildGridPath(w, h) {
      let cols = Math.ceil(w / CELL);
      let R = Math.ceil(h / CELL);
      /** Largest row index j with j * CELL < h (grid points inside the canvas height). */
      let maxJ = Math.max(0, Math.floor((h - 1) / CELL));
      let jLo = Math.ceil((h * 0.5) / CELL);
      let jHi = Math.min(R, maxJ);
      if (jLo > jHi) jLo = jHi;

      let i = cols + 1;
      let jMid = Math.floor((jLo + jHi) / 2);
      let j = Math.min(jHi, Math.max(jLo, jMid + 1));
      j = Math.max(0, j - 10);

      let main = [{ x: i * CELL, y: j * CELL }];
      let k;
      /** forkIdx2 = earlier on path (after D6); forkIdx1 = later (after L10 from P). */
      let forkIdx1 = -1;
      let forkIdx2 = -1;

      function pushPoint() {
        main.push({ x: i * CELL, y: j * CELL });
      }

      for (k = 0; k < 4; k++) {
        i--;
        pushPoint();
        if (i <= 0) {
          return { main: main, branch1: main, branch2: main };
        }
      }

      for (k = 0; k < 8; k++) {
        j = Math.min(jHi, j + 1);
        pushPoint();
      }
      forkIdx2 = main.length - 1;

      for (k = 0; k < 9; k++) {
        i--;
        pushPoint();
        if (i <= 0) {
          return {
            main: main,
            branch1: branchFromMainAtIndex(main, forkIdx2, h),
            branch2: branchFromMainAtIndex(main, forkIdx2, h),
          };
        }
      }

      for (k = 0; k < 2; k++) {
        j = Math.min(jHi, j + 1);
        pushPoint();
      }

      for (k = 0; k < 10; k++) {
        i--;
        pushPoint();
        if (i <= 0) {
          let stub = main.slice();
          return {
            main: stub,
            branch1: branchFromMainAtIndex(stub, forkIdx2, h),
            branch2: branchFromMainAtIndex(stub, forkIdx2, h),
          };
        }
      }
      forkIdx1 = main.length - 1;

      for (k = 0; k < 12; k++) {
        i--;
        pushPoint();
        if (i <= 0) {
          return {
            main: main,
            branch1: branchFromMainAtIndex(main, forkIdx1, h),
            branch2: branchFromMainAtIndex(main, forkIdx2, h),
          };
        }
      }

      for (k = 0; k < 30; k++) {
        i--;
        pushPoint();
        if (i <= 0) {
          return {
            main: main,
            branch1: branchFromMainAtIndex(main, forkIdx1, h),
            branch2: branchFromMainAtIndex(main, forkIdx2, h),
          };
        }
      }

      while (i > 0) {
        i--;
        pushPoint();
      }

      return {
        main: main,
        branch1: branchFromMainAtIndex(main, forkIdx1, h),
        branch2: branchFromMainAtIndex(main, forkIdx2, h),
      };
    }

    function slicePathByLength(points, t) {
      if (points.length < 2) return points.slice();
      t = Math.max(0, Math.min(1, t));
      if (t <= 0) return [points[0]];
      if (t >= 1) return points.slice();

      let segLens = [];
      let total = 0;
      let s;
      for (s = 1; s < points.length; s++) {
        let dx = points[s].x - points[s - 1].x;
        let dy = points[s].y - points[s - 1].y;
        let L = Math.sqrt(dx * dx + dy * dy);
        segLens.push(L);
        total += L;
      }
      if (total < 1e-6) return [points[0]];

      let target = total * t;
      let acc = 0;
      let out = [{ x: points[0].x, y: points[0].y }];
      for (s = 0; s < segLens.length; s++) {
        if (acc + segLens[s] >= target - 1e-6) {
          let u = segLens[s] > 0 ? (target - acc) / segLens[s] : 1;
          u = Math.max(0, Math.min(1, u));
          out.push({
            x: points[s].x + (points[s + 1].x - points[s].x) * u,
            y: points[s].y + (points[s + 1].y - points[s].y) * u,
          });
          break;
        }
        acc += segLens[s];
        out.push({ x: points[s + 1].x, y: points[s + 1].y });
      }
      return out;
    }

    function smoothstep(t) {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    }

    function layout() {
      let w = Math.max(1, hero.clientWidth);
      let h = Math.max(1, hero.clientHeight);
      let paths = buildGridPath(w, h);
      pathPointsMain = paths.main;
      pathPointsBranch1 = paths.branch1;
      pathPointsBranch2 = paths.branch2;
    }

    function drawGrid(w, h) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.65)";
      ctx.lineWidth = 1;
      let x;
      let y;
      for (x = 0; x <= w; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (y = 0; y <= h; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    /**
     * Fade grid near the headline: multiply grid alpha by a radial mask (destination-in).
     * Uses one gradient in plain x/y coords + fillRect(0,0,w,h) so every pixel gets a mask
     * (avoids transform bugs that cleared the whole layer). Far corners must hit alpha 1.
     */
    function fadeGridNearCopy(w, h) {
      /* Center further up-left so more of the corner stays softly de‑gridded */
      let cx = w * 0.24;
      let cy = h * 0.14 + contentOffsetY;
      /* Outer ring must end exactly at the farthest corner so alpha → 1 there (full grid). */
      let rMax = 0;
      let corners = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ];
      let ci;
      for (ci = 0; ci < 4; ci++) {
        let d = Math.hypot(corners[ci][0] - cx, corners[ci][1] - cy);
        if (d > rMax) rMax = d;
      }

      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
      g.addColorStop(0, "rgba(255, 255, 255, 0)");
      g.addColorStop(0.22, "rgba(255, 255, 255, 0.07)");
      g.addColorStop(0.42, "rgba(255, 255, 255, 0.3)");
      g.addColorStop(0.6, "rgba(255, 255, 255, 0.58)");
      g.addColorStop(0.76, "rgba(255, 255, 255, 0.82)");
      g.addColorStop(0.9, "rgba(255, 255, 255, 0.96)");
      g.addColorStop(1, "rgba(255, 255, 255, 1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    /**
     * Extra soft wash toward the top-left of the title (first line), on top of the faded grid.
     * Drawn before the blue path so the line stays crisp.
     */
    function softenH1TopLeft(w, h) {
      ctx.save();
      let cx = w * 0.11;
      let cy = h * 0.045 + contentOffsetY;
      let r = Math.min(w, h) * 0.46;
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(248, 250, 252, 0.62)");
      g.addColorStop(0.35, "rgba(240, 244, 252, 0.34)");
      g.addColorStop(0.62, "rgba(234, 242, 250, 0.14)");
      g.addColorStop(1, "rgba(228, 240, 249, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    /**
     * Cylindrical “pipe” shading: gradient across the stroke, only variations of PIPE_BASE
     * (shadow / body / lighter brand / rim).
     */
    function createPipeGradient(ctx, x0, y0, x1, y1, span) {
      let dx = x1 - x0;
      let dy = y1 - y0;
      let len = Math.hypot(dx, dy);
      if (len < 1e-6) return null;
      let nx = -dy / len;
      let ny = dx / len;
      let mx = (x0 + x1) * 0.5;
      let my = (y0 + y1) * 0.5;
      let g = ctx.createLinearGradient(
        mx - nx * span,
        my - ny * span,
        mx + nx * span,
        my + ny * span
      );
      g.addColorStop(0, "#0a4d42");
      g.addColorStop(0.28, PIPE_BASE);
      g.addColorStop(0.52, "#5eead4");
      g.addColorStop(0.74, "#119a82");
      g.addColorStop(1, "#0f7668");
      return g;
    }

    function drawOnePolyline(points, t) {
      if (points.length < 2) return;
      let visible = motionQuery.matches ? points : slicePathByLength(points, t);
      if (visible.length < 2) return;

      let lineW = 7;
      let gradSpan = lineW * 2.8;
      ctx.lineWidth = lineW;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      let i;
      for (i = 1; i < visible.length; i++) {
        let x0 = visible[i - 1].x;
        let y0 = visible[i - 1].y;
        let x1 = visible[i].x;
        let y1 = visible[i].y;
        let g = createPipeGradient(ctx, x0, y0, x1, y1, gradSpan);
        if (!g) continue;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = g;
        ctx.stroke();
      }
    }

    function drawLine(t) {
      drawOnePolyline(pathPointsMain, t);
      drawOnePolyline(pathPointsBranch2, t);
      drawOnePolyline(pathPointsBranch1, t);
    }

    function tick(tMs) {
      let w = Math.max(1, hero.clientWidth);
      let h = Math.max(1, hero.clientHeight);
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);
      drawGrid(w, h);
      fadeGridNearCopy(w, h);
      softenH1TopLeft(w, h);

      let progress;
      if (motionQuery.matches || revealDone) {
        progress = 1;
      } else {
        if (animStartMs === null) animStartMs = tMs;
        progress = Math.min(1, smoothstep((tMs - animStartMs) / 1000 / revealSec));
        if (progress >= 1) revealDone = true;
      }
      drawLine(progress);

      if (!motionQuery.matches && !revealDone) {
        raf = requestAnimationFrame(tick);
      }
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function start() {
      stop();
      animStartMs = null;
      revealDone = false;
      if (motionQuery.matches) {
        revealDone = true;
        tick(typeof performance !== "undefined" ? performance.now() : 0);
      } else {
        raf = requestAnimationFrame(tick);
      }
    }

    layout();
    lastHeroW = Math.max(1, hero.clientWidth);
    lastHeroH = Math.max(1, hero.clientHeight);
    start();

    let ro = new ResizeObserver(function () {
      let rw = Math.max(1, hero.clientWidth);
      let rh = Math.max(1, hero.clientHeight);
      if (rw === lastHeroW && rh === lastHeroH) return;
      lastHeroW = rw;
      lastHeroH = rh;
      layout();
      animStartMs = null;
      stop();
      if (revealDone) {
        tick(typeof performance !== "undefined" ? performance.now() : 0);
      } else {
        raf = requestAnimationFrame(tick);
      }
    });
    ro.observe(hero);


  const onMotionChange = () => {
      layout();
      animStartMs = null;
      stop();
      if (motionQuery.matches) {
        revealDone = true;
        tick(typeof performance !== "undefined" ? performance.now() : 0);
      } else {
        revealDone = false;
        raf = requestAnimationFrame(tick);
      }
    };
  motionQuery.addEventListener("change", onMotionChange);

  return () => {
    stop();
    ro.disconnect();
    motionQuery.removeEventListener("change", onMotionChange);
  };
}
