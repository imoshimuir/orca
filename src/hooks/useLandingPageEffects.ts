import { useEffect } from "react";
import { initHeroGrid } from "../lib/heroGrid";
import { initScrollJourney } from "../lib/scrollJourneyLine";
import { estimateOrcaAnnualBill, normalizePostcodeForEstimate } from "../lib/postcodeEstimate";

export function useLandingPageEffects() {
  useEffect(() => {
    let cancelled = false;
    const header = document.getElementById("site-header");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function setTopbarHeight() {
      if (!header) return;
      document.documentElement.style.setProperty("--topbar-h", `${header.offsetHeight}px`);
    }

    let lastY = window.scrollY || document.documentElement.scrollTop;
    let topbarRaf = 0;
    const minScroll = 48;
    const epsilon = 0.5;

    function getScrollY() {
      return window.scrollY ?? document.documentElement.scrollTop ?? 0;
    }

    function onScrollFrame() {
      topbarRaf = 0;
      if (!header) return;
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

    function onTopbarScroll() {
      if (topbarRaf) return;
      topbarRaf = requestAnimationFrame(onScrollFrame);
    }

    function onTopbarResize() {
      setTopbarHeight();
      onScrollFrame();
    }

    setTopbarHeight();
    onScrollFrame();
    window.addEventListener("scroll", onTopbarScroll, { passive: true });
    window.addEventListener("resize", onTopbarResize);

    const toggle = document.getElementById("topbar-menu-toggle");
    const backdrop = document.getElementById("topbar-backdrop");
    const panel = document.getElementById("primary-nav-panel");
    const mqMobile = window.matchMedia("(max-width: 768px)");

    function setMenuOpen(open: boolean) {
      if (!header || !toggle || !backdrop) return;
      if (open) header.classList.remove("topbar--hidden");
      header.classList.toggle("topbar--menu-open", open);
      document.body.classList.toggle("topbar-menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function closeMenu() {
      if (header?.classList.contains("topbar--menu-open")) setMenuOpen(false);
    }

    function onToggleClick() {
      if (!header || !mqMobile.matches) return;
      setMenuOpen(!header.classList.contains("topbar--menu-open"));
    }

    function onBackdropClick() {
      closeMenu();
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key !== "Escape" || !header?.classList.contains("topbar--menu-open")) return;
      closeMenu();
      toggle?.focus();
    }

    function onWindowResizeMenu() {
      if (!mqMobile.matches) closeMenu();
    }

    function onPanelClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      const a = t.closest("a[href^='#']");
      if (a && mqMobile.matches) closeMenu();
    }

    toggle?.addEventListener("click", onToggleClick);
    backdrop?.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", onWindowResizeMenu);
    panel?.addEventListener("click", onPanelClick);

    const bar = document.querySelector(".hero-stat-bar");
    let statIo: IntersectionObserver | null = null;
    if (bar) {
      const els = bar.querySelectorAll<HTMLElement>(".hero-stat-bar__value[data-stat]");
      if (els.length) {
        function easeOutCubic(t: number) {
          return 1 - Math.pow(1 - t, 3);
        }
        function formatSeconds(totalSeconds: number) {
          const m = Math.floor(totalSeconds / 60);
          const s = totalSeconds % 60;
          return `${m} min ${s} sec`;
        }
        function setFinal(el: HTMLElement) {
          const stat = el.getAttribute("data-stat");
          if (stat === "percent") {
            const target = Number(el.getAttribute("data-target"));
            const suffix = el.getAttribute("data-suffix") || "";
            el.textContent = `${target}${suffix}`;
          } else if (stat === "seconds") {
            const sec = Number(el.getAttribute("data-target-seconds"));
            el.textContent = formatSeconds(sec);
          }
        }
        if (motionQuery.matches) {
          els.forEach(setFinal);
        } else {
          const duration = 1200;
          const stagger = 110;
          let started = false;

          function runCount(el: HTMLElement, delay: number) {
            const stat = el.getAttribute("data-stat");
            let start: number | null = null;

            function frame(now: number) {
              if (cancelled) return;
              if (start === null) start = now;
              const elapsed = now - start - delay;
              if (elapsed < 0) {
                requestAnimationFrame(frame);
                return;
              }
              const t = Math.min(1, elapsed / duration);
              const eased = easeOutCubic(t);

              if (stat === "percent") {
                const target = Number(el.getAttribute("data-target"));
                const suffix = el.getAttribute("data-suffix") || "";
                el.textContent = `${Math.round(target * eased)}${suffix}`;
              } else if (stat === "seconds") {
                const total = Number(el.getAttribute("data-target-seconds"));
                const current = Math.round(total * eased);
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

          function startStats() {
            if (started || cancelled) return;
            started = true;
            els.forEach((el, i) => runCount(el, i * stagger));
          }

          if ("IntersectionObserver" in window) {
            statIo = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    statIo?.disconnect();
                    statIo = null;
                    startStats();
                  }
                });
              },
              { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
            );
            statIo.observe(bar);
          } else {
            startStats();
          }
        }
      }
    }

    const form = document.getElementById("estimate-form");
    const feedback = document.getElementById("estimate-feedback");
    const billInput = document.getElementById("water-bill") as HTMLInputElement | null;
    const emailInput = document.getElementById("estimate-email") as HTMLInputElement | null;
    const phoneInput = document.getElementById("estimate-phone") as HTMLInputElement | null;
    const postcodeInput = document.getElementById("postcode") as HTMLInputElement | null;
    const consentCheckbox = document.getElementById("estimate-consent") as HTMLInputElement | null;

    const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function parseEmail(raw: string): string | null {
      const s = raw.trim();
      if (!s || !emailOk.test(s)) return null;
      return s;
    }

    /** Returns null if omitted; false if invalid; string if valid. */
    function parseOptionalPhone(raw: string): string | null | false {
      const s = raw.trim();
      if (!s) return null;
      const digits = s.replace(/\D/g, "");
      if (digits.length < 8) return false;
      return s;
    }

    function parseBillPounds(raw: string): number | null {
      const cleaned = raw.replace(/[£,\s]/g, "").replace(/[^\d.]/g, "");
      if (!cleaned) return null;
      const n = Number.parseFloat(cleaned);
      if (!Number.isFinite(n) || n <= 0) return null;
      return n;
    }

    function showMessage(text: string, isError: boolean) {
      if (!feedback) return;
      feedback.textContent = text;
      feedback.classList.toggle("save-card__feedback--error", Boolean(isError));
      feedback.classList.toggle("save-card__feedback--detail", Boolean(!isError && text.includes("\n")));
    }

    function shouldSubmitLeads(): boolean {
      if (typeof window === "undefined") return false;
      if (import.meta.env.VITE_SUBMIT_LEADS === "true") return true;
      const h = window.location.hostname;
      return h !== "localhost" && h !== "127.0.0.1";
    }

    async function submitEstimateLead(payload: {
      email: string;
      phone: string;
      postcode: string;
      bill: number;
      discountPercent: number;
      orcaBill: number;
      saving: number;
      consent: boolean;
    }): Promise<"ok" | "failed" | "skipped"> {
      if (!shouldSubmitLeads()) return "skipped";
      try {
        const res = await fetch("/api/estimate-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return res.ok ? "ok" : "failed";
      } catch {
        return "failed";
      }
    }

    async function onFormSubmit(e: Event) {
      e.preventDefault();
      const bill = parseBillPounds(billInput?.value ?? "");
      if (bill === null) {
        showMessage("Please enter a valid annual water bill (a number greater than zero).", true);
        billInput?.focus();
        return;
      }
      const email = parseEmail(emailInput?.value ?? "");
      if (email === null) {
        showMessage("Please enter a valid email address.", true);
        emailInput?.focus();
        return;
      }
      const phone = parseOptionalPhone(phoneInput?.value ?? "");
      if (phone === false) {
        showMessage("If you add a phone number, use at least 8 digits.", true);
        phoneInput?.focus();
        return;
      }
      const rawPc = postcodeInput?.value ?? "";
      const postcode = normalizePostcodeForEstimate(rawPc);
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
      const { discountPercent, orcaBill, saving } = estimateOrcaAnnualBill(bill, postcode);
      const pct = discountPercent.toFixed(2).replace(/\.?0+$/, "");
      const contactNote = phone ? `We’ll use ${email} and ${phone} to follow up.` : `We’ll use ${email} to follow up.`;

      const leadResult = await submitEstimateLead({
        email,
        phone: phone ?? "",
        postcode,
        bill,
        discountPercent,
        orcaBill,
        saving,
        consent: true,
      });
      const saveNote =
        leadResult === "failed"
          ? "\n\nWe couldn’t save your request just now — your estimate is still above. Please try again shortly."
          : "";

      showMessage(
        [
          `Your area (${postcode}) qualifies for an illustrative ${pct}% reduction on supply.`,
          `Current bill: ${money.format(bill)}`,
          `Estimated with Orca: ${money.format(orcaBill)}`,
          `You could save about ${money.format(saving)} per year.`,
          contactNote,
        ].join("\n") + saveNote,
        false
      );
    }

    form?.addEventListener("submit", onFormSubmit);

    function onAnchorClick(this: HTMLAnchorElement, e: Event) {
      const id = this.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    anchors.forEach((a) => a.addEventListener("click", onAnchorClick));

    const heroCleanup = initHeroGrid();
    const journeyCleanup = initScrollJourney();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onTopbarScroll);
      window.removeEventListener("resize", onTopbarResize);
      toggle?.removeEventListener("click", onToggleClick);
      backdrop?.removeEventListener("click", onBackdropClick);
      document.removeEventListener("keydown", onKeydown);
      window.removeEventListener("resize", onWindowResizeMenu);
      panel?.removeEventListener("click", onPanelClick);
      statIo?.disconnect();
      form?.removeEventListener("submit", onFormSubmit);
      anchors.forEach((a) => a.removeEventListener("click", onAnchorClick));
      heroCleanup?.();
      journeyCleanup?.();
      if (topbarRaf) cancelAnimationFrame(topbarRaf);
    };
  }, []);
}
