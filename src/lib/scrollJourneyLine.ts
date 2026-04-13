// @ts-nocheck — DOM narrowing across nested closures is verbose; behaviour matches the original script.
/**
 * Journey line only over .how-it-works__steps: starts at the first step heading,
 * runs down the centre to the bottom of the last step, and fills with scroll
 * (with short holds at each heading). Matches the section grid centre.
 */
export function initScrollJourney(): (() => void) | undefined {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const root = document.getElementById("scroll-journey");
  if (!root) return undefined;
  const fill = root.querySelector<HTMLElement>(".scroll-journey__fill");
  const track = root.querySelector<HTMLElement>(".scroll-journey__track");
  const dotsWrap = root.querySelector<HTMLElement>(".scroll-journey__dots");
  const container = root.parentElement;
  if (!fill || !dotsWrap || !container || !container.classList.contains("how-it-works__steps")) {
    return undefined;
  }

  const steps = container.querySelectorAll(".how-step");
  if (!steps.length) return undefined;

  let raf = 0;
  let dots: { el: HTMLSpanElement }[] = [];
  let headingDocY: number[] = [];
  let journeyStartDoc = 0;
  let journeyEndDoc = 0;
  let journeyLen = 1;
  let waypointAlong: number[] = [];
  let pauseFrac = 0;
  let containerTopDoc = 0;
  let containerH = 1;

  function getScrollY() {
    return window.scrollY ?? document.documentElement.scrollTop ?? 0;
  }

  function measureWaypoints() {
    const sy = getScrollY();
    const cr = container.getBoundingClientRect();
    containerTopDoc = cr.top + sy;
    containerH = Math.max(1, cr.height);

    headingDocY = [];
    for (let i = 0; i < steps.length; i++) {
      const h = steps[i].querySelector(".how-step__heading");
      if (!h) continue;
      const hr = h.getBoundingClientRect();
      headingDocY.push(hr.top + sy + hr.height * 0.5);
    }
    if (!headingDocY.length) return;

    journeyStartDoc = headingDocY[0]!;
    const last = steps[steps.length - 1]!;
    const lr = last.getBoundingClientRect();
    journeyEndDoc = lr.bottom + sy;
    journeyLen = Math.max(1, journeyEndDoc - journeyStartDoc);

    waypointAlong = [0];
    for (let i = 1; i < headingDocY.length; i++) {
      waypointAlong.push((headingDocY[i]! - journeyStartDoc) / journeyLen);
    }
    waypointAlong.push(1);

    pauseFrac = motionQuery.matches ? 0 : Math.min(0.08, 0.035 + 28 / journeyLen);
  }

  function mapTToLineAlong(t: number) {
    const w = waypointAlong;
    if (w.length < 2) return Math.max(0, Math.min(1, t));

    const nSeg = w.length - 1;
    const docLens: number[] = [];
    let sumDoc = 0;
    for (let i = 0; i < nSeg; i++) {
      const len = Math.max(0.0001, w[i + 1]! - w[i]!);
      docLens.push(len);
      sumDoc += len;
    }

    const numPauses = Math.max(0, nSeg - 1);
    const totalPause = numPauses * pauseFrac;
    const span = 1 - totalPause;
    if (span <= 0.01) {
      return w[0]! + Math.max(0, Math.min(1, t)) * (w[w.length - 1]! - w[0]!);
    }

    let tClamped = Math.max(0, Math.min(1, t));
    let s = tClamped;

    for (let i = 0; i < nSeg; i++) {
      const segScroll = (docLens[i]! / sumDoc) * span;
      if (s < segScroll) {
        const u = segScroll > 0 ? s / segScroll : 1;
        return w[i]! + u * (w[i + 1]! - w[i]!);
      }
      s -= segScroll;
      if (i < nSeg - 1) {
        if (s < pauseFrac) return w[i + 1]!;
        s -= pauseFrac;
      }
    }
    return w[w.length - 1]!;
  }

  function journeyScrollT() {
    const sy = getScrollY();
    const vh = window.innerHeight;
    const anchor = sy + vh * 0.38;
    const t = (anchor - journeyStartDoc) / journeyLen;
    return Math.max(0, Math.min(1, t));
  }

  function syncDots(lineEndDoc: number) {
    for (let i = 0; i < dots.length; i++) {
      const y = headingDocY[i];
      if (y === undefined) continue;
      const pct = ((y - containerTopDoc) / containerH) * 100;
      dots[i]!.el.style.top = pct + "%";
      dots[i]!.el.classList.toggle("scroll-journey__dot--reached", lineEndDoc >= y - 1.5);
    }
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    dots = [];
    for (let i = 0; i < steps.length; i++) {
      const dot = document.createElement("span");
      dot.className = "scroll-journey__dot";
      dot.setAttribute("aria-hidden", "true");
      dotsWrap.appendChild(dot);
      dots.push({ el: dot });
    }
  }

  function tick() {
    raf = 0;
    if (!headingDocY.length) return;

    const rawT = journeyScrollT();
    const lineAlong = mapTToLineAlong(rawT);
    const lineEndDoc = journeyStartDoc + lineAlong * journeyLen;

    const topPct = ((journeyStartDoc - containerTopDoc) / containerH) * 100;
    const heightPct = ((lineEndDoc - journeyStartDoc) / containerH) * 100;

    fill.style.top = topPct + "%";
    fill.style.height = Math.max(0, Math.min(100 - topPct, heightPct)) + "%";
    fill.style.opacity = lineAlong > 0.02 ? "1" : "0.5";

    if (track) {
      track.style.top = topPct + "%";
      track.style.height = Math.max(0, ((journeyEndDoc - journeyStartDoc) / containerH) * 100) + "%";
    }

    syncDots(lineEndDoc);
  }

  function requestTick() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      tick();
    });
  }

  function onLayoutChange() {
    measureWaypoints();
    tick();
  }

  buildDots();
  measureWaypoints();
  root.classList.add("scroll-journey--ready");

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", onLayoutChange);
  motionQuery.addEventListener("change", onLayoutChange);

  let ro: ResizeObserver | null = null;
  if ("ResizeObserver" in window) {
    ro = new ResizeObserver(onLayoutChange);
    ro.observe(container);
    for (let j = 0; j < steps.length; j++) {
      ro.observe(steps[j]!);
    }
  }

  tick();
  requestAnimationFrame(() => {
    onLayoutChange();
  });

  return () => {
    window.removeEventListener("scroll", requestTick);
    window.removeEventListener("resize", onLayoutChange);
    motionQuery.removeEventListener("change", onLayoutChange);
    ro?.disconnect();
    if (raf) cancelAnimationFrame(raf);
  };
}
