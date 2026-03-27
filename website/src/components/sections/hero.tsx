import { BookOpen, Calculator, Puzzle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-mathitude-light via-white to-mathitude-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-mathitude-navy leading-tight" style={{ fontFamily: "var(--font-original-surfer)" }}>
            At Mathitude, it&apos;s all about{" "}
            <span className="text-mathitude-teal">the attitude.</span>
          </h1>

          {/* Character illustrations placeholder */}
          <div className="mt-12 flex justify-center items-end gap-6 sm:gap-10 lg:gap-16">
            <div className="flex flex-col items-center">
              <div className="w-24 h-28 sm:w-32 sm:h-36 lg:w-40 lg:h-44 bg-gradient-to-b from-mathitude-teal/20 to-mathitude-teal/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-mathitude-teal/30">
                <Calculator className="w-10 h-10 sm:w-12 sm:h-12 text-mathitude-teal" />
              </div>
              <span className="mt-2 text-xs text-gray-400 font-medium">
                Pascal
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-28 sm:w-32 sm:h-36 lg:w-40 lg:h-44 bg-gradient-to-b from-mathitude-purple/20 to-mathitude-purple/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-mathitude-purple/30">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-mathitude-purple" />
              </div>
              <span className="mt-2 text-xs text-gray-400 font-medium">
                Space Chips
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-28 sm:w-32 sm:h-36 lg:w-40 lg:h-44 bg-gradient-to-b from-mathitude-teal/20 to-mathitude-teal/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-mathitude-teal/30">
                <Puzzle className="w-10 h-10 sm:w-12 sm:h-12 text-mathitude-teal" />
              </div>
              <span className="mt-2 text-xs text-gray-400 font-medium">
                Rubik&apos;s Boy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-5 select-none">
        +
      </div>
      <div className="absolute top-20 right-16 text-5xl opacity-5 select-none">
        &divide;
      </div>
      <div className="absolute bottom-16 left-20 text-7xl opacity-5 select-none">
        &pi;
      </div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-5 select-none">
        &sum;
      </div>
    </section>
  );
}
