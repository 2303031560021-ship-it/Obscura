"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = "https://obscura-backend-k2ph.onrender.com/api";

// genre field = cinema industry name in this API
const INDUSTRY_META = {
  Hollywood: { emoji: "🎬", color: "#CCFF00",  desc: "American blockbusters and prestige cinema" },
  French:    { emoji: "🗼", color: "#a29bfe",  desc: "Arthouse, romance and the birthplace of film" },
  Japanese:  { emoji: "⛩️", color: "#60cfff",  desc: "Anime, Ghibli and samurai epics" },
  Korean:    { emoji: "🎌", color: "#ff6b9d",  desc: "Thrillers, drama and global K-cinema" },
  Bollywood: { emoji: "🎭", color: "#ff9f43",  desc: "Dance, drama and India's vibrant film industry" },
};

export default function GenresPage() {
  const router = useRouter();
  const [genres,  setGenres]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/genres`)
      .then((res) => {
        // API returns { genres: [ { genre, avg_rating, avg_popularity, total_movies } ] }
        const data = res.data.genres ?? res.data ?? [];
        // sort by total_movies descending
        data.sort((a, b) => (b.total_movies ?? 0) - (a.total_movies ?? 0));
        setGenres(data);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load genres."); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={S.screen}>
      <div style={S.spinner} />
      <p style={S.loadText}>Loading…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={S.screen}><p style={{ color: "#ff6b6b" }}>{error}</p></div>
  );

  const totalFilms  = genres.reduce((s, g) => s + (g.total_movies ?? 0), 0);
  const topRated    = [...genres].sort((a, b) => parseFloat(b.avg_rating) - parseFloat(a.avg_rating))[0];
  const maxMovies   = genres[0]?.total_movies ?? 1;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .anim-1 { animation: fadeUp 0.5s ease 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s ease 0.15s both; }
        .ind-card {
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
          cursor: pointer;
        }
        .ind-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.6);
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────── */}
      <div style={S.hero} className="anim-1">
        <div style={S.heroInner}>
          <span style={S.label}>GENRES</span>
          <h1 style={S.title}>Explore by Industry</h1>
          <p style={S.subtitle}>
            {genres.length} cinema industries · {totalFilms.toLocaleString()} films in database
          </p>

          {/* Top stat cards */}
          <div style={S.heroCards}>
            <div style={S.heroCard}>
              <span style={S.heroCardLabel}>TOTAL FILMS</span>
              <span style={S.heroCardVal}>{totalFilms.toLocaleString()}</span>
            </div>
            <div style={S.heroCard}>
              <span style={S.heroCardLabel}>HIGHEST RATED</span>
              <span style={{ ...S.heroCardVal, color: "#CCFF00" }}>
                {topRated
                  ? `${INDUSTRY_META[topRated.genre]?.emoji ?? "🎬"} ${topRated.genre}`
                  : "—"}
              </span>
              {topRated && (
                <span style={{ fontSize: "0.82rem", color: "#CCFF00", fontWeight: 700 }}>
                  ★ {parseFloat(topRated.avg_rating).toFixed(2)} avg
                </span>
              )}
            </div>
            <div style={S.heroCard}>
              <span style={S.heroCardLabel}>MOST FILMS</span>
              <span style={S.heroCardVal}>
                {genres[0]
                  ? `${INDUSTRY_META[genres[0].genre]?.emoji ?? "🎬"} ${genres[0].genre}`
                  : "—"}
              </span>
              {genres[0] && (
                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)" }}>
                  {genres[0].total_movies.toLocaleString()} films
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INDUSTRY CARDS ───────────────────────── */}
      <div style={S.body} className="anim-2">
        <div style={S.grid}>
          {genres.map((g, i) => {
            const meta    = INDUSTRY_META[g.genre] ?? { emoji: "🎬", color: "#CCFF00", desc: "" };
            const rating  = parseFloat(g.avg_rating);
            const pop     = parseFloat(g.avg_popularity);
            const rColor  = rating >= 7 ? "#CCFF00" : rating >= 6.5 ? "#f0c040" : "#ff6b6b";

            return (
              <div
                key={i}
                className="ind-card"
                style={{
                  ...S.card,
                  borderColor: `${meta.color}22`,
                  animationDelay: `${i * 60}ms`,
                  animation: "fadeUp 0.5s ease both",
                }}
                onClick={() => router.push(`/movies?cinema_type=${encodeURIComponent(g.genre)}`)}
              >
                {/* Top row */}
                <div style={S.cardHeader}>
                  <span style={S.cardEmoji}>{meta.emoji}</span>
                  <div>
                    <h2 style={{ ...S.cardName, color: meta.color }}>{g.genre}</h2>
                    <p style={S.cardDesc}>{meta.desc}</p>
                  </div>
                </div>

                {/* Stats */}
                <div style={S.cardStats}>
                  <div style={S.stat}>
                    <span style={{ ...S.statVal, color: rColor }}>
                      ★ {rating.toFixed(2)}
                    </span>
                    <span style={S.statLabel}>AVG RATING</span>
                  </div>
                  <div style={S.statDivider} />
                  <div style={S.stat}>
                    <span style={S.statVal}>
                      {(g.total_movies ?? 0).toLocaleString()}
                    </span>
                    <span style={S.statLabel}>TOTAL FILMS</span>
                  </div>
                  <div style={S.statDivider} />
                  <div style={S.stat}>
                    <span style={S.statVal}>{pop.toFixed(1)}</span>
                    <span style={S.statLabel}>AVG POPULARITY</span>
                  </div>
                </div>

                {/* Film count bar */}
                <div style={S.barTrack}>
                  <div style={{
                    ...S.barFill,
                    width: `${((g.total_movies ?? 0) / maxMovies) * 100}%`,
                    backgroundColor: meta.color,
                  }} />
                </div>

                <p style={{ ...S.cardCta, color: meta.color + "99" }}>
                  Browse {g.genre} films →
                </p>
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
  page:      { backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" },
  screen:    { backgroundColor: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" },
  spinner:   { width: "40px", height: "40px", border: "3px solid rgba(204,255,0,0.15)", borderTop: "3px solid #CCFF00", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadText:  { color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", letterSpacing: "0.1em", margin: 0 },
  label:     { fontSize: "0.67rem", letterSpacing: "0.18em", fontWeight: 700, color: "#CCFF00", textTransform: "uppercase" },

  hero:      { borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "120px 32px 56px" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" },
  title:     { fontSize: "clamp(2.4rem,6vw,4rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  subtitle:  { color: "rgba(255,255,255,0.35)", fontSize: "1rem", margin: 0 },

  heroCards: { display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap" },
  heroCard:  { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "18px 24px", display: "flex", flexDirection: "column", gap: "4px" },
  heroCardLabel: { fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700, textTransform: "uppercase" },
  heroCardVal:   { fontSize: "1.1rem", fontWeight: 800, color: "#fff" },

  body:      { maxWidth: "1200px", margin: "0 auto", padding: "48px 32px 0", boxSizing: "border-box" },
  grid:      { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" },

  card:      { backgroundColor: "#0a0a0a", border: "1px solid", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" },
  cardHeader:{ display: "flex", gap: "16px", alignItems: "flex-start" },
  cardEmoji: { fontSize: "2.2rem", lineHeight: 1, flexShrink: 0 },
  cardName:  { fontSize: "1.4rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" },
  cardDesc:  { fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", margin: "4px 0 0" },

  cardStats: { display: "flex", alignItems: "center", gap: "0" },
  stat:      { display: "flex", flexDirection: "column", gap: "3px", flex: 1 },
  statVal:   { fontSize: "1.1rem", fontWeight: 800, color: "#fff" },
  statLabel: { fontSize: "0.58rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", fontWeight: 700, textTransform: "uppercase" },
  statDivider: { width: "1px", height: "32px", backgroundColor: "rgba(255,255,255,0.07)", flexShrink: 0, margin: "0 16px" },

  barTrack:  { height: "3px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" },
  barFill:   { height: "100%", borderRadius: "999px" },
  cardCta:   { fontSize: "0.76rem", fontWeight: 600, margin: 0, letterSpacing: "0.04em" },
};