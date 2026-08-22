"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "https://obscura-backend-k2ph.onrender.com/api";

const MONTHS = [
  { value: 1,  label: "January" },
  { value: 2,  label: "February" },
  { value: 3,  label: "March" },
  { value: 4,  label: "April" },
  { value: 5,  label: "May" },
  { value: 6,  label: "June" },
  { value: 7,  label: "July" },
  { value: 8,  label: "August" },
  { value: 9,  label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const LABEL_META = {
  Superhit: { emoji: "⭐", color: "#CCFF00",  bg: "rgba(204,255,0,0.08)",  border: "rgba(204,255,0,0.3)" },
  Hit:      { emoji: "🟢", color: "#4ade80",  bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.3)" },
  Average:  { emoji: "🟡", color: "#f0c040",  bg: "rgba(240,192,64,0.08)", border: "rgba(240,192,64,0.3)" },
  Flop:     { emoji: "🔴", color: "#ff6b6b",  bg: "rgba(255,107,107,0.08)",border: "rgba(255,107,107,0.3)" },
};

const LANG_LABELS = {
  en: "English", hi: "Hindi", ja: "Japanese", ko: "Korean",
  fr: "French",  de: "German", es: "Spanish", zh: "Chinese",
  it: "Italian", pt: "Portuguese", ru: "Russian", ar: "Arabic",
};

export default function PredictPage() {
  const [options,  setOptions]  = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [optErr,   setOptErr]   = useState(null);

  // Form state
  const [cinemaType,        setCinemaType]        = useState("Hollywood");
  const [language,          setLanguage]          = useState("en");
  const [releaseMonth,      setReleaseMonth]      = useState(6);
  const [releaseYear,       setReleaseYear]       = useState(2025);
  const [popularity,        setPopularity]        = useState(15);
  const [voteCount,         setVoteCount]         = useState(5000);
  const [directorAvgRating, setDirectorAvgRating] = useState(6.5);

  // Load dropdown options
  useEffect(() => {
    axios.get(`${API_BASE}/predict/options`)
      .then((res) => setOptions(res.data))
      .catch(() => setOptErr("Could not load model options. Make sure backend is running."));
  }, []);

  // Auto-predict whenever any input changes
  const predict = useCallback(async () => {
    if (!options) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/predict`, {
        cinema_type:         cinemaType,
        language,
        release_month:       releaseMonth,
        release_year:        releaseYear,
        popularity,
        vote_count:          voteCount,
        director_avg_rating: directorAvgRating,
      });
      setResult(res.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [options, cinemaType, language, releaseMonth, releaseYear,
      popularity, voteCount, directorAvgRating]);

  useEffect(() => {
    const t = setTimeout(predict, 400);
    return () => clearTimeout(t);
  }, [predict]);

  const meta = result ? (LABEL_META[result.prediction] ?? LABEL_META.Average) : null;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; } 50% { opacity:0.4; }
        }
        .anim-1 { animation: fadeUp 0.5s ease 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s ease 0.12s both; }
        .anim-3 { animation: fadeUp 0.5s ease 0.19s both; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #CCFF00;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(204,255,0,0.4);
        }
        select {
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────── */}
      <div style={S.hero} className="anim-1">
        <div style={S.heroInner}>
          <span style={S.label}>ML PREDICTOR</span>
          <h1 style={S.title}>Will It Be a Hit?</h1>
          <p style={S.subtitle}>
            Adjust the inputs and our Random Forest model instantly predicts
            whether your film will Flop, Average, Hit, or Superhit —
            trained on {(4734).toLocaleString()} real films.
          </p>
          {options && (
            <div style={S.accuracyBadge}>
              <span style={{ color: "#CCFF00", fontWeight: 800 }}>
                {(options.accuracy * 100).toFixed(1)}%
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                {" "}model accuracy · 2.5× better than random
              </span>
            </div>
          )}
          {optErr && <p style={{ color: "#ff6b6b", fontSize: "0.85rem" }}>{optErr}</p>}
        </div>
      </div>

      {/* ── MAIN LAYOUT ──────────────────────────── */}
      <div style={S.mainLayout}>

        {/* ── LEFT: INPUTS ── */}
        <div style={S.inputPanel} className="anim-2">
          <h2 style={S.panelTitle}>Film Parameters</h2>

          {/* Cinema Type */}
          <div style={S.field}>
            <label style={S.fieldLabel}>CINEMA TYPE</label>
            <select
              value={cinemaType}
              onChange={(e) => setCinemaType(e.target.value)}
              style={S.select}
            >
              {(options?.cinema_types ?? ["Hollywood","Bollywood","Korean","Japanese","French"]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div style={S.field}>
            <label style={S.fieldLabel}>ORIGINAL LANGUAGE</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={S.select}
            >
              {(options?.languages ?? ["en","hi","ja","ko","fr"]).map((l) => (
                <option key={l} value={l}>{LANG_LABELS[l] ?? l.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Release Month */}
          <div style={S.field}>
            <label style={S.fieldLabel}>RELEASE MONTH</label>
            <select
              value={releaseMonth}
              onChange={(e) => setReleaseMonth(Number(e.target.value))}
              style={S.select}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div style={S.field}>
            <div style={S.sliderHeader}>
              <label style={S.fieldLabel}>RELEASE YEAR</label>
              <span style={S.sliderVal}>{releaseYear}</span>
            </div>
            <input type="range" min="2000" max="2030" step="1"
              value={releaseYear}
              onChange={(e) => setReleaseYear(Number(e.target.value))} />
            <div style={S.sliderRange}><span>2000</span><span>2030</span></div>
          </div>

          {/* Popularity */}
          <div style={S.field}>
            <div style={S.sliderHeader}>
              <label style={S.fieldLabel}>EXPECTED POPULARITY</label>
              <span style={S.sliderVal}>{popularity}</span>
            </div>
            <input type="range" min="1" max="100" step="1"
              value={popularity}
              onChange={(e) => setPopularity(Number(e.target.value))} />
            <div style={S.sliderRange}><span>Low (1)</span><span>High (100)</span></div>
          </div>

          {/* Vote Count */}
          <div style={S.field}>
            <div style={S.sliderHeader}>
              <label style={S.fieldLabel}>EXPECTED AUDIENCE SIZE</label>
              <span style={S.sliderVal}>{voteCount.toLocaleString()}</span>
            </div>
            <input type="range" min="100" max="50000" step="100"
              value={voteCount}
              onChange={(e) => setVoteCount(Number(e.target.value))} />
            <div style={S.sliderRange}><span>Indie (100)</span><span>Blockbuster (50k)</span></div>
          </div>

          {/* Director Avg Rating */}
          <div style={S.field}>
            <div style={S.sliderHeader}>
              <label style={S.fieldLabel}>DIRECTOR TRACK RECORD</label>
              <span style={{ ...S.sliderVal, color: "#CCFF00" }}>★ {directorAvgRating.toFixed(1)}</span>
            </div>
            <input type="range" min="1" max="10" step="0.1"
              value={directorAvgRating}
              onChange={(e) => setDirectorAvgRating(Number(e.target.value))} />
            <div style={S.sliderRange}><span>Unknown (1)</span><span>Legendary (10)</span></div>
          </div>
        </div>

        {/* ── RIGHT: RESULT ── */}
        <div style={S.resultPanel} className="anim-3">

          {/* Prediction card */}
          <div style={{
            ...S.predCard,
            borderColor: meta ? meta.border : "rgba(255,255,255,0.07)",
            backgroundColor: meta ? meta.bg : "#0a0a0a",
          }}>
            {loading ? (
              <div style={S.predLoading}>
                <div style={S.predLoadingDot} />
                <p style={{ color: "rgba(255,255,255,0.3)", margin: 0, fontSize: "0.85rem" }}>
                  Predicting…
                </p>
              </div>
            ) : result ? (
              <>
                <div style={S.predEmoji}>{meta?.emoji ?? "🎬"}</div>
                <h2 style={{ ...S.predLabel, color: meta?.color ?? "#fff" }}>
                  {result.prediction}
                </h2>
                <p style={S.predRange}>Predicted rating: {result.rating_range}</p>
                <div style={S.confRow}>
                  <span style={S.confLabel}>CONFIDENCE</span>
                  <span style={{ ...S.confVal, color: meta?.color ?? "#fff" }}>
                    {result.confidence}%
                  </span>
                </div>
                <div style={S.confBarTrack}>
                  <div style={{
                    ...S.confBarFill,
                    width: `${result.confidence}%`,
                    backgroundColor: meta?.color ?? "#CCFF00",
                  }} />
                </div>
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: "0.9rem" }}>
                Adjust inputs to see prediction
              </p>
            )}
          </div>

          {/* Probability breakdown */}
          {result && result.probabilities && (
            <div style={S.probaCard}>
              <h3 style={S.probaTitle}>Probability Breakdown</h3>
              {Object.entries(result.probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([label, pct]) => {
                  const m = LABEL_META[label] ?? LABEL_META.Average;
                  return (
                    <div key={label} style={S.probaRow}>
                      <span style={{ ...S.probaLabel, color: m.color }}>
                        {m.emoji} {label}
                      </span>
                      <div style={S.probaTrack}>
                        <div style={{
                          ...S.probaFill,
                          width: `${pct}%`,
                          backgroundColor: m.color,
                        }} />
                      </div>
                      <span style={S.probaPct}>{pct}%</span>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Model info */}
          <div style={S.modelInfo}>
            <span style={S.label}>ABOUT THIS MODEL</span>
            <p style={S.modelText}>
              Random Forest Classifier trained on 4,734 films across 5 cinema industries.
              Uses vote count, popularity, director track record, release timing, and cinema type.
              Superhit prediction reaches <strong style={{ color: "#CCFF00" }}>82% precision</strong>.
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: "80px" }} />
    </div>
  );
}

const S = {
  page:     { backgroundColor: "#000", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" },
  label:    { fontSize: "0.67rem", letterSpacing: "0.18em", fontWeight: 700, color: "#CCFF00", textTransform: "uppercase" },

  hero:      { borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "120px 32px 56px" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" },
  title:     { fontSize: "clamp(2.4rem,6vw,4rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  subtitle:  { color: "rgba(255,255,255,0.4)", fontSize: "1rem", margin: 0, maxWidth: "560px", lineHeight: 1.7 },
  accuracyBadge: { display: "inline-flex", alignItems: "center", backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "999px", padding: "8px 18px", fontSize: "0.88rem" },

  mainLayout: { maxWidth: "1200px", margin: "0 auto", padding: "48px 32px 0", boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },

  /* Input panel */
  inputPanel: { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" },
  panelTitle: { fontSize: "1.1rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" },

  field:       { display: "flex", flexDirection: "column", gap: "10px" },
  fieldLabel:  { fontSize: "0.62rem", letterSpacing: "0.14em", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" },
  select:      { backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", padding: "10px 14px", fontSize: "0.88rem", fontFamily: "Inter, sans-serif", cursor: "pointer", outline: "none" },
  sliderHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center" },
  sliderVal:   { fontSize: "1rem", fontWeight: 800, color: "#fff" },
  sliderRange: { display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", marginTop: "4px" },

  /* Result panel */
  resultPanel: { display: "flex", flexDirection: "column", gap: "16px" },

  predCard:    { borderRadius: "16px", border: "1px solid", padding: "36px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", minHeight: "240px", justifyContent: "center" },
  predLoading: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  predLoadingDot: { width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#CCFF00", animation: "pulse 1s ease infinite" },
  predEmoji:   { fontSize: "3rem", lineHeight: 1 },
  predLabel:   { fontSize: "2.4rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  predRange:   { color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", margin: 0 },
  confRow:     { display: "flex", alignItems: "center", gap: "10px", width: "100%" },
  confLabel:   { fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", flex: 1, textAlign: "left" },
  confVal:     { fontSize: "1rem", fontWeight: 800 },
  confBarTrack:{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "999px", overflow: "hidden" },
  confBarFill: { height: "100%", borderRadius: "999px", transition: "width 0.5s ease" },

  probaCard:  { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" },
  probaTitle: { fontSize: "0.9rem", fontWeight: 700, margin: 0 },
  probaRow:   { display: "flex", alignItems: "center", gap: "12px" },
  probaLabel: { fontSize: "0.82rem", fontWeight: 600, minWidth: "80px" },
  probaTrack: { flex: 1, height: "4px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" },
  probaFill:  { height: "100%", borderRadius: "999px", transition: "width 0.5s ease" },
  probaPct:   { fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", minWidth: "40px", textAlign: "right" },

  modelInfo:  { backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "8px" },
  modelText:  { fontSize: "0.82rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", margin: 0 },
};