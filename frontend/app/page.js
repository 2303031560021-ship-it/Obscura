"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import { getGlobalStats, getTrendingMovies, getTopDirectors } from "@/lib/api";
import TypewriterText from "@/components/TypewriterText";


export default function Home() {
  return (
    <main className="bg-black">
      <HeroSection />
      <StatsSection />
      <TrendingSection />
      <TopDirectorsSection />
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

// ── TRENDING SECTION ─────────────────────────
function TrendingSection() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getTrendingMovies()
      .then(res => setMovies(res.data.movies))
      .catch(err => console.error("Trending fetch error:", err));
  }, []);

  return (
    <section className="bg-black py-20 border-t border-white/5">
     <div className="max-w-6xl mx-auto px-6 mb-10" style={{ paddingLeft: "48px" }}>
        <p
          className="text-base tracking-widest uppercase mb-3 font-bold"
          style={{ color: "#CCFF00", fontSize: "13px", letterSpacing: "0.2em" }}
        >
          — Trending This Week —
        </p>
        <h2 className="text-4xl md:text-5xl font-black text-white">
          Most Popular Right Now
        </h2>
      </div>

      {/* Horizontal scroll container */}
   <div
        className="flex gap-4 overflow-x-auto pb-8"
       
  style={{
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
   
  }}
>
        {movies.map((movie, index) => (
          <TrendingCard key={movie.tmdb_id} movie={movie} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}


// ── TRENDING CARD ─────────────────────────────
function TrendingCard({ movie, rank }) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  return (
    <Link href={`/movies/${movie.tmdb_id}`}>
   <div
        className="relative flex-shrink-0 cursor-pointer group"
      style={{
          width: "calc(22vw)",
          marginRight: "-20px",
          scrollSnapAlign: "start",
          minWidth: "220px",
          maxWidth: "280px",
        }}
      >
        {/* BIG RANK NUMBER — behind poster like Netflix */}
        <div
          className="absolute bottom-8 left-0 font-black text-white select-none pointer-events-none"
          style={{
            fontSize: "clamp(80px, 12vw, 140px)",
            lineHeight: 1,
            WebkitTextStroke: "3px rgba(255,255,255,0.25)",
            color: "transparent",
            zIndex: 1,
            left: "-10px",
          }}
        >
          {rank}
        </div>

        {/* POSTER */}
       <div
          className="relative rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105"
          style={{
            width: "180px",
            height: "270px",
            marginLeft: "40px",
            zIndex: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white/20 text-xs text-center p-2"
              style={{ backgroundColor: "#111" }}
            >
              {movie.title}
            </div>
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: "#CCFF00" }}
            >
              ★ {Number(movie.rating).toFixed(1)}
            </span>
          </div>
        </div>

        {/* TITLE below poster */}
        <div
          className="mt-3 text-white/70 text-xs font-medium truncate"
          style={{ marginLeft: "40px", width: "140px" }}
        >
          {movie.title}
        </div>

      

      </div>
    </Link>
  );
}

// ── TOP DIRECTORS SECTION ─────────────────────
function TopDirectorsSection() {
  const [directors, setDirectors] = useState([]);

  useEffect(() => {
    getTopDirectors()
      .then(res => setDirectors(res.data.directors))
      .catch(err => console.error("Directors fetch error:", err));
  }, []);

  return (
    <section className="bg-black py-20 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <p
          className="text-base tracking-widest uppercase mb-3 font-bold"
          style={{ color: "#CCFF00", fontSize: "13px", letterSpacing: "0.2em" }}
        >
          — Hall of Fame —
        </p>
        <h2 className="text-4xl md:text-5xl font-black text-white">
          Top Directors
        </h2>
      </div>

      {/* Horizontal scroll — same as trending */}
      <div
        className="flex gap-4 overflow-x-auto pb-8"
        style={{
          paddingLeft: "200px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {directors.map((director, index) => (
          <DirectorCard
            key={director.tmdb_person_id}
            director={director}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  );
}


// ── DIRECTOR CARD ─────────────────────────────
function DirectorCard({ director, rank }) {
  const photoUrl = director.profile_path
    ? `https://image.tmdb.org/t/p/w185${director.profile_path}`
    : null;

  return (
    <Link href={`/directors/${director.tmdb_person_id}`}>
      <div
        className="relative flex-shrink-0 cursor-pointer group flex flex-col items-center"
       style={{
          width: "calc(15vw)",
          scrollSnapAlign: "start",
          minWidth: "200px",
          maxWidth: "240px",
          paddingTop: "80px",
          overflow: "visible",
        }}
      >
       

        {/* CIRCLE PHOTO */}
        <div className="relative z-10">
          <div
            className="rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105"
            style={{
              width: "160px",
              height: "160px",
              border: "2px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={director.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white/20 text-3xl font-black"
                style={{ backgroundColor: "#111" }}
              >
                {director.name[0]}
              </div>
            )}
          </div>

          {/* Glowing ring on hover */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: "0 0 25px rgba(204,255,0,0.5)",
              border: "2px solid rgba(204,255,0,0.7)",
            }}
          />
        </div>

      {/* NAME */}
        <p className="mt-4 text-white font-bold text-sm text-center truncate w-full px-2">
          {director.name}
        </p>

        {/* RANK */}
        <p
          className="mt-1 text-xs font-black text-center"
          style={{ color: "#CCFF00" }}
        >
          #{rank}
        </p>

      

     

      </div>
    </Link>
  );}