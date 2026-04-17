"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";

function pascal(row: number, col: number): number {
  if (col < 0 || col > row) return 0;
  if (col === 0 || col === row) return 1;
  let result = 1;
  for (let i = 0; i < col; i++) {
    result = (result * (row - i)) / (i + 1);
  }
  return Math.round(result);
}

type ColorMode = "even-odd" | "mod3" | "mod5";

const ROW_OPTIONS = [8, 10, 15] as const;

function getCellColors(value: number, mode: ColorMode): string {
  switch (mode) {
    case "even-odd":
      return value % 2 === 0
        ? "bg-white border-neutral-200 text-neutral-400"
        : "bg-neutral-900 text-white border-neutral-900";
    case "mod3": {
      const m = value % 3;
      if (m === 0) return "bg-white border-neutral-200 text-neutral-400";
      if (m === 1) return "bg-neutral-900 text-white border-neutral-900";
      return "bg-neutral-500 text-white border-neutral-500";
    }
    case "mod5": {
      const m = value % 5;
      if (m === 0) return "bg-white border-neutral-200 text-neutral-400";
      if (m === 1) return "bg-neutral-900 text-white border-neutral-900";
      if (m === 2) return "bg-neutral-700 text-white border-neutral-700";
      if (m === 3) return "bg-neutral-500 text-white border-neutral-500";
      return "bg-neutral-300 text-neutral-700 border-neutral-300";
    }
  }
}

function Cell({
  row,
  col,
  revealed,
  colorMode,
  onReveal,
  animatingIn,
}: {
  row: number;
  col: number;
  revealed: boolean;
  colorMode: ColorMode;
  onReveal: () => void;
  animatingIn: boolean;
}) {
  const value = pascal(row, col);

  if (!revealed) {
    return (
      <button
        onClick={onReveal}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-sm font-medium text-neutral-400 cursor-pointer hover:bg-neutral-100 hover:border-neutral-300 hover:text-neutral-600 transition-all duration-150 select-none shrink-0"
        aria-label={`Reveal row ${row}, column ${col}`}
      >
        ?
      </button>
    );
  }

  const colors = getCellColors(value, colorMode);
  const animClass = animatingIn ? "animate-scale-in" : "";

  return (
    <div
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center text-xs sm:text-sm font-medium select-none shrink-0 ${colors} ${animClass}`}
    >
      {value}
    </div>
  );
}

export default function PascalsTrianglePage() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<number>(8);
  const [colorMode, setColorMode] = useState<ColorMode>("even-odd");
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [stylesInjected, setStylesInjected] = useState(false);

  useEffect(() => {
    if (stylesInjected) return;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pascal-scale-in {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }
      .animate-scale-in {
        animation: pascal-scale-in 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    setStylesInjected(true);
    return () => {
      document.head.removeChild(style);
    };
  }, [stylesInjected]);

  const makeKey = (row: number, col: number) => `${row}-${col}`;

  const revealCell = useCallback(
    (row: number, col: number) => {
      const key = makeKey(row, col);
      if (revealed.has(key)) return;

      setRevealed((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      setAnimatingCells((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      setTimeout(() => {
        setAnimatingCells((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 300);
    },
    [revealed]
  );

  const revealAll = useCallback(() => {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];

    for (let r = 0; r <= rows; r++) {
      const timer = setTimeout(() => {
        setRevealed((prev) => {
          const next = new Set(prev);
          for (let c = 0; c <= r; c++) {
            next.add(makeKey(r, c));
          }
          return next;
        });
        setAnimatingCells((prev) => {
          const next = new Set(prev);
          for (let c = 0; c <= r; c++) {
            next.add(makeKey(r, c));
          }
          return next;
        });

        setTimeout(() => {
          setAnimatingCells((prev) => {
            const next = new Set(prev);
            for (let c = 0; c <= r; c++) {
              next.delete(makeKey(r, c));
            }
            return next;
          });
        }, 300);
      }, r * 100);

      revealTimers.current.push(timer);
    }
  }, [rows]);

  const reset = useCallback(() => {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setRevealed(new Set());
    setAnimatingCells(new Set());
  }, []);

  const changeRows = useCallback(
    (newRows: number) => {
      if (newRows === rows) return;
      setRevealed((prev) => {
        const next = new Set<string>();
        prev.forEach((key) => {
          const [r] = key.split("-").map(Number);
          if (r <= newRows) next.add(key);
        });
        return next;
      });
      setRows(newRows);
    },
    [rows]
  );

  const colorModes: { value: ColorMode; label: string }[] = [
    { value: "even-odd", label: "Even/Odd" },
    { value: "mod3", label: "Mod 3" },
    { value: "mod5", label: "Mod 5" },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {/* Header */}
        <section className="animate-fade-in-up">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-32 md:pb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-mathitude-purple tracking-tight text-center" style={{ fontFamily: "var(--font-original-surfer)" }}>
              Pascal&apos;s Triangle Explorer
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-500 leading-relaxed text-center max-w-2xl mx-auto">
              Tap each cell to calculate the number. Watch the Sierpinski
              triangle pattern emerge!
            </p>
          </div>
        </section>

        {/* Controls */}
        <section>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              {/* Row count toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-600">Rows:</span>
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                  {ROW_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => changeRows(opt)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${rows === opt ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color mode toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-600">Color:</span>
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                  {colorModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setColorMode(mode.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${colorMode === mode.value ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={revealAll}
                  className="px-4 py-1.5 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Reveal All
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-1.5 text-sm font-medium bg-white text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Triangle Grid */}
        <section>
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
            <div className="overflow-x-auto">
              <div className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-fit mx-auto py-4">
                {Array.from({ length: rows + 1 }, (_, r) => (
                  <div
                    key={r}
                    className="flex items-center justify-center gap-1 sm:gap-1.5"
                  >
                    {Array.from({ length: r + 1 }, (_, c) => {
                      const key = makeKey(r, c);
                      return (
                        <Cell
                          key={key}
                          row={r}
                          col={c}
                          revealed={revealed.has(key)}
                          colorMode={colorMode}
                          onReveal={() => revealCell(r, c)}
                          animatingIn={animatingCells.has(key)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Info section */}
        <section className="bg-neutral-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-snug tracking-tight">
                The Sierpinski Pattern
              </h2>
              <p className="mt-6 text-white/60 max-w-xl mx-auto leading-relaxed">
                When you color all the odd numbers dark and even numbers light,
                a fractal called the Sierpinski triangle emerges. This beautiful
                pattern repeats at every scale — one of math&apos;s most
                surprising visual discoveries.
              </p>
              <p className="mt-4 text-white/40 text-sm max-w-lg mx-auto leading-relaxed">
                Try Mod 3 and Mod 5 color modes to see even more patterns
                hidden inside Pascal&apos;s Triangle!
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
