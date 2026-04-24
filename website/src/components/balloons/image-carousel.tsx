"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = { src: string; alt: string };

export function ImageCarousel({
  slides,
  intervalMs = 4500,
}: {
  slides: Slide[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, intervalMs, slides.length]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <div
      className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-lg bg-neutral-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous image"
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/85 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next image"
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/85 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
