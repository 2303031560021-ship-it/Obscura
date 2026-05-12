"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import axios from "axios";

const API_BASE = "https://obscura-backend-sued.onrender.com/api";
const LIMIT = 24;
const CINEMA_TYPES = ["All", "Hollywood", "Bollywood", "Korean", "Japanese", "French"];

const scoreColor = (s) => {
  if (!s) return "rgba(255,255,255,0.3)";
  const n = parseFloat(s);
  if (n >= 7) return "#CCFF00";
  if (n >= 5) return "#f0c040";
  return "#ff6b6b";
};

export default function DirectorsPage() {
  const [directors,  setDirectors]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [cinema,     setCinema]     = useState("All");
  const [offset,     setOffset]     = useState(0);
  const [hasMore,    setHasMore]    = useState(true);
  const [total,      setTotal]      = useState(null);

  const debounceRef = useRef(null);

  // ── Core fetch — takes explicit params, no stale closure ──────────
  const doFetch = async ({ searchVal, cinemaVal, offsetVal, reset }) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = { limit: LIMIT, offset: offsetVal };
      if (searchVal.trim())     params.search      = searchVal.trim();
      if (cinemaVal !== "All")  params.cinema_type = cinemaVal;

      const res  = await axios.get(`${API_BASE}/directors`, { params });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data.directors ?? []);
      const count = data.total ?? null;

      if (reset) {
        setDirectors(list);
        setOffset(LIMIT);
      } else {
        setDirectors((prev) => [...prev, ...list]);
        setOffset((prev) => prev + LIMIT);
      }

      if (count !== null) setTotal(count);
      setHasMore(list.length === LIMIT);
    } catch {
      setError("Failed to load directors.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ── Re-fetch from scratch whenever search or cinema changes ───────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch({ searchVal: search, cinemaVal: cinema, offsetVal: 0, reset: true });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, cinema]);

  // ── Load more uses current state values at call time ──────────────
  const handleLoadMore = () => {
    doFetch({ searchVal: search, cinemaVal: cinema, offsetVal: offset, reset: false });
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dir-card {
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dir-card:hover {
          transform: translateY(-5px);
          border-color: rgba(204,255,0,0.28) !important;
          box-shadow: 0 18px 44px rgba(0,0,0,0.55), 0 0 0 1px rgba(204,255,0,0.1) !important;
        }
        .fpill { transition: background 0.15s, color 0.15s, border-color 0.15s; cursor: pointer; }
        .fpill:hover { border-color: rgba(204,255,0,0.4) !important; color: #CCFF00 !important; }
        .lmore:hover { background: rgba(204,255,0,0.1) !important; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────── */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <span style={S.label}>DIRECTORS</span>
          <h1 style={S.pageTitle}>The Visionaries</h1>
          <p style={S.pageSubtitle}>
            {total !== null
              ? `${total.toLocaleString()} directors across Hollywood, Bollywood, Korean, Japanese & French cinema`
              : "Explore directors across global cinema"}
          </p>
        </div>
      </div>

      {/* ── SEARCH + FILTER ──────────────────────────── */}
      <div style={S.controls}>
        <div style={S.controlsInner}>
          {/* Search */}
          <div style={S.searchBox}>
            <span style={{ opacity: 0.45, fontSize: "0.9rem" }}>🔍</span>
            <input
              type="text"
              placeholder="Search directors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={S.searchInput}
            />
            {search && (
              <button onClick={() => setSearch("")} style={S.clearBtn}>✕</button>
            )}
          </div>

          {/* Cinema pills */}
          <div style={S.pillRow}>
            {CINEMA_TYPES.map((c) => (
              <button
                key={c}
                className="fpill"
                onClick={() => setCinema(c)}
                style={{ ...S.pill, ...(cinema === c ? S.pillActive : {}) }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────── */}
      <div style={S.gridWrapper}>

        {error && (
          <p style={{ color: "#ff6b6b", textAlign: "center", padding: "60px 0" }}>{error}</p>
        )}

        {/* Skeleton */}
        {loading && !error && (
          <div style={S.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={S.skeleton} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && directors.length === 0 && (
          <div style={S.empty}>
            <p style={{ fontSize: "2.5rem", margin: 0 }}>🎬</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>No directors found</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", margin: 0 }}>
              Try a different name or industry
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && directors.length > 0 && (
          <>
            <div style={S.grid}>
              {directors.map((dir, i) => {
                const score   = dir.success_score ?? dir.score ?? null;
                const avgRat  = dir.avg_rating ?? null;
                const films   = dir.total_films ?? dir.film_count ?? null;
                const photoUrl = dir.profile_path
                  ? `https://image.tmdb.org/t/p/w185${dir.profile_path}` : null;

                return (
                  <Link
                    key={`${dir.tmdb_person_id}-${i}`}
                    href={`/directors/${dir.tmdb_person_id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="dir-card"
                      style={{
                        ...S.card,
                        animation: `fadeUp 0.4s ease ${(i % LIMIT) * 28}ms both`,
                      }}
                    >
                      {/* Photo */}
                      <div style={S.photoBox}>
                        {photoUrl
                          ? <img
                              src={photoUrl}
                              alt={dir.name}
                              style={S.photo}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          : null
                        }
                        <div style={{
                          ...S.photoFallback,
                          display: photoUrl ? "none" : "flex",
                        }}>
                          {dir.name?.[0] ?? "?"}
                        </div>

                        {/* Score badge */}
                        {score != null && (
                          <div style={{
                            ...S.scoreBadge,
                            color: scoreColor(score),
                            borderColor: scoreColor(score) + "55",
                          }}>
                            {parseFloat(score).toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={S.cardInfo}>
                        <h3 style={S.cardName}>{dir.name}</h3>

                        {dir.place_of_birth && (
                          <p style={S.cardOrigin}>
                            {dir.place_of_birth.split(",").slice(-1)[0].trim()}
                          </p>
                        )}

                        <div style={S.cardStats}>
                          {avgRat != null && (
                            <div style={S.cardStat}>
                              <span style={{ color: "#CCFF00", fontWeight: 700, fontSize: "0.9rem" }}>
                                ★ {parseFloat(avgRat).toFixed(1)}
                              </span>
                              <span style={S.cardStatLabel}>Avg Rating</span>
                            </div>
                          )}
                          {films != null && (
                            <div style={S.cardStat}>
                              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                                {films}
                              </span>
                              <span style={S.cardStatLabel}>Films</span>
                            </div>
                          )}
                        </div>

                        {score != null && (
                          <div style={S.scoreTrack}>
                            <div style={{
                              ...S.scoreFill,
                              width: `${Math.min(100, (parseFloat(score) / 10) * 100)}%`,
                              backgroundColor: scoreColor(score),
                            }} />
                          </div>
                        )}

                        <p style={S.viewProfile}>View Profile →</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "48px" }}>
                <button
                  className="lmore"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={S.loadMoreBtn}
                >
                  {loadingMore ? "Loading…" : "Load More Directors"}
                </button>
              </div>
            )}

            {!hasMore && directors.length > 0 && (
              <p style={{ textAlign: "center", marginTop: "40px", color: "rgba(255,255,255,0.2)", fontSize: "0.82rem" }}>
                Showing all {directors.length} directors
              </p>
            )}
          </>
        )}
      </div>

      <div style={{ height: "80px" }} />
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  page:     { backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" },
  label:    { fontSize: "0.67rem", letterSpacing: "0.18em", fontWeight: 700, color: "#CCFF00", textTransform: "uppercase" },

  hero:      { borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "120px 32px 56px" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" },
  pageTitle: { fontSize: "clamp(2.4rem,6vw,4rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  pageSubtitle: { color: "rgba(255,255,255,0.38)", fontSize: "1rem", margin: 0, maxWidth: "560px", lineHeight: 1.6 },

  controls:      { position: "sticky", top: "64px", zIndex: 10, backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 32px" },
  controlsInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" },

  searchBox:   { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "9px 14px", flex: 1, minWidth: "180px", maxWidth: "300px" },
  searchInput: { background: "none", border: "none", outline: "none", color: "#fff", fontSize: "0.88rem", flex: 1, fontFamily: "Inter, sans-serif" },
  clearBtn:    { background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "0.78rem", padding: 0 },

  pillRow:    { display: "flex", gap: "8px", flexWrap: "wrap" },
  pill:       { backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.48)", padding: "6px 16px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Inter, sans-serif", outline: "none" },
  pillActive: { backgroundColor: "#CCFF00", borderColor: "#CCFF00", color: "#000" },

  gridWrapper: { maxWidth: "1200px", margin: "0 auto", padding: "44px 32px 0", boxSizing: "border-box" },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "18px" },

  card:        { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden", cursor: "pointer" },

  photoBox:     { position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden", backgroundColor: "#111" },
  photo:        { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" },
  photoFallback:{ width: "100%", height: "100%", backgroundColor: "rgba(204,255,0,0.06)", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: 800, color: "#CCFF00" },

  scoreBadge: { position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", border: "1px solid", borderRadius: "8px", padding: "4px 10px", fontSize: "0.78rem", fontWeight: 800 },

  cardInfo:      { padding: "14px 16px", display: "flex", flexDirection: "column", gap: "5px" },
  cardName:      { fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardOrigin:    { fontSize: "0.72rem", color: "rgba(255,255,255,0.28)", margin: 0 },
  cardStats:     { display: "flex", gap: "14px", marginTop: "4px" },
  cardStat:      { display: "flex", flexDirection: "column", gap: "1px" },
  cardStatLabel: { fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" },

  scoreTrack: { height: "3px", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "999px", overflow: "hidden", marginTop: "5px" },
  scoreFill:  { height: "100%", borderRadius: "999px" },
  viewProfile:{ fontSize: "0.72rem", color: "rgba(204,255,0,0.55)", margin: "3px 0 0", fontWeight: 600, letterSpacing: "0.04em" },

  skeleton: { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", aspectRatio: "3/5" },
  empty:    { textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },

  loadMoreBtn: { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "12px 32px", borderRadius: "999px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background 0.2s" },
};