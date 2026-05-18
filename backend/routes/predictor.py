"""
backend/routes/predictor.py
"""

import os
import joblib
import numpy as np
from flask import Blueprint, jsonify, request

predictor_bp = Blueprint("predictor", __name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ml/model.pkl")
_bundle = None

def get_bundle():
    global _bundle
    if _bundle is None:
        if not os.path.exists(MODEL_PATH):
            return None
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


# ── GET /api/predict/options ──────────────────────────────────────────
@predictor_bp.route("/api/predict/options", methods=["GET"])
def get_options():
    bundle = get_bundle()
    if bundle is None:
        return jsonify({"error": "Model not trained yet."}), 503

    return jsonify({
        "cinema_types": bundle["cinema_classes"],
        "languages":    bundle["language_classes"],
        "accuracy":     bundle["accuracy"],
    })


# ── POST /api/predict ─────────────────────────────────────────────────
@predictor_bp.route("/api/predict", methods=["POST"])
def predict():
    bundle = get_bundle()
    if bundle is None:
        return jsonify({"error": "Model not trained yet."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    model       = bundle["model"]
    le_cinema   = bundle["le_cinema"]
    le_language = bundle["le_language"]
    le_label    = bundle["le_label"]

    try:
        cinema_type = data.get("cinema_type", "Hollywood")
        language    = data.get("language", "en")

        if cinema_type not in le_cinema.classes_:
            cinema_type = le_cinema.classes_[0]
        if language not in le_language.classes_:
            language = "en" if "en" in le_language.classes_ else le_language.classes_[0]

        cinema_enc   = le_cinema.transform([cinema_type])[0]
        language_enc = le_language.transform([language])[0]

        release_month       = int(data.get("release_month", 6))
        release_year        = int(data.get("release_year", 2025))
        popularity          = float(data.get("popularity", 10.0))
        vote_count          = int(data.get("vote_count", 1000))
        director_avg_rating = float(data.get("director_avg_rating", 6.5))

        # Apply same log transforms as training
        log_popularity  = np.log1p(popularity)
        log_vote_count  = np.log1p(vote_count)

        features = np.array([[
            cinema_enc,
            language_enc,
            release_month,
            release_year,
            log_popularity,
            log_vote_count,
            director_avg_rating,
        ]])

        pred_enc   = model.predict(features)[0]
        pred_proba = model.predict_proba(features)[0]
        pred_label = le_label.inverse_transform([pred_enc])[0]

        proba_map = {
            le_label.inverse_transform([i])[0]: round(float(p) * 100, 1)
            for i, p in enumerate(pred_proba)
        }

        confidence = round(float(pred_proba[pred_enc]) * 100, 1)

        rating_ranges = {
            "Flop":     "Below 5.5",
            "Average":  "5.5 – 6.5",
            "Hit":      "6.5 – 7.5",
            "Superhit": "Above 7.5",
        }

        return jsonify({
            "prediction":     pred_label,
            "confidence":     confidence,
            "probabilities":  proba_map,
            "rating_range":   rating_ranges.get(pred_label, "Unknown"),
            "model_accuracy": bundle["accuracy"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500