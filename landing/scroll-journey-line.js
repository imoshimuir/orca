/**
 * Journey line only over .how-it-works__steps: starts at the first step heading,
 * runs down the centre to the bottom of the last step, and fills with scroll
 * (with short holds at each heading). Matches the section grid centre.
 */
(function () {
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initScrollJourney() {
    var root = document.getElementById("scroll-journey");
    var fill = root && root.querySelector(".scroll-journey__fill");
    var track = root && root.querySelector(".scroll-journey__track");
    var dotsWrap = root && root.querySelector(".scroll-journey__dots");
    var container = root && root.parentElement;
    if (!root || !fill || !dotsWrap || !container || !container.classList.contains("how-it-works__steps")) {
      return;
    }

    var steps = container.querySelectorAll(".how-step");
    if (!steps.length) return;

    var raf = 0;
    var dots = [];
    /** Document Y (viewport + scroll) of each heading centre */
    var headingDocY = [];
    var journeyStartDoc = 0;
    var journeyEndDoc = 0;
    var journeyLen = 1;
    /** Normalized [0…1] along the journey path for segment + pause mapping */
    var waypointAlong = [];
    var pauseFrac = 0;
    var containerTopDoc = 0;
    var containerH = 1;

    function getScrollY() {
      return window.scrollY ?? document.documentElement.scrollTop ?? 0;
    }

    function measureWaypoints() {
      var sy = getScrollY();
      var cr = container.getBoundingClientRect();
      containerTopDoc = cr.top + sy;
      containerH = Math.max(1, cr.height);

      headingDocY = [];
      var i;
      for (i = 0; i < steps.length; i++) {
        var h = steps[i].querySelector(".how-step__heading");
        if (!h) continue;
        var hr = h.getBoundingClientRect();
        headingDocY.push(hr.top + sy + hr.height * 0.5);
      }
      if (!headingDocY.length) return;

      journeyStartDoc = headingDocY[0];
      var last = steps[steps.length - 1];
      var lr = last.getBoundingClientRect();
      journeyEndDoc = lr.bottom + sy;
      journeyLen = Math.max(1, journeyEndDoc - journeyStartDoc);

      waypointAlong = [0];
      for (i = 1; i < headingDocY.length; i++) {
        waypointAlong.push((headingDocY[i] - journeyStartDoc) / journeyLen);
      }
      waypointAlong.push(1);

      pauseFrac = motionQuery.matches
        ? 0
        : Math.min(0.08, 0.035 + 28 / journeyLen);
    }

    function mapTToLineAlong(t) {
      var w = waypointAlong;
      if (w.length < 2) return Math.max(0, Math.min(1, t));

      var nSeg = w.length - 1;
      var docLens = [];
      var sumDoc = 0;
      var i;
      for (i = 0; i < nSeg; i++) {
        var len = Math.max(0.0001, w[i + 1] - w[i]);
        docLens.push(len);
        sumDoc += len;
      }

      var numPauses = Math.max(0, nSeg - 1);
      var totalPause = numPauses * pauseFrac;
      var span = 1 - totalPause;
      if (span <= 0.01) {
        return w[0] + Math.max(0, Math.min(1, t)) * (w[w.length - 1] - w[0]);
      }

      t = Math.max(0, Math.min(1, t));
      var s = t;

      for (i = 0; i < nSeg; i++) {
        var segScroll = (docLens[i] / sumDoc) * span;
        if (s < segScroll) {
          var u = segScroll > 0 ? s / segScroll : 1;
          return w[i] + u * (w[i + 1] - w[i]);
        }
        s -= segScroll;
        if (i < nSeg - 1) {
          if (s < pauseFrac) return w[i + 1];
          s -= pauseFrac;
        }
      }
      return w[w.length - 1];
    }

    /** 0 = reading line at journey start, 1 = at journey end (document space). */
    function journeyScrollT() {
      var sy = getScrollY();
      var vh = window.innerHeight;
      var anchor = sy + vh * 0.38;
      var t = (anchor - journeyStartDoc) / journeyLen;
      return Math.max(0, Math.min(1, t));
    }

    function syncDots(lineEndDoc) {
      var i;
      for (i = 0; i < dots.length; i++) {
        var y = headingDocY[i];
        if (y === undefined) continue;
        var pct = ((y - containerTopDoc) / containerH) * 100;
        dots[i].el.style.top = pct + "%";
        dots[i].el.classList.toggle("scroll-journey__dot--reached", lineEndDoc >= y - 1.5);
      }
    }

    function buildDots() {
      dotsWrap.innerHTML = "";
      dots = [];
      var i;
      for (i = 0; i < steps.length; i++) {
        var dot = document.createElement("span");
        dot.className = "scroll-journey__dot";
        dot.setAttribute("aria-hidden", "true");
        dotsWrap.appendChild(dot);
        dots.push({ el: dot });
      }
    }

    function tick() {
      raf = 0;
      if (!headingDocY.length) return;

      var rawT = journeyScrollT();
      var lineAlong = mapTToLineAlong(rawT);
      var lineEndDoc = journeyStartDoc + lineAlong * journeyLen;

      var topPct = ((journeyStartDoc - containerTopDoc) / containerH) * 100;
      var heightPct = ((lineEndDoc - journeyStartDoc) / containerH) * 100;

      fill.style.top = topPct + "%";
      fill.style.height = Math.max(0, Math.min(100 - topPct, heightPct)) + "%";
      fill.style.opacity = lineAlong > 0.02 ? "1" : "0.5";

      if (track) {
        track.style.top = topPct + "%";
        track.style.height =
          Math.max(0, ((journeyEndDoc - journeyStartDoc) / containerH) * 100) + "%";
      }

      syncDots(lineEndDoc);
    }

    function requestTick() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
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

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(onLayoutChange);
      ro.observe(container);
      var j;
      for (j = 0; j < steps.length; j++) {
        ro.observe(steps[j]);
      }
    }

    tick();
    requestAnimationFrame(function () {
      onLayoutChange();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollJourney);
  } else {
    initScrollJourney();
  }
})();
