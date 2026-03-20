import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000",
});

// ── MOVIES ──────────────────────────────────
export const getMovies = (params) =>
  API.get("/api/movies", { params });

export const getMovie = (tmdbId) =>
  API.get(`/api/movies/${tmdbId}`);

export const getTrendingMovies = () =>
  API.get("/api/movies/trending");

export const getTopRatedMovies = () =>
  API.get("/api/movies/top-rated");

export const getMovieStats = () =>
  API.get("/api/movies/stats");

// ── DIRECTORS ───────────────────────────────
export const getDirectors = (params) =>
  API.get("/api/directors", { params });

export const getDirector = (tmdbPersonId) =>
  API.get(`/api/directors/${tmdbPersonId}`);

export const getTopDirectors = () =>
  API.get("/api/directors/top");

export const getCollaborations = (tmdbPersonId) =>
  API.get(`/api/directors/${tmdbPersonId}/collaborations`);

// ── GENRES ──────────────────────────────────
export const getGenres = () =>
  API.get("/api/genres");

export const getGenreAnalytics = () =>
  API.get("/api/genres/analytics");

export const getGenreDistribution = () =>
  API.get("/api/genres/distribution");

// ── GLOBAL CINEMA ───────────────────────────
export const getGlobalStats = () =>
  API.get("/api/global/stats");

export const getGlobalComparison = () =>
  API.get("/api/global/comparison");

export const getGlobalTrends = () =>
  API.get("/api/global/trends");

export const getTopPerIndustry = () =>
  API.get("/api/global/top-per-industry");