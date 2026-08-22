"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API_BASE = "https://obscura-backend-k2ph.onrender.com/api";

const ratingColor = (r) => {
  if (!r) return "rgba(255,255,255,0.3)";
  const n = parseFloat(r);
  if (n >= 7.5) return "#CCFF00";
  if (n >= 6)   return "#f0c040";
  return "#ff6b6b";
};

export default function DirectorProfilePage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [director, setDirector] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [sortBy,   setSortBy]   = useState("year");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    axios.get(`${API_BASE}/directors/${id}`)
      .then((res) => { setDirector(res.data); setLoading(false); })
      .catch(() => { setError("Director not found."); setLoading(false); });
  }, [id]);

  /* ── Loading ── */
  if (loading) return (
    <div style={S.screen}>
      <div style={S.spinner} />
      <p style={S.loadText}>Loading director profile…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !director) return (
    <div style={S.screen}>
      <p style={{ color: "#fff", fontSize: "1.1rem" }}>{error ?? "No data."}</p>
      <button onClick={() => router.back()} style={S.backBtn}>← Go Back</button>
    </div>
  );

  /* ── Derived data ── */
  const films  = Array.isArray(director.films) ? director.films : [];
  const avgRat = director.avg_rating ?? null;
  const totalF = director.total_films ?? films.length;

  const photoUrl = director.profile_path
    ? `https://image.tmdb.org/t/p/w342${director.profile_path}` : null;

  /* Genre counts */
  const genreMap = {};
  films.forEach((f) => {
    (Array.isArray(f.genres) ? f.genres : []).forEach((g) => {
      const name = typeof g === "object" ? g.name : g;
      if (name) genreMap[name] = (genreMap[name] ?? 0) + 1;
    });
  });
  const genreData = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  /* Best film */
  const bestFilm = films.reduce((best, f) =>
    !best || (parseFloat(f.rating) || 0) > (parseFloat(best.rating) || 0) ? f : best
  , null);

  /* Sorted films */
  const sortedFilms = [...films].sort((a, b) => {
    if (sortBy === "rating")     return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    if (sortBy === "popularity") return (parseFloat(b.popularity) || 0) - (parseFloat(a.popularity) || 0);
    return (b.release_year ?? b.year ?? 0) - (a.release_year ?? a.year ?? 0);
  });

  const BIO_LIMIT = 400;
  const bio = director.biography ?? "";

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .anim-1 { animation: fadeUp 0.5s ease 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s ease 0.12s both; }
        .anim-3 { animation: fadeUp 0.5s ease 0.19s both; }
        .anim-4 { animation: fadeUp 0.5s ease 0.26s both; }
        .back-btn:hover  { background: rgba(255,255,255,0.13) !important; }
        .film-row:hover  { background: rgba(204,255,0,0.04) !important; }
        .sort-btn:hover  { border-color: rgba(204,255,0,0.4) !important; color: #CCFF00 !important; }
        .expand-btn:hover { color: #CCFF00 !important; }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <div style={S.hero} className="anim-1">
        {/* Soft blurred bg */}
        {photoUrl && !imgError && (
          <div style={{ ...S.heroBg, backgroundImage: `url(${photoUrl})` }} />
        )}
        <div style={S.heroBgOverlay} />

        <div style={S.heroInner}>
          <button className="back-btn" onClick={() => router.back()} style={S.backBtn}>
            ← Back
          </button>

          <div style={S.heroBody}>
            {/* Photo */}
            <div style={S.photoRing}>
              {photoUrl && !imgError
                ? <img src={photoUrl} alt={director.name} style={S.photo}
                    onError={() => setImgError(true)} />
                : <div style={S.photoFallback}>{director.name?.[0] ?? "?"}</div>
              }
            </div>

            {/* Info */}
            <div style={S.heroInfo}>
              <span style={S.label}>DIRECTOR</span>
              <h1 style={S.dirName}>{director.name}</h1>

              {/* Origin + birthday */}
              <div style={S.metaRow}>
                {director.place_of_birth && (
                  <span style={S.metaChip}>
                    📍 {director.place_of_birth}
                  </span>
                )}
                {director.birthday && (
                  <span style={S.metaChip}>
                    🎂 {director.birthday.split("-")[0]}
                    {/* show birth year only — cleaner */}
                  </span>
                )}
              </div>

              {/* Key stats row */}
              <div style={S.statRow}>
                <div style={S.statBox}>
                  <span style={{ ...S.statVal, color: "#CCFF00" }}>
                    {avgRat != null ? `★ ${parseFloat(avgRat).toFixed(2)}` : "—"}
                  </span>
                  <span style={S.statLabel}>AVG RATING</span>
                </div>
                <div style={S.statDivider} />
                <div style={S.statBox}>
                  <span style={S.statVal}>{totalF}</span>
                  <span style={S.statLabel}>TOTAL FILMS</span>
                </div>
                <div style={S.statDivider} />
                <div style={S.statBox}>
                  <span style={{ ...S.statVal, fontSize: "1rem", color: "#CCFF00" }}>
                    {bestFilm?.title
                      ? bestFilm.title.length > 18
                        ? bestFilm.title.slice(0, 16) + "…"
                        : bestFilm.title
                      : "—"}
                  </span>
                  <span style={S.statLabel}>BEST FILM</span>
                </div>
                {genreData.length > 0 && (
                  <>
                    <div style={S.statDivider} />
                    <div style={S.statBox}>
                      <span style={{ ...S.statVal, fontSize: "1rem" }}>
                        {genreData[0][0]}
                      </span>
                      <span style={S.statLabel}>TOP GENRE</span>
                    </div>
                  </>
                )}
              </div>

              {/* Biography */}
              {bio && (
                <div>
                  <p style={S.bio}>
                    {bioExpanded ? bio : bio.length > BIO_LIMIT ? bio.slice(0, BIO_LIMIT) + "…" : bio}
                  </p>
                  {bio.length > BIO_LIMIT && (
                    <button
                      className="expand-btn"
                      onClick={() => setBioExpanded(!bioExpanded)}
                      style={S.expandBtn}
                    >
                      {bioExpanded ? "Show less ↑" : "Read more ↓"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ GENRE BREAKDOWN ═══════════════════════════════ */}
      {genreData.length > 0 && (
        <section style={S.section} className="anim-2">
          <div style={S.sectionHead}>
            <span style={S.label}>GENRE PROFILE</span>
            <h2 style={S.sectionTitle}>What This Director Makes</h2>
            <p style={S.sectionSub}>Genre breakdown across all {totalF} films</p>
          </div>

          <div style={S.genreCard}>
            {genreData.map(([genre, count], i) => (
              <div key={i} style={S.genreRow}>
                {/* Rank number */}
                <span style={S.genreRank}>{i + 1}</span>

                {/* Genre name */}
                <span style={S.genreName}>{genre}</span>

                {/* Progress bar */}
                <div style={S.genreBarTrack}>
                  <div style={{
                    ...S.genreBarFill,
                    width: `${(count / genreData[0][1]) * 100}%`,
                    opacity: 1 - i * 0.07,
                  }} />
                </div>

                {/* Count badge */}
                <span style={S.genreCount}>{count} film{count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ FILMOGRAPHY ═══════════════════════════════════ */}
      {sortedFilms.length > 0 && (
        <section style={S.section} className="anim-3">
          <div style={S.sectionHead}>
            <span style={S.label}>FILMOGRAPHY</span>
            <h2 style={S.sectionTitle}>All Films</h2>
            <p style={S.sectionSub}>{sortedFilms.length} films in database</p>
          </div>

          {/* Sort controls */}
          <div style={S.sortRow}>
            <span style={{ fontSize: "0.67rem", letterSpacing: "0.14em", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
              SORT BY
            </span>
            {["year", "rating", "popularity"].map((opt) => (
              <button
                key={opt}
                className="sort-btn"
                onClick={() => setSortBy(opt)}
                style={{ ...S.sortBtn, ...(sortBy === opt ? S.sortBtnActive : {}) }}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>

          <div style={S.tableBox}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: "44px" }}>#</th>
                  <th style={{ ...S.th, width: "52px" }}>Poster</th>
                  <th style={S.th}>Title</th>
                  <th style={S.th}>Year</th>
                  <th style={S.th}>Rating</th>
                  <th style={S.th}>Genres</th>
                  <th style={{ ...S.th, width: "72px" }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedFilms.map((film, i) => {
                  const poster = film.poster_path
                    ? `https://image.tmdb.org/t/p/w92${film.poster_path}` : null;
                  const filmGenres = (Array.isArray(film.genres) ? film.genres : [])
                    .slice(0, 2)
                    .map((g) => typeof g === "object" ? g.name : g);

                  return (
                    <tr key={film.tmdb_id ?? i} className="film-row" style={S.tr}>
                      <td style={S.tdRank}>{i + 1}</td>
                      <td style={{ padding: "10px 16px" }}>
                        {poster
                          ? <img src={poster} alt={film.title} style={S.filmPoster} />
                          : <div style={S.filmPosterFallback}>🎬</div>
                        }
                      </td>
                      <td style={S.tdTitle}>
                        <span style={{ fontWeight: 600, color: "#fff" }}>{film.title}</span>
                        {film.original_title && film.original_title !== film.title && (
                          <span style={S.originalTitle}>{film.original_title}</span>
                        )}
                      </td>
                      <td style={S.tdMeta}>{film.release_year ?? film.year ?? "—"}</td>
                      <td style={S.tdMeta}>
                        <span style={{ color: ratingColor(film.rating), fontWeight: 700 }}>
                          {film.rating ? `★ ${parseFloat(film.rating).toFixed(1)}` : "—"}
                        </span>
                      </td>
                      <td style={S.tdMeta}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {filmGenres.map((g, gi) => (
                            <span key={gi} style={S.filmGenreTag}>{g}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {film.tmdb_id && (
                          <Link href={`/movies/${film.tmdb_id}`} style={S.viewBtn}>
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div style={{ height: "80px" }} />
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  page: { backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" },

  screen: { backgroundColor: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(204,255,0,0.15)", borderTop: "3px solid #CCFF00", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadText: { color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", letterSpacing: "0.1em", margin: 0 },

  label: { fontSize: "0.67rem", letterSpacing: "0.18em", fontWeight: 700, color: "#CCFF00", textTransform: "uppercase" },

  backBtn: { display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)", color: "#fff", padding: "8px 18px", borderRadius: "999px", fontSize: "0.84rem", cursor: "pointer", marginBottom: "32px", outline: "none", transition: "background 0.2s" },

  /* Hero */
  hero: { position: "relative", overflow: "hidden", paddingBottom: "64px" },
  heroBg: { position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center top", filter: "blur(60px) saturate(0.3)", opacity: 0.15, transform: "scale(1.1)" },
  heroBgOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, #000 100%)" },
  heroInner: { position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "120px 32px 0", boxSizing: "border-box" },
  heroBody: { display: "flex", gap: "48px", alignItems: "flex-start", flexWrap: "wrap" },

  photoRing: { flexShrink: 0, borderRadius: "50%", padding: "3px", background: "linear-gradient(135deg, #CCFF00, rgba(204,255,0,0.15))", boxShadow: "0 0 48px rgba(204,255,0,0.12)" },
  photo: { width: "180px", height: "180px", borderRadius: "50%", objectFit: "cover", objectPosition: "center top", display: "block" },
  photoFallback: { width: "180px", height: "180px", borderRadius: "50%", backgroundColor: "rgba(204,255,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", fontWeight: 800, color: "#CCFF00" },

  heroInfo: { flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "18px" },
  dirName: { fontSize: "clamp(2rem,5vw,3.4rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" },

  metaRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  metaChip: { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "999px", padding: "5px 14px", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" },

  /* Stat row */
  statRow: { display: "flex", alignItems: "center", backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 0", width: "fit-content", flexWrap: "wrap" },
  statBox: { display: "flex", flexDirection: "column", gap: "4px", padding: "0 28px" },
  statVal: { fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" },
  statLabel: { fontSize: "0.58rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", fontWeight: 700 },
  statDivider: { width: "1px", height: "36px", backgroundColor: "rgba(255,255,255,0.07)", flexShrink: 0 },

  bio: { fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.52)", maxWidth: "640px", margin: 0 },
  expandBtn: { background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", padding: "4px 0", fontFamily: "Inter, sans-serif", transition: "color 0.2s" },

  /* Sections */
  section: { maxWidth: "1200px", margin: "0 auto", padding: "60px 32px 0", boxSizing: "border-box" },
  sectionHead: { marginBottom: "24px", display: "flex", flexDirection: "column", gap: "6px" },
  sectionTitle: { fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" },
  sectionSub: { color: "rgba(255,255,255,0.3)", fontSize: "0.83rem", margin: 0 },

  /* Genre breakdown */
  genreCard: { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "28px 32px", display: "flex", flexDirection: "column", gap: "16px" },
  genreRow: { display: "flex", alignItems: "center", gap: "16px" },
  genreRank: { fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", width: "20px", textAlign: "right", flexShrink: 0 },
  genreName: { fontSize: "0.9rem", fontWeight: 600, color: "#fff", minWidth: "100px", flexShrink: 0 },
  genreBarTrack: { flex: 1, height: "5px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" },
  genreBarFill: { height: "100%", backgroundColor: "#CCFF00", borderRadius: "999px", transition: "width 0.6s ease" },
  genreCount: { fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", minWidth: "56px", textAlign: "right", flexShrink: 0 },

  /* Sort */
  sortRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" },
  sortBtn: { backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", padding: "6px 16px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "pointer", outline: "none", transition: "all 0.18s" },
  sortBtnActive: { backgroundColor: "#CCFF00", borderColor: "#CCFF00", color: "#000" },

  /* Filmography table */
  tableBox: { overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "#0a0a0a" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.87rem" },
  th: { textAlign: "left", padding: "14px 16px", fontSize: "0.65rem", letterSpacing: "0.13em", fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" },
  tdRank: { padding: "12px 16px", color: "rgba(255,255,255,0.17)", fontWeight: 700, fontSize: "0.77rem" },
  tdTitle: { padding: "12px 16px" },
  tdMeta: { padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" },
  originalTitle: { display: "block", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", fontStyle: "italic", marginTop: "2px" },

  filmPoster: { width: "36px", height: "54px", borderRadius: "4px", objectFit: "cover", display: "block" },
  filmPosterFallback: { width: "36px", height: "54px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" },
  filmGenreTag: { backgroundColor: "rgba(204,255,0,0.07)", border: "1px solid rgba(204,255,0,0.15)", color: "rgba(204,255,0,0.75)", fontSize: "0.68rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 600, whiteSpace: "nowrap" },
  viewBtn: { color: "#CCFF00", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", letterSpacing: "0.04em", whiteSpace: "nowrap" },
};