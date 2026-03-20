"use client";
import Link from "next/link";
import LightRays from "@/components/LightRays";

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">

      {/* LIGHT RAYS BACKGROUND */}
      <div className="absolute inset-0 z-0">
      <LightRays
         raysOrigin="top-center"
          raysColor="#F9F6EE"
          raysSpeed={0.3}
          followMouse={false}
          mouseInfluence={0}
          lightSpread={1.2}
          rayLength={3}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={0.2}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 -mt-20">

        {/* OBSCURA metallic text */}
        <h1
          className="font-black uppercase tracking-widest"
          style={{
            fontSize: "clamp(64px, 13vw, 170px)",
            lineHeight: 1,
            background: "linear-gradient(180deg, #ffffff 0%, #a0a0a0 40%, #ffffff 60%, #6b6b6b 80%, #ccff00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 30px rgba(204,255,0,0.15)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
          }}
        >
          OBSCURA
        </h1>

        {/* Subtext */}
        <p className="mt-8 text-white/40 text-lg max-w-lg leading-relaxed">
          Explore 5,000+ films across Hollywood, Bollywood,
          Korean and Japanese cinema through real data and analytics.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/movies"
            className="px-8 py-3 font-semibold text-black rounded-full transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{ backgroundColor: "#CCFF00" }}
          >
            Explore Movies
          </Link>
          <Link
            href="/directors"
            className="px-8 py-3 font-semibold text-white/60 border border-white/15 rounded-full hover:border-white/40 hover:text-white transition-all duration-200"
          >
            Top Directors
          </Link>
        </div>

      </div>

    </section>
  );
}