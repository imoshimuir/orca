import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import dashboardBody from "./dashboard-body.html?raw";
import "./DashboardPage.css";

type ViewName = "dashboard" | "multi-site";

export function DashboardPage() {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const titleEl = root.querySelector("#page-title");
    const panels: Record<ViewName, Element | null> = {
      dashboard: root.querySelector('[data-view-panel="dashboard"]'),
      "multi-site": root.querySelector('[data-view-panel="multi-site"]'),
    };
    const navIcons = root.querySelectorAll<HTMLAnchorElement>(".nav-icon[data-view]");

    function showView(name: ViewName) {
      const v = panels[name];
      if (!v) return;
      (Object.keys(panels) as ViewName[]).forEach((key) => {
        const p = panels[key];
        if (!p) return;
        const on = key === name;
        p.classList.toggle("is-active", on);
        (p as HTMLElement).hidden = !on;
      });
      if (titleEl) {
        titleEl.textContent =
          name === "dashboard" ? "Dashboard" : "Multi-site management";
      }
      navIcons.forEach((a) => {
        const active = a.getAttribute("data-view") === name;
        a.classList.toggle("active", active);
        if (active) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    }

    function onNavClick(e: MouseEvent) {
      e.preventDefault();
      const t = e.currentTarget as HTMLAnchorElement;
      const name = t.getAttribute("data-view") as ViewName | null;
      if (name === "dashboard" || name === "multi-site") showView(name);
    }

    navIcons.forEach((a) => a.addEventListener("click", onNavClick));
    showView("dashboard");

    return () => {
      navIcons.forEach((a) => a.removeEventListener("click", onNavClick));
    };
  }, []);

  return (
    <>
      <div
        ref={shellRef}
        className="dashboard-shell"
        dangerouslySetInnerHTML={{ __html: dashboardBody }}
      />
      <p style={{ position: "fixed", bottom: 8, right: 12, margin: 0, fontSize: 12, opacity: 0.75 }}>
        <Link to="/">← Back to landing</Link>
      </p>
    </>
  );
}
