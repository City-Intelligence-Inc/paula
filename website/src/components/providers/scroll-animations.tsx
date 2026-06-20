"use client";
import { useEffect } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+×÷=√πΣ∫Δ∞0123456789";

export function ScrollAnimations() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // ── 1. Scroll progress bar ──
    const bar = document.createElement("div");
    bar.className = "scroll-progress-bar";
    document.body.appendChild(bar);
    const onProgress = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      bar.style.setProperty("--pct", (window.scrollY / total) * 100 + "%");
    };
    window.addEventListener("scroll", onProgress, { passive: true });
    cleanups.push(() => { bar.remove(); window.removeEventListener("scroll", onProgress); });

    // ── 2. Scroll reveal ──
    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("revealed");
      }),
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObs.observe(el));
    cleanups.push(() => revealObs.disconnect());

    // ── 2b. Hero photos: auto-reveal without observer ──
    // Photos sit below the initial fold, so the observer never fires on load.
    // Add .revealed immediately — CSS transition-delay on [data-delay] handles stagger.
    document.querySelectorAll<HTMLElement>("[data-hero-photo]").forEach((el) => {
      el.classList.add("revealed");
    });

    // ── 3. Magnetic hover ──
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
        el.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.22}px`);
      };
      const leave = () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); });
    });

    // ── 4. Parallax ──
    const parallaxEls = document.querySelectorAll<HTMLElement>("[data-parallax]");
    const onParallax = () => {
      const vH = window.innerHeight;
      parallaxEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > vH + 120) return;
        const pct = (vH - rect.top) / (vH + rect.height);
        el.style.transform = `translateY(${(pct - 0.5) * -52}px) scale(1.09)`;
      });
    };
    window.addEventListener("scroll", onParallax, { passive: true });
    onParallax();
    cleanups.push(() => window.removeEventListener("scroll", onParallax));

    // ── 5. 3D photo tilt ──
    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
      const move = (e: MouseEvent) => {
        if (!el.classList.contains("revealed")) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientY - r.top - r.height / 2) / r.height;
        const y = (e.clientX - r.left - r.width / 2) / r.width;
        el.style.transition = "transform 0.1s ease-out, box-shadow 0.1s ease-out";
        el.style.transform = `perspective(900px) rotateX(${-x * 10}deg) rotateY(${y * 10}deg) scale(1.03)`;
        el.style.boxShadow = `${-y * 8}px ${-x * 8}px 32px rgba(112,48,160,0.18)`;
      };
      const leave = () => {
        el.style.transition = "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "none";
        el.style.boxShadow = "";
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); });
    });

    // ── 6. Cursor spotlight (dark sections) ──
    document.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
      };
      el.addEventListener("mousemove", move);
      cleanups.push(() => el.removeEventListener("mousemove", move));
    });

    // ── 7. Text scramble decoder ──
    const scrambleObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        scrambleObs.unobserve(e.target);
        const el = e.target as HTMLElement;
        const original = el.textContent ?? "";
        let frame = 0;
        const totalFrames = original.length * 4;
        const tick = setInterval(() => {
          const resolved = Math.floor(frame / 4);
          el.textContent = original
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < resolved) return original[i];
              return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            })
            .join("");
          frame++;
          if (frame > totalFrames) {
            clearInterval(tick);
            el.textContent = original;
          }
        }, 28);
      }),
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-scramble]").forEach((el) => scrambleObs.observe(el));
    cleanups.push(() => scrambleObs.disconnect());

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
