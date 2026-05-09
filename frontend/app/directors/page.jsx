"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import axios from "axios";

const API_BASE = "http://127.0.0.1:5000/api";

const CINEMA_TYPES = ["All", "Hollywood", "Bollywood", "Korean", "Japanese", "French"];

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='185' height='185'%3E%3Crect width='185' height='185' fill='%230a0a0a'/%3E%3C/svg%3E";

export default function DirectorsPage() {
  const [directors, setDirectors]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const [cinema, setCinema]           = useState("All");
  const [offset, setOffset]           = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  const [total, setTotal]             = useState(null);

  const LIMIT = 24;
  const debounceRef = useRef(null);

  // ── Fetch directors ──────────────────────────────────────────────
  const fetchDirectors = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        limit: LIMIT,
        offset: currentOffset,
      };
      if (search.trim())       params.search    = search.trim();
      if (cinema !== "All")    params.cinema_type = cinema;

      const res = await axios.get(`${API_BASE}/directors`, { params });
      const data = res.data;

      // API may return { directors: [], total: N } or just []
      const list  = Array.isArray(data) ? data : (data.directors ?? []);
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
  }, [search, cinema, offset]);

  // Initial load + reset on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDirectors(true);
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, cinema]);

  const handleLoadMore = () => fetchDirectors(false);

  // ── Score color ──────────────────────────────────────────────────
  const scoreColor = (s) => {
    if (!s) return "rgba(255,255,255,0.3)";
    const n = parseFloat(s);
    if (n >= 7)  return "#CCFF00";
    if (n >= 5)  return "#f0c040";
    return "#ff6b6b";
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dir-card {
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .dir-card:hover {
          transform: translateY(-6px) !important;
          border-color: rgba(204,255,0,0.28) !important;
          box-shadow: 0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(204,255,0,0.12) !important;
        }
        .filter-pill {
          transition: background 0.18s, color 0.18s, border-color 0.18s;
          cursor: pointer;
        }
        .filter-pill:hover {
          border-color: rgba(204,255,0,0.4) !important;
          color: #CCFF00 !important;
        }
        .load-more:hover {
          background: rgba(204,255,0,0.12) !important;
        }
      `}</style>

      {/* ── PAGE HERO ─────────────────────────────────── */}
      <div style={S.pageHero}>
        <div style={S.pageHeroInner}>
          <span style={S.label}>DIRECTORS</span>
          <h1 style={S.pageTitle}>The Visionaries</h1>
          <p style={S.pageSubtitle}>
            {total !== null
              ? `${total.toLocaleString()} directors across Hollywood, Bollywood, Korean, Japanese & French cinema`
              : "Explore directors across global cinema — ranked by our custom success score"}
          </p>
        </div>
      </div>

      {/* ── SEARCH + FILTERS ──────────────────────────── */}
      <div style={S.controlsWrapper}>
        <div style={S.controlsInner}>

          {/* Search */}
          <div style={S.searchBox}>
            <span style={S.searchIcon}>🔍</span>
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

          {/* Cinema type pills */}
          <div style={S.pillRow}>
            {CINEMA_TYPES.map((c) => (
              <button
                key={c}
                className="filter-pill"
                onClick={() => setCinema(c)}
                style={{
                  ...S.filterPill,
                  ...(cinema === c ? S.filterPillActive : {}),
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────── */}
      <div style={S.gridWrapper}>

        {/* Error */}
        {error && (
          <p style={{ color: "#ff6b6b", textAlign: "center", padding: "60px 0" }}>
            {error}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div style={S.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={S.skeleton} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && directors.length === 0 && (
          <div style={S.emptyState}>
            <p style={S.emptyIcon}>🎬</p>
            <p style={S.emptyText}>No directors found</p>
            <p style={S.emptyHint}>Try a different name or cinema type</p>
          </div>
        )}

        {/* Director cards */}
        {!loading && !error && directors.length > 0 && (
          <>
            <div style={S.grid}>
              {directors.map((dir, i) => {
                const score    = dir.success_score ?? dir.score ?? null;
                const avgRat   = dir.avg_rating    ?? null;
                const films    = dir.total_films   ?? dir.film_count ?? null;
                const photoUrl = dir.profile_path
                  ? `https://image.tmdb.org/t/p/w185${dir.profile_path}`
                  : null;

                return (
                  <Link
                    key={dir.tmdb_person_id ?? i}
                    href={`/directors/${dir.tmdb_person_id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="dir-card"
                      style={{
                        ...S.card,
                        animationDelay: `${(i % 24) * 30}ms`,
                        animation: "fadeUp 0.4s ease both",
                      }}
                    >
                      {/* Photo */}
                      <div style={S.photoWrapper}>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={dir.name}
                            style={S.photo}
                            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                          />
                        ) : null}
                        <div style={{
                          ...S.photoFallback,
                          display: photoUrl ? "none" : "flex",
                        }}>
                          {dir.name?.[0] ?? "?"}
                        </div>

                        {/* Score badge top-right */}
                        {score != null && (
                          <div style={{
                            ...S.scoreBadge,
                            color: scoreColor(score),
                            borderColor: scoreColor(score) + "44",
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

                        {/* Stats row */}
                        <div style={S.cardStats}>
                          {avgRat != null && (
                            <div style={S.cardStat}>
                              <span style={{ color: "#CCFF00", fontWeight: 700 }}>
                                ★ {parseFloat(avgRat).toFixed(1)}
                              </span>
                              <span style={S.cardStatLabel}>Avg Rating</span>
                            </div>
                          )}
                          {films != null && (
                            <div style={S.cardStat}>
                              <span style={{ color: "#fff", fontWeight: 700 }}>{films}</span>
                              <span style={S.cardStatLabel}>Films</span>
                            </div>
                          )}
                        </div>

                        {/* Success score bar */}
                        {score != null && (
                          <div style={S.scoreBarTrack}>
                            <div style={{
                              ...S.scoreBarFill,
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

            {/* Load more */}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "48px" }}>
                <button
                  className="load-more"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={S.loadMoreBtn}
                >
                  {loadingMore ? "Loading…" : "Load More Directors"}
                </button>
              </div>
            )}

            {/* End of results */}
            {!hasMore && directors.length > 0 && (
              <p style={S.endText}>
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

/* ─── Styles ──────────────────────────────────────────────────── */
const S = {
  page: {
    backgroundColor: "#000",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
  },

  label: {
    fontSize: "0.67rem", letterSpacing: "0.18em",
    fontWeight: 700, color: "#CCFF00", textTransform: "uppercase",
  },

  /* Page hero */
  pageHero: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "120px 32px 56px",
  },
  pageHeroInner: {
    maxWidth: "1200px", margin: "0 auto",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  pageTitle: {
    fontSize: "clamp(2.4rem,6vw,4rem)",
    fontWeight: 800, margin: 0, letterSpacing: "-0.03em",
  },
  pageSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "1rem", margin: 0, maxWidth: "560px", lineHeight: 1.6,
  },

  /* Controls */
  controlsWrapper: {
    position: "sticky", top: "64px", zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    padding: "16px 32px",
  },
  controlsInner: {
    maxWidth: "1200px", margin: "0 auto",
    display: "flex", gap: "16px",
    alignItems: "center", flexWrap: "wrap",
  },

  /* Search */
  searchBox: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", padding: "10px 16px",
    flex: "1", minWidth: "200px", maxWidth: "320px",
  },
  searchIcon: { fontSize: "0.9rem", opacity: 0.5 },
  searchInput: {
    background: "none", border: "none", outline: "none",
    color: "#fff", fontSize: "0.9rem", flex: 1,
    fontFamily: "Inter, sans-serif",
  },
  clearBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,0.3)",
    cursor: "pointer", fontSize: "0.8rem", padding: "0",
  },

  /* Filter pills */
  pillRow: {
    display: "flex", gap: "8px", flexWrap: "wrap",
  },
  filterPill: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.5)",
    padding: "7px 16px", borderRadius: "999px",
    fontSize: "0.8rem", fontWeight: 600,
    fontFamily: "Inter, sans-serif",
    outline: "none",
  },
  filterPillActive: {
    backgroundColor: "#CCFF00",
    borderColor: "#CCFF00",
    color: "#000",
  },

  /* Grid */
  gridWrapper: {
    maxWidth: "1200px", margin: "0 auto",
    padding: "48px 32px 0", boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },

  /* Card */
  card: {
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px", overflow: "hidden",
    cursor: "pointer",
  },

  /* Photo */
  photoWrapper: {
    position: "relative",
    width: "100%", aspectRatio: "3/4",
    overflow: "hidden", backgroundColor: "#111",
  },
  photo: {
    width: "100%", height: "100%",
    objectFit: "cover", objectPosition: "center top",
    display: "block",
  },
  photoFallback: {
    width: "100%", height: "100%",
    backgroundColor: "rgba(204,255,0,0.06)",
    alignItems: "center", justifyContent: "center",
    fontSize: "3rem", fontWeight: 800, color: "#CCFF00",
  },

  /* Score badge */
  scoreBadge: {
    position: "absolute", top: "10px", right: "10px",
    backgroundColor: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(8px)",
    border: "1px solid",
    borderRadius: "8px",
    padding: "4px 10px",
    fontSize: "0.8rem", fontWeight: 800,
    letterSpacing: "0.02em",
  },

  /* Card info */
  cardInfo: {
    padding: "16px",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  cardName: {
    fontSize: "1rem", fontWeight: 700,
    margin: 0, letterSpacing: "-0.01em",
    color: "#fff",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  cardOrigin: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
  cardStats: {
    display: "flex", gap: "16px", marginTop: "4px",
  },
  cardStat: {
    display: "flex", flexDirection: "column", gap: "1px",
  },
  cardStatLabel: {
    fontSize: "0.62rem", color: "rgba(255,255,255,0.28)",
    letterSpacing: "0.08em", textTransform: "uppercase",
  },

  /* Score bar */
  scoreBarTrack: {
    height: "3px",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: "999px", overflow: "hidden",
    marginTop: "6px",
  },
  scoreBarFill: {
    height: "100%", borderRadius: "999px",
    transition: "width 0.5s ease",
  },

  viewProfile: {
    fontSize: "0.75rem",
    color: "rgba(204,255,0,0.6)",
    margin: "4px 0 0",
    fontWeight: 600, letterSpacing: "0.04em",
  },

  /* Skeleton */
  skeleton: {
    backgroundColor: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "14px",
    aspectRatio: "3/5",
    animation: "fadeUp 0.4s ease both",
  },

  /* Empty */
  emptyState: {
    textAlign: "center", padding: "80px 0",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "8px",
  },
  emptyIcon: { fontSize: "3rem", margin: 0 },
  emptyText: { fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  emptyHint: { color: "rgba(255,255,255,0.3)", fontSize: "0.9rem", margin: 0 },

  /* Load more */
  loadMoreBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", padding: "12px 32px",
    borderRadius: "999px", fontSize: "0.9rem",
    fontWeight: 600, cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    transition: "background 0.2s",
  },
  endText: {
    textAlign: "center", marginTop: "40px",
    color: "rgba(255,255,255,0.2)", fontSize: "0.82rem",
  },
};