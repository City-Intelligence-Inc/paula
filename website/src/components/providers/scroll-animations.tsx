"use client";
import { useEffect } from "react";

export function ScrollAnimations() {
  useEffect(() => {
    // ── Scroll reveal ──
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("revealed");
      }),
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

    // ── Magnetic hover ──
    const magnets = document.querySelectorAll<HTMLElement>("[data-magnetic]");
    const offs: (() => void)[] = [];
    magnets.forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.22;
        const dy = (e.clientY - r.top - r.height / 2) * 0.22;
        el.style.setProperty("--mx", `${dx}px`);
        el.style.setProperty("--my", `${dy}px`);
      };
      const leave = () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      offs.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });

    // ── Parallax ──
    const parallaxEls = document.querySelectorAll<HTMLElement>("[data-parallax]");
    const onScroll = () => {
      const vH = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > vH + 120) return;
        const pct = (vH - rect.top) / (vH + rect.height);
        el.style.transform = `translateY(${(pct - 0.5) * -52}px) scale(1.09)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      offs.forEach((f) => f());
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
