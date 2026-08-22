"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API_BASE = "https://obscura-backend-k2ph.onrender.com/api";

export default function MovieDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    axios
      .get(`${API_BASE}/movies/${id}`)
      .then((res) => {
        setMovie(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Movie not found or server error.");
        setLoading(false);
      });
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={S.loadingScreen}>
        <div style={S.spinner} />
        <p style={S.loadingText}>Loading film data…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div style={S.loadingScreen}>
        <p style={{ color: "#fff" }}>{error ?? "No data."}</p>
        <button onClick={() => router.back()} style={S.backBtn}>← Go Back</button>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  const cast       = Array.isArray(movie.cast)      ? movie.cast      : [];
  const directors  = Array.isArray(movie.directors) ? movie.directors : [];
  const genres     = Array.isArray(movie.genres)    ? movie.genres    : [];

  const ratingColor =
    movie.rating >= 7.5 ? "#CCFF00" : movie.rating >= 6 ? "#f0c040" : "#ff6b6b";

  const ratingVsGenre = movie.genre_avg_rating != null
    ? (movie.rating - movie.genre_avg_rating).toFixed(2)
    : null;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .anim-1 { animation: fadeUp 0.5s ease 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s ease 0.15s both; }
        .anim-3 { animation: fadeUp 0.5s ease 0.25s both; }
        .anim-4 { animation: fadeUp 0.5s ease 0.35s both; }
        .back-btn:hover  { background: rgba(255,255,255,0.13) !important; }
        .genre-tag:hover { background: rgba(204,255,0,0.18) !important; border-color: rgba(204,255,0,0.5) !important; }
        .cast-row:hover  { background: rgba(204,255,0,0.04) !important; }
      `}</style>

      {/* ════════════════════════════════════════
          HERO — backdrop + poster + key info
      ════════════════════════════════════════ */}
      <div style={S.heroWrapper}>
        {backdropUrl && !imgError
          ? <img src={backdropUrl} alt="" style={S.backdropImg}
              onError={() => setImgError(true)} />
          : <div style={S.backdropFallback} />
        }
        <div style={S.backdropOverlay} />

        <div style={S.heroContent} className="anim-1">
          {/* Back */}
          <button className="back-btn" onClick={() => router.back()} style={S.backBtn}>
            ← Back
          </button>

          <div style={S.heroBody}>
            {/* Poster */}
            {posterUrl && (
              <div style={S.posterWrapper}>
                <img src={posterUrl} alt={movie.title} style={S.posterImg} />
              </div>
            )}

            {/* Info */}
            <div style={S.heroInfo}>
              {movie.cinema_type && (
                <span style={S.cinemaBadge}>{movie.cinema_type.toUpperCase()}</span>
              )}

              <h1 style={S.title}>{movie.title}</h1>

              {movie.original_title && movie.original_title !== movie.title && (
                <p style={S.originalTitle}>{movie.original_title}</p>
              )}

              {/* Rating + year + language */}
              <div style={S.metaRow}>
                <span style={{ ...S.ratingBig, color: ratingColor }}>
                  ★ {movie.rating ? parseFloat(movie.rating).toFixed(1) : "N/A"}
                </span>
                {movie.release_year && (
                  <span style={S.metaPill}>{movie.release_year}</span>
                )}
                {movie.original_language && (
                  <span style={S.metaPill}>{movie.original_language.toUpperCase()}</span>
                )}
                {movie.vote_count && (
                  <span style={S.votesText}>
                    {Number(movie.vote_count).toLocaleString()} votes
                  </span>
                )}
              </div>

              {/* Genre avg comparison bar */}
              {movie.genre_avg_rating != null && (
                <div style={S.genreCompRow}>
                  <span style={S.dimText}>vs genre avg</span>
                  <div style={S.compBarTrack}>
                    <div style={{
                      ...S.compBarFill,
                      width: `${Math.min(100, Math.abs((movie.rating / movie.genre_avg_rating - 1) * 100 * 5))}%`,
                      backgroundColor: ratingVsGenre >= 0 ? "#CCFF00" : "#ff6b6b",
                    }} />
                  </div>
                  <span style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: ratingVsGenre >= 0 ? "#CCFF00" : "#ff6b6b",
                  }}>
                    {ratingVsGenre >= 0 ? "+" : ""}{ratingVsGenre}
                  </span>
                </div>
              )}

              {/* Overview — short teaser in hero */}
              {movie.overview && (
                <p style={S.overviewHero}>
                  {movie.overview.length > 200
                    ? movie.overview.slice(0, 200) + "…"
                    : movie.overview}
                </p>
              )}

              {/* Director mini-chip */}
              {directors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={S.label}>DIRECTED BY</span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {directors.map((d, i) => (
                      <Link
                        key={i}
                        href={d.tmdb_person_id ? `/directors/${d.tmdb_person_id}` : "#"}
                        style={S.dirChip}
                      >
                        {d.profile_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${d.profile_path}`}
                            alt={d.name}
                            style={S.dirThumb}
                          />
                        )}
                        <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#fff" }}>
                          {d.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          STORYLINE & GENRES
      ════════════════════════════════════════ */}
      {(movie.overview || genres.length > 0) && (
        <section style={S.section} className="anim-2">
          <div style={S.sectionHead}>
            <span style={S.label}></span>  
            <h2 style={S.sectionTitle}>About this Film</h2>
          </div>

          <div style={S.storylineCard}>
            {/* Full overview */}
            {movie.overview && (
              <p style={S.overviewFull}>{movie.overview}</p>
            )}

            {/* Divider */}
            {movie.overview && genres.length > 0 && (
              <div style={S.divider} />
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div style={S.genreBlock}>
                <span style={{ ...S.label, marginBottom: "10px", display: "block" }}>GENRES</span>
                <div style={S.genreTags}>
                  {genres.map((g, i) => (
                    <span key={i} className="genre-tag" style={S.genreTag}>
                      {typeof g === "object" ? g.name : g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          MOVIE STATS — 4 cards
      ════════════════════════════════════════ */}
      <section style={S.section} className="anim-3">
        <div style={S.sectionHead}>
          <span style={S.label}>BY THE NUMBERS</span>
          <h2 style={S.sectionTitle}>Film Analytics</h2>
        </div>

        <div style={S.statsGrid}>
          {/* Rating card */}
          <div style={S.statCard}>
            <span style={S.statIcon}>★</span>
            <span style={{ ...S.statValue, color: ratingColor }}>
              {movie.rating ? parseFloat(movie.rating).toFixed(1) : "—"}
            </span>
            <span style={S.statLabel}>TMDB Rating</span>
            {movie.genre_avg_rating != null && (
              <span style={S.statSub}>
                Genre avg: {parseFloat(movie.genre_avg_rating).toFixed(2)}
              </span>
            )}
          </div>

          {/* Vote count card */}
          <div style={S.statCard}>
            <span style={S.statIcon}>🗳</span>
            <span style={S.statValue}>
              {movie.vote_count
                ? Number(movie.vote_count).toLocaleString()
                : "—"}
            </span>
            <span style={S.statLabel}>Total Votes</span>
            <span style={S.statSub}>Community reviews</span>
          </div>

          {/* Popularity card */}
          <div style={S.statCard}>
            <span style={S.statIcon}>📈</span>
            <span style={S.statValue}>
              {movie.popularity
                ? parseFloat(movie.popularity).toFixed(1)
                : "—"}
            </span>
            <span style={S.statLabel}>Popularity Score</span>
            <span style={S.statSub}>TMDB metric</span>
          </div>

          {/* Language / Region card */}
          <div style={S.statCard}>
            <span style={S.statIcon}>🌍</span>
            <span style={S.statValue}>
              {movie.original_language
                ? movie.original_language.toUpperCase()
                : "—"}
            </span>
            <span style={S.statLabel}>Original Language</span>
            <span style={S.statSub}>
              {movie.region || movie.cinema_type || "Global"}
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FULL CAST TABLE
      ════════════════════════════════════════ */}
      {cast.length > 0 && (
        <section style={S.section} className="anim-4">
          <div style={S.sectionHead}>
            <span style={S.label}>CAST</span>
            <h2 style={S.sectionTitle}>Full Cast</h2>
            <p style={S.sectionSub}>{cast.length} actors in this film</p>
          </div>

          <div style={S.tableBox}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: "52px" }}>#</th>
                  <th style={{ ...S.th, width: "52px" }}>Photo</th>
                  <th style={S.th}>Actor</th>
                  <th style={S.th}>Character</th>
                </tr>
              </thead>
              <tbody>
                {cast.map((actor, i) => (
                  <tr
                    key={i}
                    className="cast-row"
                    style={S.tr}
                  >
                    <td style={S.tdRank}>{i + 1}</td>
                    <td style={{ padding: "10px 20px" }}>
                      {actor.profile_path
                        ? <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            style={S.actorThumb}
                          />
                        : <div style={S.actorFallback}>
                            {actor.name?.[0] ?? "?"}
                          </div>
                      }
                    </td>
                    <td style={S.tdName}>{actor.name}</td>
                    <td style={S.tdChar}>
                      {actor.character_name
                        || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div style={{ height: "80px" }} />
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const S = {
  page: {
    backgroundColor: "#000",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
  },

  /* Loading */
  loadingScreen: {
    backgroundColor: "#000", minHeight: "100vh",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "16px",
  },
  spinner: {
    width: "40px", height: "40px",
    border: "3px solid rgba(204,255,0,0.15)",
    borderTop: "3px solid #CCFF00",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "rgba(255,255,255,0.4)", fontSize: "0.85rem",
    letterSpacing: "0.1em", margin: 0,
  },

  /* Shared */
  label: {
    fontSize: "0.67rem", letterSpacing: "0.18em",
    fontWeight: 700, color: "#CCFF00", textTransform: "uppercase",
  },
  dimText: { color: "rgba(255,255,255,0.32)", fontSize: "0.8rem" },

  backBtn: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.13)",
    color: "#fff", padding: "8px 18px", borderRadius: "999px",
    fontSize: "0.84rem", cursor: "pointer", marginBottom: "32px",
    outline: "none", transition: "background 0.2s",
  },

  /* Hero */
  heroWrapper: {
    position: "relative", width: "100%",
    minHeight: "90vh", display: "flex", flexDirection: "column",
  },
  backdropImg: {
    position: "absolute", inset: 0,
    width: "100%", height: "100%",
    objectFit: "cover", objectPosition: "center top", opacity: 0.32,
  },
  backdropFallback: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg,#0a0a0a 0%,#111 100%)",
  },
  backdropOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.5) 35%,rgba(0,0,0,0.93) 78%,#000 100%)",
  },
  heroContent: {
    position: "relative", zIndex: 2,
    maxWidth: "1200px", margin: "0 auto",
    padding: "120px 32px 64px",
    width: "100%", boxSizing: "border-box",
  },
  heroBody: {
    display: "flex", gap: "48px",
    alignItems: "flex-start", flexWrap: "wrap",
  },

  /* Poster */
  posterWrapper: {
    flexShrink: 0, borderRadius: "12px", overflow: "hidden",
    boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)",
  },
  posterImg: { width: "220px", display: "block" },

  /* Hero info */
  heroInfo: {
    flex: 1, minWidth: "280px",
    display: "flex", flexDirection: "column", gap: "16px",
  },
  cinemaBadge: {
    display: "inline-block",
    backgroundColor: "rgba(204,255,0,0.1)",
    border: "1px solid rgba(204,255,0,0.26)",
    color: "#CCFF00", fontSize: "0.67rem",
    letterSpacing: "0.16em", fontWeight: 700,
    padding: "4px 12px", borderRadius: "999px", width: "fit-content",
  },
  title: {
    fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800,
    lineHeight: 1.1, margin: 0, letterSpacing: "-0.02em",
  },
  originalTitle: {
    color: "rgba(255,255,255,0.36)", fontSize: "1rem",
    margin: 0, fontStyle: "italic",
  },
  metaRow: {
    display: "flex", alignItems: "center",
    gap: "12px", flexWrap: "wrap",
  },
  ratingBig: { fontSize: "1.5rem", fontWeight: 800 },
  metaPill: {
    backgroundColor: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.62)", fontSize: "0.77rem",
    padding: "4px 12px", borderRadius: "999px",
    fontWeight: 600, letterSpacing: "0.05em",
  },
  votesText: { color: "rgba(255,255,255,0.28)", fontSize: "0.77rem" },

  /* Genre comparison bar */
  genreCompRow: {
    display: "flex", alignItems: "center", gap: "10px",
  },
  compBarTrack: {
    flex: 1, maxWidth: "160px", height: "4px",
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden",
  },
  compBarFill: {
    height: "100%", borderRadius: "999px",
    transition: "width 0.6s ease",
  },

  overviewHero: {
    fontSize: "0.93rem", lineHeight: 1.78,
    color: "rgba(255,255,255,0.58)", maxWidth: "620px", margin: 0,
  },

  /* Director chip */
  dirChip: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "999px", padding: "6px 16px 6px 8px",
    textDecoration: "none", cursor: "pointer",
  },
  dirThumb: {
    width: "28px", height: "28px",
    borderRadius: "50%", objectFit: "cover",
  },

  /* Sections */
  section: {
    maxWidth: "1200px", margin: "0 auto",
    padding: "60px 32px 0", boxSizing: "border-box",
  },
  sectionHead: {
    marginBottom: "24px",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  sectionTitle: {
    fontSize: "1.75rem", fontWeight: 800,
    margin: 0, letterSpacing: "-0.02em",
  },
  sectionSub: {
    color: "rgba(255,255,255,0.3)", fontSize: "0.83rem", margin: 0,
  },

  /* Storyline card */
  storylineCard: {
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px", padding: "32px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  overviewFull: {
    fontSize: "1rem", lineHeight: 1.85,
    color: "rgba(255,255,255,0.7)", margin: 0,
  },
  divider: {
    height: "1px",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  genreBlock: {
    display: "flex", flexDirection: "column",
  },
  genreTags: {
    display: "flex", gap: "10px", flexWrap: "wrap",
  },
  genreTag: {
    backgroundColor: "rgba(204,255,0,0.08)",
    border: "1px solid rgba(204,255,0,0.2)",
    color: "#CCFF00", fontSize: "0.8rem",
    padding: "6px 16px", borderRadius: "999px",
    fontWeight: 600, letterSpacing: "0.06em",
    cursor: "default", transition: "background 0.2s, border-color 0.2s",
  },

  /* Stats grid */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px", padding: "28px 24px",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  statIcon: { fontSize: "1.4rem", marginBottom: "4px" },
  statValue: {
    fontSize: "2rem", fontWeight: 800,
    letterSpacing: "-0.02em", color: "#fff",
  },
  statLabel: {
    fontSize: "0.67rem", letterSpacing: "0.14em",
    fontWeight: 700, color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
  },
  statSub: {
    fontSize: "0.78rem", color: "rgba(255,255,255,0.28)",
    marginTop: "2px",
  },

  /* Cast table */
  tableBox: {
    overflowX: "auto", borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.07)",
    backgroundColor: "#0a0a0a",
  },
  table: {
    width: "100%", borderCollapse: "collapse", fontSize: "0.87rem",
  },
  th: {
    textAlign: "left", padding: "14px 20px",
    fontSize: "0.66rem", letterSpacing: "0.13em",
    fontWeight: 700, color: "rgba(255,255,255,0.28)",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.15s",
  },
  tdRank: {
    padding: "14px 20px", color: "rgba(255,255,255,0.17)",
    fontWeight: 700, fontSize: "0.77rem",
  },
  tdName: { padding: "14px 20px", fontWeight: 600, color: "#fff" },
  tdChar: {
    padding: "14px 20px",
    color: "rgba(255,255,255,0.4)", fontStyle: "italic",
  },
  actorThumb: {
    width: "34px", height: "34px", borderRadius: "50%",
    objectFit: "cover", display: "block",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  actorFallback: {
    width: "34px", height: "34px", borderRadius: "50%",
    backgroundColor: "rgba(204,255,0,0.1)",
    border: "1px solid rgba(204,255,0,0.17)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#CCFF00", fontWeight: 700, fontSize: "0.84rem",
  },
};