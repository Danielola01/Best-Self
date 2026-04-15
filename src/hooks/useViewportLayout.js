import { useState, useEffect } from "react";

/** @returns {'mobile' | 'tablet' | 'desktop'} */
export function useViewportLayout() {
  const [layout, setLayout] = useState(() => computeLayout());

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqDesktop = window.matchMedia("(min-width: 1280px)");
    const update = () => setLayout(computeLayout());

    mqMobile.addEventListener("change", update);
    mqDesktop.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqDesktop.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return layout;
}

function computeLayout() {
  if (typeof window === "undefined") return "mobile";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1280) return "tablet";
  return "desktop";
}
