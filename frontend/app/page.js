"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import { getGlobalStats } from "@/lib/api";
import TypewriterText from "@/components/TypewriterText";

export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />
      <StatsSection />
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
          raysColor="#80827c1a"
          raysSpeed={0.3}
          lightSpread={1.2}
          rayLength={3}
          followMouse={false}
          mouseInfluence={0}
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
          Real data. Real cinema. Explore trends, directors and films
          from Hollywood to Bollywood and beyond.
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
      <div
        className="absolute bottom-0 left-0 w-full h-32 pointer-events-none z-20"
        style={{
          background: "linear-gradient(to bottom, transparent, #000000)",
        }}
      />

    </section>
  );
}





// ── STATS SECTION ─────────────────────────────
function StatsSection() {
  const [stats, setStats] = useState(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  // Fetch real stats from Flask API
  useEffect(() => {
    getGlobalStats()
      .then(res => setStats(res.data))
      .catch(err => console.error("Stats fetch error:", err));
  }, []);

  // Start count-up only when section is visible on screen
  // WHY? So animation plays when user scrolls to it, not on page load
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const statItems = [
    {
      label: "Films Analysed",
      value: stats?.total_movies || 0,
      suffix: "+",
    },
    {
      label: "Actors Tracked",
      value: stats?.total_actors || 0,
      suffix: "+",
    },
    {
      label: "Directors",
      value: stats?.total_directors || 0,
      suffix: "+",
    },
    {
      label: "Global Industries",
      value: stats?.total_industries || 0,
      suffix: "",
    },
  ];

  return (
   <section
      ref={sectionRef}
      className="bg-black px-6 py-32 border-t border-white/5 min-h-screen flex items-center"
    >
      <div className="max-w-6xl mx-auto">

        {/* Section heading */}
        <div className="mb-20 max-w-2xl">
       <p
          className="text-base tracking-widest uppercase mb-6 font-bold"
          style={{ color: "#CCFF00", fontSize: "13px", letterSpacing: "0.2em" }}
        >
          — About Obscura —
        </p>
   <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
  <div className="relative w-[32ch] mx-auto text-left">
    
    {/* Invisible text (locks size perfectly) */}
    <span className="invisible whitespace-nowrap">
      Cinema, decoded through data.
    </span>

    {/* Typing text */}
    <span className="absolute left-0 top-0 whitespace-nowrap">
      <TypewriterText 
        text="Cinema, decoded through data." 
        speed={40} 
        cursor="infinite" 
      />
    </span>

  </div>
</h2>
          <p className="text-white/40 text-lg leading-relaxed">
            Obscura is a data analytics platform that dives deep into global cinema.
            From box office trends to director success scores — every insight is
            powered by real data, not opinion.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {statItems.map((item, i) => (
            <StatCard
              key={i}
              label={item.label}
              value={item.value}
              suffix={item.suffix}
              visible={visible}
              delay={i * 200}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

function StatCard({ label, value, suffix, visible, delay }) {
  const displayRef = useRef(null);
  const containerRef = useRef(null);
  const startedRef = useRef(false);

  // Bottom-up fade in animation
  useEffect(() => {
    if (!visible || !containerRef.current) return;
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.opacity = "1";
        containerRef.current.style.transform = "translateY(0)";
      }
    }, delay);
  }, [visible, delay]);

  // Count up animation
  useEffect(() => {
    if (!visible || !value || startedRef.current) return;
    const timer = setTimeout(() => {
      startedRef.current = true;
      let startTime = null;
      const duration = 2500;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(eased * value);
        if (displayRef.current) {
          displayRef.current.textContent = current.toLocaleString() + suffix;
        }
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          if (displayRef.current) {
            displayRef.current.textContent = value.toLocaleString() + suffix;
          }
        }
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [visible, value, delay, suffix]);

  return (
    <div
      ref={containerRef}
      style={{
        opacity: 0,
        transform: "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {/* Number */}
    <span
        ref={displayRef}
        className="block font-black"
        style={{
          fontSize: "clamp(40px, 5vw, 64px)",
          color: "#CCFF00",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "monospace",
          minWidth: "200px",
        }}
      >
        0{suffix}
      </span>

      {/* Divider line */}
      <div
        className="my-3"
        style={{
          width: "32px",
          height: "2px",
          backgroundColor: "#CCFF00",
          opacity: 0.4,
        }}
      />

      {/* Label */}
      <span className="text-white/40 text-sm font-medium tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}