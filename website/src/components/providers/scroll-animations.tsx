"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+×÷=√πΣ∫Δ∞0123456789";

export function ScrollAnimations() {
  // This provider lives in the root layout, so it does NOT remount on client-
  // side navigation. Keying the effect to pathname re-queries + re-observes the
  // NEW page's [data-reveal] elements after each route change — otherwise
  // elements mounted after the first load start at opacity:0 and never get
  // .revealed, so the page renders blank (e.g. navigating back to home).
  const pathname = usePathname();
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
    // Fully-clipped reveal variants can never observe themselves: "word"
    // spans sit translated 115% inside overflow-hidden wrappers and "clip"
    // headlines are clip-pathed to nothing, so their intersection rect is
    // always ZERO and the reveal never fires (headlines stayed invisible —
    // the CTA "black box" bug). Observe the nearest UN-clipped ancestor and
    // reveal them when it scrolls in; everything else observes itself.
    const wordHosts = new Map<Element, HTMLElement[]>();
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      const kind = el.dataset.reveal;
      if (kind === "word" || kind === "clip") {
        const host =
          el.parentElement?.closest("h1, h2, h3, h4, p, section, div, footer") ||
          el.parentElement ||
          el;
        if (!wordHosts.has(host)) wordHosts.set(host, []);
        wordHosts.get(host)!.push(el);
      } else {
        revealObs.observe(el);
      }
    });
    const wordObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        for (const w of wordHosts.get(e.target) || []) w.classList.add("revealed");
        wordObs.unobserve(e.target);
      }),
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    wordHosts.forEach((_, host) => wordObs.observe(host));
    cleanups.push(() => { revealObs.disconnect(); wordObs.disconnect(); });

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
  }, [pathname]);

  return null;
}
