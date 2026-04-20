import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { CtaBanner } from "@/components/sections/cta-banner";
import { AboutPaula } from "@/components/sections/about-paula";
import { Services } from "@/components/sections/services";
import { Reviews } from "@/components/sections/reviews";
import { Newsletter } from "@/components/sections/newsletter";
import { InfoBar } from "@/components/sections/info-bar";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AboutPaula />
        <Services />
        <Reviews />
        <CtaBanner />
        <Newsletter />
        <InfoBar />
      </main>
      <Footer />
    </>
  );
}
