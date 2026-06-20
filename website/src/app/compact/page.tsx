import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { AboutPaula } from "@/components/sections/about-paula";
import { Services } from "@/components/sections/services";
import { Newsletter } from "@/components/sections/newsletter";
import { InfoBar } from "@/components/sections/info-bar";
import { Footer } from "@/components/sections/footer";

// Compact variant of the homepage — same content, ~60px less vertical
// padding per section so the page feels tighter below the hero.
// Compare at /compact vs / to decide which breathing room feels right.
export default function CompactHome() {
  return (
    <>
      <style>{`
        .compact-layout section > div {
          padding-top: 3.5rem;
          padding-bottom: 3.5rem;
        }
        @media (min-width: 640px) {
          .compact-layout section > div {
            padding-top: 4.5rem;
            padding-bottom: 4.5rem;
          }
        }
        .compact-layout .compact-inner-gap {
          margin-top: 2.5rem;
        }
      `}</style>
      <Navbar />
      <main className="flex-1 compact-layout">
        <Hero />
        <AboutPaula />
        <Services />
        <CtaBanner />
        <Newsletter />
        <InfoBar />
      </main>
      <Footer />
    </>
  );
}
