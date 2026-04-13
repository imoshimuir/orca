(function () {
  const header = document.getElementById("site-header");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setTopbarHeight() {
    if (!header) return;
    document.documentElement.style.setProperty("--topbar-h", `${header.offsetHeight}px`);
  }

  function initScrollTopbar() {
    if (!header) return;

    let lastY = window.scrollY || document.documentElement.scrollTop;
    let raf = 0;
    const minScroll = 48;
    const epsilon = 0.5;

    function getScrollY() {
      return window.scrollY ?? document.documentElement.scrollTop ?? 0;
    }

    function onScrollFrame() {
      raf = 0;
      const y = getScrollY();
      const delta = y - lastY;

      header.classList.toggle("topbar--scrolled", y > 12);

      if (motionQuery.matches) {
        header.classList.remove("topbar--hidden");
        lastY = y;
        return;
      }

      if (y < minScroll) {
        header.classList.remove("topbar--hidden");
      } else if (delta > epsilon) {
        header.classList.add("topbar--hidden");
      } else if (delta < -epsilon) {
        header.classList.remove("topbar--hidden");
      }

      lastY = y;
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(onScrollFrame);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      setTopbarHeight();
      onScrollFrame();
    });

    setTopbarHeight();
    onScrollFrame();
  }

  initScrollTopbar();

  function initMobileNav() {
    const toggle = document.getElementById("topbar-menu-toggle");
    const header = document.getElementById("site-header");
    const backdrop = document.getElementById("topbar-backdrop");
    const panel = document.getElementById("primary-nav-panel");
    if (!toggle || !header || !backdrop || !panel) return;

    const mq = window.matchMedia("(max-width: 768px)");

    function setOpen(open) {
      if (open) {
        header.classList.remove("topbar--hidden");
      }
      header.classList.toggle("topbar--menu-open", open);
      document.body.classList.toggle("topbar-menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function close() {
      if (header.classList.contains("topbar--menu-open")) {
        setOpen(false);
      }
    }

    toggle.addEventListener("click", function () {
      if (!mq.matches) return;
      setOpen(!header.classList.contains("topbar--menu-open"));
    });

    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!header.classList.contains("topbar--menu-open")) return;
      close();
      toggle.focus();
    });

    window.addEventListener("resize", function () {
      if (!mq.matches) close();
    });

    panel.addEventListener("click", function (e) {
      const a = e.target.closest("a[href^='#']");
      if (a && mq.matches) close();
    });
  }

  initMobileNav();

  function initStatCountUp() {
    const bar = document.querySelector(".hero-stat-bar");
    if (!bar) return;

    const els = bar.querySelectorAll(".hero-stat-bar__value[data-stat]");
    if (!els.length) return;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function formatSeconds(totalSeconds) {
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return m + " min " + s + " sec";
    }

    function setFinal(el) {
      var stat = el.getAttribute("data-stat");
      if (stat === "percent") {
        var target = Number(el.getAttribute("data-target"));
        var suffix = el.getAttribute("data-suffix") || "";
        el.textContent = target + suffix;
      } else if (stat === "seconds") {
        var sec = Number(el.getAttribute("data-target-seconds"));
        el.textContent = formatSeconds(sec);
      }
    }

    if (motionQuery.matches) {
      els.forEach(setFinal);
      return;
    }

    var duration = 1200;
    var stagger = 110;

    function runCount(el, delay) {
      var stat = el.getAttribute("data-stat");
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var elapsed = now - start - delay;
        if (elapsed < 0) {
          requestAnimationFrame(frame);
          return;
        }
        var t = Math.min(1, elapsed / duration);
        var eased = easeOutCubic(t);

        if (stat === "percent") {
          var target = Number(el.getAttribute("data-target"));
          var suffix = el.getAttribute("data-suffix") || "";
          el.textContent = Math.round(target * eased) + suffix;
        } else if (stat === "seconds") {
          var total = Number(el.getAttribute("data-target-seconds"));
          var current = Math.round(total * eased);
          el.textContent = formatSeconds(current);
        }

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          setFinal(el);
        }
      }

      requestAnimationFrame(frame);
    }

    var started = false;

    function start() {
      if (started) return;
      started = true;
      els.forEach(function (el, i) {
        runCount(el, i * stagger);
      });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              io.disconnect();
              start();
            }
          });
        },
        { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
      );
      io.observe(bar);
    } else {
      start();
    }
  }

  initStatCountUp();

  const form = document.getElementById("estimate-form");
  const feedback = document.getElementById("estimate-feedback");
  const billInput = document.getElementById("water-bill");
  const postcodeInput = document.getElementById("postcode");
  const consentCheckbox = document.getElementById("estimate-consent");

  var moneyFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

  function normalizePostcodeForEstimate(value) {
    return value.trim().replace(/\s+/g, " ").toUpperCase();
  }

  function parseBillPounds(raw) {
    var cleaned = String(raw).replace(/[£,\s]/g, "").replace(/[^\d.]/g, "");
    if (!cleaned) return null;
    var n = parseFloat(cleaned);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }

  function discountPercentForPostcode(normalisedPostcode) {
    var h = 2166136261;
    for (var i = 0; i < normalisedPostcode.length; i++) {
      h ^= normalisedPostcode.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var u = h >>> 0;
    return 3 + (u % 201) / 100;
  }

  function estimateOrcaAnnualBill(annualBillPounds, normalisedPostcode) {
    var discountPercent = discountPercentForPostcode(normalisedPostcode);
    var factor = 1 - discountPercent / 100;
    var orcaBill = Math.round(annualBillPounds * factor * 100) / 100;
    var saving = Math.round((annualBillPounds - orcaBill) * 100) / 100;
    return { discountPercent: discountPercent, orcaBill: orcaBill, saving: saving };
  }

  function showMessage(text, isError) {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.classList.toggle("save-card__feedback--error", Boolean(isError));
    feedback.classList.toggle("save-card__feedback--detail", Boolean(!isError && text.indexOf("\n") !== -1));
  }

  function shouldSubmitLeads() {
    if (typeof window === "undefined") return false;
    var h = window.location.hostname;
    return h !== "localhost" && h !== "127.0.0.1";
  }

  async function submitEstimateLead(payload) {
    if (!shouldSubmitLeads()) return "skipped";
    try {
      var res = await fetch("/api/estimate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok ? "ok" : "failed";
    } catch (e) {
      return "failed";
    }
  }

  form?.addEventListener("submit", async function (e) {
    e.preventDefault();
    var bill = parseBillPounds(billInput?.value ?? "");
    if (bill === null) {
      showMessage("Please enter a valid annual water bill (a number greater than zero).", true);
      billInput?.focus();
      return;
    }

    var email = parseEmail(emailInput?.value ?? "");
    if (email === null) {
      showMessage("Please enter a valid email address.", true);
      emailInput?.focus();
      return;
    }

    var phone = parseOptionalPhone(phoneInput?.value ?? "");
    if (phone === false) {
      showMessage("If you add a phone number, use at least 8 digits.", true);
      phoneInput?.focus();
      return;
    }

    var rawPc = postcodeInput?.value ?? "";
    var postcode = normalizePostcodeForEstimate(rawPc);

    if (!postcode) {
      showMessage("Please enter your postcode.", true);
      postcodeInput?.focus();
      return;
    }

    if (!consentCheckbox?.checked) {
      showMessage("Please tick the box to continue.", true);
      consentCheckbox?.focus();
      return;
    }

    var est = estimateOrcaAnnualBill(bill, postcode);
    var pct = est.discountPercent.toFixed(2).replace(/\.?0+$/, "");
    var contactNote = phone
      ? "We’ll use " + email + " and " + phone + " to follow up."
      : "We’ll use " + email + " to follow up.";

    var leadResult = await submitEstimateLead({
      email: email,
      phone: phone || "",
      postcode: postcode,
      bill: bill,
      discountPercent: est.discountPercent,
      orcaBill: est.orcaBill,
      saving: est.saving,
      consent: true,
    });
    var saveNote =
      leadResult === "failed"
        ? "\n\nWe couldn’t save your request just now — your estimate is still above. Please try again shortly."
        : "";

    showMessage(
      [
        "Your area (" + postcode + ") qualifies for an illustrative " + pct + "% reduction on supply.",
        "Current bill: " + moneyFmt.format(bill),
        "Estimated with Orca: " + moneyFmt.format(est.orcaBill),
        "You could save about " + moneyFmt.format(est.saving) + " per year.",
        contactNote,
      ].join("\n") + saveNote,
      false
    );
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
