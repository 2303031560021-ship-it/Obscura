"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const API_BASE = "https://obscura-backend-sued.onrender.com/api";

const INDUSTRY_META = {
  Hollywood: { emoji: "🎬", color: "#CCFF00",  region: "United States", desc: "The world's largest film industry by revenue and global reach." },
  Bollywood: { emoji: "🎭", color: "#ff9f43",  region: "India",         desc: "Mumbai-based Hindi cinema — the most prolific film industry on earth." },
  Korean:    { emoji: "🎌", color: "#ff6b9d",  region: "South Korea",   desc: "Home of Parasite, Train to Busan, and a global cinematic revolution." },
  Japanese:  { emoji: "⛩️", color: "#60cfff",  region: "Japan",         desc: "From Studio Ghibli to Kurosawa — Japan's rich and diverse film culture." },
  French:    { emoji: "🗼", color: "#a29bfe",  region: "France",        desc: "Birthplace of cinema and home of the auteur — France leads world arthouse." },
};

// order we want to display
const DISPLAY_ORDER = ["Hollywood", "Korean", "Japanese", "Bollywood", "French"];

export default function GlobalCinemaPage() {
  const [films,   setFilms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/global/top-per-industry`)
      .then((res) => {
        // API returns { top_per_industry: [ { cinema_type, title, rating, poster_path, overview, release_year, vote_count } ] }
        const list = res.data.top_per_industry ?? res.data ?? [];
        // sort by our preferred display order
        list.sort((a, b) => {
          const ai = DISPLAY_ORDER.indexOf(a.cinema_type);
          const bi = DISPLAY_ORDER.indexOf(b.cinema_type);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        setFilms(list);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load data."); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={S.screen}>
      <div style={S.spinner} />
      <p style={S.loadText}>Loading global cinema…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={S.screen}><p style={{ color: "#ff6b6b" }}>{error}</p></div>
  );

  const avgRating = films.length
    ? (films.reduce((s, f) => s + (parseFloat(f.rating) || 0), 0) / films.length).toFixed(2)
    : null;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .anim-1 { animation: fadeUp 0.5s ease 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s ease 0.12s both; }
        .film-card { transition: border-color 0.2s ease; }
        .poster-img { transition: transform 0.3s ease; }
        .poster-img:hover { transform: scale(1.03); }
        .view-btn:hover { opacity: 0.82 !important; }
      `}</style>

      {/* ── HERO ───────────────────────────────────── */}
      <div style={S.hero} className="anim-1">
        <div style={S.heroInner}>
          <span style={S.label}>GLOBAL CINEMA</span>
          <h1 style={S.title}>Cinema Without Borders</h1>
          <p style={S.subtitle}>
            Five industries. One platform. The best film from each corner of world cinema.
          </p>

          {/* Stat strip */}
          <div style={S.statStrip}>
            <div style={S.stripStat}>
              <span style={S.stripVal}>{films.length}</span>
              <span style={S.stripLabel}>INDUSTRIES</span>
            </div>
            <div style={S.stripDivider} />
            <div style={S.stripStat}>
              <span style={{ ...S.stripVal, color: "#CCFF00" }}>
                {avgRating ? `★ ${avgRating}` : "—"}
              </span>
              <span style={S.stripLabel}>AVG TOP RATING</span>
            </div>
            <div style={S.stripDivider} />
            <div style={S.stripStat}>
              <span style={S.stripVal}>
                {films.reduce((s, f) => s + (f.vote_count ?? 0), 0).toLocaleString()}
              </span>
              <span style={S.stripLabel}>COMBINED VOTES</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INDUSTRY PILLS ─────────────────────────── */}
      <div style={S.pillsRow} className="anim-1">
        <div style={S.pillsInner}>
          {DISPLAY_ORDER.map((ind) => {
            const meta = INDUSTRY_META[ind];
            return (
              <div key={ind} style={{ ...S.pill, borderColor: `${meta.color}33` }}>
                <span>{meta.emoji}</span>
                <span style={{ fontWeight: 700, color: meta.color }}>{ind}</span>
                <span style={S.pillRegion}>{meta.region}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TOP FILM CARDS ─────────────────────────── */}
      <div style={S.body} className="anim-2">
        <div style={S.sectionHead}>
          <span style={S.label}>TOP FILMS</span>
          <h2 style={S.sectionTitle}>Best of Each Industry</h2>
          <p style={S.sectionSub}>
            Highest rated film from each cinema industry in our database
          </p>
        </div>

        <div style={S.cardList}>
          {films.map((film, i) => {
            const meta      = INDUSTRY_META[film.cinema_type] ?? { emoji: "🎬", color: "#CCFF00", region: "", desc: "" };
            const posterUrl = film.poster_path
              ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : null;
            const rating    = parseFloat(film.rating);
            const rColor    = rating >= 8 ? "#CCFF00" : rating >= 7 ? "#f0c040" : "#ff6b6b";

            return (
              <div
                key={film.cinema_type}
                className="film-card"
                style={{
                  ...S.filmCard,
                  borderColor: `${meta.color}20`,
                  animationDelay: `${i * 80}ms`,
                  animation: "fadeUp 0.5s ease both",
                }}
              >
                {/* ── Left: all text ── */}
                <div style={S.filmLeft}>
                  {/* Industry badge */}
                  <div style={S.industryBadge}>
                    <span style={{ fontSize: "1.5rem" }}>{meta.emoji}</span>
                    <div>
                      <span style={{ ...S.industryName, color: meta.color }}>
                        {film.cinema_type}
                      </span>
                      <span style={S.industryRegion}>{meta.region}</span>
                    </div>
                  </div>

                  <p style={S.industryDesc}>{meta.desc}</p>

                  {/* Divider */}
                  <div style={S.divider} />

                  {/* Film info */}
                  <div style={S.filmMeta}>
                    <span style={{ ...S.topFilmTag, color: "rgba(255,255,255,0.25)" }}>
                      TOP FILM
                    </span>
                    <h3 style={S.filmTitle}>{film.title}</h3>

                    {/* Rating + year + votes */}
                    <div style={S.filmStats}>
                      <span style={{ color: rColor, fontWeight: 800, fontSize: "1.3rem" }}>
                        ★ {rating.toFixed(1)}
                      </span>
                      <span style={S.filmPill}>{film.release_year}</span>
                      <span style={S.filmPill}>
                        {(film.vote_count ?? 0).toLocaleString()} votes
                      </span>
                    </div>

                    {/* Overview */}
                    <p style={S.filmOverview}>
                      {film.overview?.length > 200
                        ? film.overview.slice(0, 200) + "…"
                        : film.overview}
                    </p>

                    {/* CTA */}
                    <Link
                      href={`/movies?cinema_type=${encodeURIComponent(film.cinema_type)}`}
                      className="view-btn"
                      style={{ ...S.browseBtn, backgroundColor: meta.color }}
                    >
                      Browse {film.cinema_type} →
                    </Link>
                  </div>
                </div>

                {/* ── Right: poster ── */}
                {posterUrl && (
                  <div style={S.posterWrapper}>
                    <img
                      src={posterUrl}
                      alt={film.title}
                      className="poster-img"
                      style={S.poster}
                    />
                    {/* Rank badge */}
                    <div style={{ ...S.rankBadge, backgroundColor: meta.color }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#000" }}>
                        #{i + 1}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: "80px" }} />
    </div>
  );
}

const S = {
  page:     { backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" },
  screen:   { backgroundColor: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" },
  spinner:  { width: "40px", height: "40px", border: "3px solid rgba(204,255,0,0.15)", borderTop: "3px solid #CCFF00", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadText: { color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", letterSpacing: "0.1em", margin: 0 },
  label:    { fontSize: "0.67rem", letterSpacing: "0.18em", fontWeight: 700, color: "#CCFF00", textTransform: "uppercase" },

  /* Hero */
  hero:      { borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "120px 32px 56px" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" },
  title:     { fontSize: "clamp(2.4rem,6vw,4rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  subtitle:  { color: "rgba(255,255,255,0.35)", fontSize: "1rem", margin: 0, maxWidth: "520px", lineHeight: 1.6 },

  statStrip:   { display: "flex", alignItems: "center", gap: "0", marginTop: "8px", backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "18px 0", width: "fit-content" },
  stripStat:   { display: "flex", flexDirection: "column", gap: "4px", padding: "0 28px" },
  stripVal:    { fontSize: "1.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" },
  stripLabel:  { fontSize: "0.58rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", fontWeight: 700 },
  stripDivider:{ width: "1px", height: "36px", backgroundColor: "rgba(255,255,255,0.07)" },

  /* Pills row */
  pillsRow:   { borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px" },
  pillsInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "0", overflowX: "auto" },
  pill:       { display: "flex", alignItems: "center", gap: "10px", padding: "18px 28px", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, border: "none", borderBottom: "none" },
  pillRegion: { fontSize: "0.72rem", color: "rgba(255,255,255,0.28)" },

  /* Body */
  body:        { maxWidth: "1200px", margin: "0 auto", padding: "60px 32px 0", boxSizing: "border-box" },
  sectionHead: { marginBottom: "32px", display: "flex", flexDirection: "column", gap: "6px" },
  sectionTitle:{ fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" },
  sectionSub:  { color: "rgba(255,255,255,0.3)", fontSize: "0.83rem", margin: 0 },

  /* Film cards */
  cardList: { display: "flex", flexDirection: "column", gap: "20px" },
  filmCard: { backgroundColor: "#0a0a0a", border: "1px solid", borderRadius: "16px", overflow: "hidden", display: "flex", alignItems: "stretch" },

  /* Left */
  filmLeft:      { flex: 1, padding: "36px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 },
  industryBadge: { display: "flex", gap: "12px", alignItems: "center" },
  industryName:  { display: "block", fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" },
  industryRegion:{ display: "block", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "2px" },
  industryDesc:  { fontSize: "0.82rem", color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.6 },
  divider:       { height: "1px", backgroundColor: "rgba(255,255,255,0.06)" },

  filmMeta:    { display: "flex", flexDirection: "column", gap: "10px" },
  topFilmTag:  { fontSize: "0.6rem", letterSpacing: "0.16em", fontWeight: 700, textTransform: "uppercase" },
  filmTitle:   { fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 },
  filmStats:   { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  filmPill:    { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "3px 12px", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" },
  filmOverview:{ fontSize: "0.85rem", lineHeight: 1.75, color: "rgba(255,255,255,0.45)", margin: 0, maxWidth: "560px" },
  browseBtn:   { display: "inline-flex", alignItems: "center", color: "#000", fontWeight: 700, fontSize: "0.82rem", padding: "10px 22px", borderRadius: "999px", textDecoration: "none", letterSpacing: "0.02em", width: "fit-content", marginTop: "4px", transition: "opacity 0.2s" },

  /* Right: poster */
  posterWrapper: { position: "relative", width: "180px", flexShrink: 0, overflow: "hidden", backgroundColor: "#111" },
  poster:        { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" },
  rankBadge:     { position: "absolute", top: "12px", right: "12px", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
};