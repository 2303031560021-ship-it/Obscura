"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { getMovies, getTrendingMovies, getTopRatedMovies } from "@/lib/api";

const CINEMA_TYPES = ["All", "Hollywood", "Bollywood", "Korean", "Japanese", "French"];
const RATINGS = ["All", "9+", "8+", "7+", "6+"];
const YEARS = ["All", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2015", "2010", "2000"];

export default function MoviesPage() {
  return (
    <main className="bg-black min-h-screen">
      <HeroCarousel />
      <TrendingRow />
      <TopRatedRow />
      <ByIndustrySection />
      <BrowseSection />
    </main>
  );
}


// ═══════════════════════════════════════════
// 1. HERO CAROUSEL
// ═══════════════════════════════════════════
function HeroCarousel() {
  const [movies, setMovies] = useState([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getTrendingMovies()
      .then(res => setMovies(res.data.movies.slice(0, 5)))
      .catch(err => console.error(err));
  }, []);

  const goTo = useCallback((index) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 400);
  }, [animating]);

  const next = useCallback(() => {
    goTo((current + 1) % 5);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + 5) % 5);
  }, [current, goTo]);

  // Auto slide every 6 seconds
  useEffect(() => {
    if (movies.length === 0) return;
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, [movies, next]);

  if (movies.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: "85vh", backgroundColor: "#050505" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#CCFF00", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const movie = movies[current];
  const backdropUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "85vh", minHeight: "550px" }}
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: animating ? 0 : 1 }}
      >
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.35)" }}
          />
        )}
        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.3) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 40%)",
          }}
        />
      </div>

      {/* CONTENT */}
      <div
        className="relative z-10 h-full flex items-center px-16 pt-20"
        style={{ opacity: animating ? 0 : 1, transition: "opacity 0.4s ease" }}
      >
        <div className="flex items-center gap-12 max-w-6xl">

          {/* Poster */}
          <div
            className="flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl hidden md:block"
            style={{
              width: "200px",
              height: "300px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {posterUrl && (
              <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-black px-3 py-1 rounded-full"
                style={{ backgroundColor: "#CCFF00", color: "#000" }}
              >
                #{current + 1} TRENDING
              </span>
              <span className="text-white/40 text-xs uppercase tracking-widest">
                {movie.cinema_type}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-black text-white leading-none mb-4"
              style={{ fontSize: "clamp(32px, 5vw, 72px)" }}
            >
              {movie.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 mb-6">
              <span
                className="text-2xl font-black"
                style={{ color: "#CCFF00" }}
              >
                ★ {Number(movie.rating).toFixed(1)}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-white/60 text-sm">{movie.release_year}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/60 text-sm">
                {Number(movie.vote_count).toLocaleString()} votes
              </span>
            </div>

            {/* Overview */}
            {movie.overview && (
              <p
                className="text-white/50 text-sm leading-relaxed mb-8 max-w-xl"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {movie.overview}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href={`/movies/${movie.tmdb_id}`}
                className="px-8 py-3 rounded-full font-bold text-black text-sm transition-all hover:scale-105 hover:brightness-110"
                style={{ backgroundColor: "#CCFF00" }}
              >
                View Details
              </Link>
              <button
                className="px-8 py-3 rounded-full font-semibold text-white/70 text-sm border transition-all hover:text-white hover:border-white/40"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                + Watchlist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT ARROW */}
      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span className="text-white text-lg">←</span>
      </button>

      {/* RIGHT ARROW */}
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span className="text-white text-lg">→</span>
      </button>

      {/* DOTS */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "8px",
              height: "8px",
              backgroundColor: i === current ? "#CCFF00" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>

      {/* THUMBNAIL STRIP */}
      <div className="absolute bottom-8 right-8 z-20 flex gap-2">
        {movies.map((m, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-lg overflow-hidden transition-all duration-300"
            style={{
              width: "48px",
              height: "72px",
              opacity: i === current ? 1 : 0.4,
              border: i === current ? "2px solid #CCFF00" : "2px solid transparent",
              transform: i === current ? "scale(1.1)" : "scale(1)",
            }}
          >
            {m.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                alt={m.title}
                className="w-full h-full object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// 2. TRENDING ROW
// ═══════════════════════════════════════════
function TrendingRow() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getTrendingMovies()
      .then(res => setMovies(res.data.movies))
      .catch(err => console.error(err));
  }, []);

  return (
    <MovieScrollRow
      title="Trending This Week"
      label="— Hot Right Now —"
      movies={movies}
    />
  );
}


// ═══════════════════════════════════════════
// 3. TOP RATED ROW
// ═══════════════════════════════════════════
function TopRatedRow() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getTopRatedMovies()
      .then(res => setMovies(res.data.movies))
      .catch(err => console.error(err));
  }, []);

  return (
    <MovieScrollRow
      title="Top Rated All Time"
      label="— Critically Acclaimed —"
      movies={movies}
    />
  );
}


// ═══════════════════════════════════════════
// REUSABLE HORIZONTAL SCROLL ROW
// ═══════════════════════════════════════════
function MovieScrollRow({ title, label, movies }) {
  return (
    <section className="py-12 border-t border-white/5">
      <div className="px-8 mb-6">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-2"
          style={{ color: "#CCFF00", fontSize: "11px", letterSpacing: "0.2em" }}
        >
          {label}
        </p>
        <h2 className="text-2xl font-black text-white">{title}</h2>
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-4 px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {movies.map((movie, i) => (
          <PosterCard key={movie.tmdb_id} movie={movie} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// POSTER CARD
// ═══════════════════════════════════════════
function PosterCard({ movie, rank }) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  return (
    <Link href={`/movies/${movie.tmdb_id}`}>
      <div
        className="flex-shrink-0 cursor-pointer group"
        style={{ width: "160px" }}
      >
        {/* Poster */}
        <div
          className="relative rounded-xl overflow-hidden mb-3 transition-transform duration-300 group-hover:scale-105"
          style={{
            width: "160px",
            height: "240px",
            backgroundColor: "#111",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl">
              🎬
            </div>
          )}

          {/* Rank badge */}
          <div
            className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
            style={{ backgroundColor: "#CCFF00", color: "#000" }}
          >
            {rank}
          </div>

          {/* Hover overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}
          >
            <div>
              <p className="text-white font-bold text-xs line-clamp-2">{movie.title}</p>
              <p className="font-black text-xs mt-1" style={{ color: "#CCFF00" }}>
                ★ {Number(movie.rating).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Title below */}
        <p className="text-white/70 text-xs font-medium truncate">{movie.title}</p>
        <p className="text-white/30 text-xs mt-0.5">{movie.release_year}</p>
      </div>
    </Link>
  );
}


// ═══════════════════════════════════════════
// 4. BY INDUSTRY SECTION
// ═══════════════════════════════════════════
function ByIndustrySection() {
  const [activeTab, setActiveTab] = useState("Hollywood");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const tabs = ["Hollywood", "Bollywood", "Korean", "Japanese", "French"];

  useEffect(() => {
    setLoading(true);
    getMovies({ cinema_type: activeTab, limit: 10, offset: 0 })
      .then(res => setMovies(res.data.movies))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <section className="py-12 border-t border-white/5 px-8">
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-2"
          style={{ color: "#CCFF00", fontSize: "11px", letterSpacing: "0.2em" }}
        >
          — Explore by Region —
        </p>
        <h2 className="text-2xl font-black text-white mb-6">By Industry</h2>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab ? "#CCFF00" : "rgba(255,255,255,0.05)",
                color: activeTab === tab ? "#000" : "rgba(255,255,255,0.5)",
                border: activeTab === tab ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Movies grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#CCFF00", borderTopColor: "transparent" }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {movies.map((movie, i) => (
            <PosterCard key={movie.tmdb_id} movie={movie} rank={i + 1} />
          ))}
        </div>
      )}

      {/* View all link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            document.getElementById("browse-section")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="text-sm font-semibold transition-colors"
          style={{ color: "#CCFF00" }}
        >
          View all {activeTab} films →
        </button>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════
// 5. BROWSE ALL SECTION
// ═══════════════════════════════════════════
function BrowseSection() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const [search, setSearch] = useState("");
  const [cinemaType, setCinemaType] = useState("All");
  const [year, setYear] = useState("All");
  const [rating, setRating] = useState("All");
  const [searchInput, setSearchInput] = useState("");

  const fetchMovies = useCallback((reset = false) => {
    setLoading(true);
    const params = { limit: LIMIT, offset: reset ? 0 : offset };
    if (search) params.search = search;
    if (cinemaType !== "All") params.cinema_type = cinemaType;
    if (year !== "All") params.year = year;
    if (rating !== "All") params.min_rating = rating.replace("+", "");

    getMovies(params)
      .then(res => {
        if (reset) {
          setMovies(res.data.movies);
          setOffset(LIMIT);
        } else {
          setMovies(prev => [...prev, ...res.data.movies]);
          setOffset(prev => prev + LIMIT);
        }
        setTotal(res.data.total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [search, cinemaType, year, rating, offset]);

  useEffect(() => { fetchMovies(true); }, [search, cinemaType, year, rating]);

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <section
      id="browse-section"
      className="py-12 border-t border-white/5 px-8"
    >
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-2"
          style={{ color: "#CCFF00", fontSize: "11px", letterSpacing: "0.2em" }}
        >
          — Full Library —
        </p>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black text-white">Browse All Movies</h2>
          <p className="text-white/30 text-sm">{total.toLocaleString()} films</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search movies..."
          className="flex-1 rounded-xl px-5 py-3 text-white placeholder-white/30 text-sm outline-none transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(204,255,0,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl font-bold text-black text-sm transition-all hover:brightness-110"
          style={{ backgroundColor: "#CCFF00" }}
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); setSearchInput(""); }}
            className="px-4 py-3 rounded-xl text-white/50 text-sm hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs uppercase tracking-widest">Industry</span>
          <div className="flex gap-2 flex-wrap">
            {CINEMA_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setCinemaType(type)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: cinemaType === type ? "#CCFF00" : "rgba(255,255,255,0.05)",
                  color: cinemaType === type ? "#000" : "rgba(255,255,255,0.5)",
                  border: cinemaType === type ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs uppercase tracking-widest">Rating</span>
          <div className="flex gap-2">
            {RATINGS.map(r => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: rating === r ? "#CCFF00" : "rgba(255,255,255,0.05)",
                  color: rating === r ? "#000" : "rgba(255,255,255,0.5)",
                  border: rating === r ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ★ {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs uppercase tracking-widest">Year</span>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="rounded-full px-4 py-1 text-white/50 text-xs outline-none cursor-pointer"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {YEARS.map(y => (
              <option key={y} value={y} className="bg-black">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="grid text-xs font-bold uppercase tracking-widest text-white/30 px-6 py-4"
          style={{
            gridTemplateColumns: "48px 1fr 130px 80px 80px 100px",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span>#</span>
          <span>Title</span>
          <span>Industry</span>
          <span>Year</span>
          <span>Rating</span>
          <span>Votes</span>
        </div>

        {/* Rows */}
        {loading && movies.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "#CCFF00", borderTopColor: "transparent" }}
            />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            No movies found. Try different filters.
          </div>
        ) : (
          movies.map((movie, index) => (
            <MovieRow key={movie.tmdb_id} movie={movie} index={index + 1} />
          ))
        )}
      </div>

      {/* Load more */}
      {movies.length < total && (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => fetchMovies(false)}
            disabled={loading}
            className="px-8 py-3 rounded-full font-semibold text-black text-sm transition-all hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: "#CCFF00" }}
          >
            {loading ? "Loading..." : `Load More (${total - movies.length} remaining)`}
          </button>
        </div>
      )}
    </section>
  );
}


// ═══════════════════════════════════════════
// MOVIE ROW (for browse table)
// ═══════════════════════════════════════════
function MovieRow({ movie, index }) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
    : null;

  return (
    <Link href={`/movies/${movie.tmdb_id}`}>
      <div
        className="grid items-center px-6 py-4 cursor-pointer group transition-all duration-200"
        style={{
          gridTemplateColumns: "48px 1fr 130px 80px 80px 100px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <span className="text-white/20 text-sm font-mono">{index}</span>

        <div className="flex items-center gap-4 min-w-0">
          <div
            className="flex-shrink-0 rounded-md overflow-hidden"
            style={{ width: "36px", height: "54px", backgroundColor: "#111" }}
          >
            {posterUrl && (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            )}
          </div>
          <div className="min-w-0">
            <p
              className="font-semibold text-sm truncate transition-colors duration-200 group-hover:text-[#CCFF00]"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {movie.title}
            </p>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-white/30 text-xs mt-0.5 truncate">{movie.original_title}</p>
            )}
          </div>
        </div>

        <span
          className="text-xs font-semibold px-2 py-1 rounded-full w-fit"
          style={{ backgroundColor: "rgba(204,255,0,0.1)", color: "#CCFF00" }}
        >
          {movie.cinema_type}
        </span>

        <span className="text-white/50 text-sm">{movie.release_year}</span>

        <span
          className="font-bold text-sm"
          style={{
            color: movie.rating >= 8 ? "#CCFF00" : movie.rating >= 7 ? "white" : "rgba(255,255,255,0.5)"
          }}
        >
          ★ {Number(movie.rating).toFixed(1)}
        </span>

        <span className="text-white/30 text-xs">
          {Number(movie.vote_count).toLocaleString()}
        </span>
      </div>
    </Link>
  );
}