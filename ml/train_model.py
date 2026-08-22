"""
Obscura ML Predictor — train_model.py
Run: py ml/train_model.py
"""

import os
import joblib
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

DATABASE_URL = "postgresql://obscura_db_ov7c_user:syeLH7zPQFdWHzCJILSTP8uAqIufKH0h@dpg-d81ahnjrjlhs73b0gpg0-a.singapore-postgres.render.com/obscura_db_ov7c"

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

# ── Query with director avg rating ────────────────────────────────────
sql = """
    SELECT
        m.rating,
        m.popularity,
        m.vote_count,
        m.cinema_type,
        m.original_language,
        EXTRACT(MONTH FROM m.release_date) AS release_month,
        EXTRACT(YEAR  FROM m.release_date) AS release_year,
        COALESCE(
            (
                SELECT ROUND(AVG(m2.rating)::numeric, 2)
                FROM movie_directors md
                JOIN directors d ON d.id = md.director_id
                JOIN movie_directors md2 ON md2.director_id = d.id
                JOIN movies m2 ON m2.id = md2.movie_id
                WHERE md.movie_id = m.id
                  AND m2.id != m.id
                  AND m2.rating IS NOT NULL
            ),
            6.5
        ) AS director_avg_rating
    FROM movies m
    WHERE m.rating IS NOT NULL
      AND m.vote_count > 50
      AND m.cinema_type IS NOT NULL
"""

print("Fetching data with director features...")
with engine.connect() as conn:
    df = pd.read_sql(text(sql), conn)

print(f"Raw data: {len(df)} rows")

if len(df) == 0:
    print("ERROR: 0 rows fetched.")
    exit(1)

# ── Target label ──────────────────────────────────────────────────────
def label_rating(r):
    if r < 5.5:  return "Flop"
    if r < 6.5:  return "Average"
    if r < 7.5:  return "Hit"
    return "Superhit"

df["label"] = df["rating"].apply(label_rating)
print("\nLabel distribution:")
print(df["label"].value_counts())

# ── Feature engineering ───────────────────────────────────────────────
df["release_month"]       = df["release_month"].fillna(6).astype(int)
df["release_year"]        = df["release_year"].fillna(2000).astype(int)
df["popularity"]          = df["popularity"].fillna(df["popularity"].median())
df["vote_count"]          = df["vote_count"].fillna(100).astype(int)
df["original_language"]   = df["original_language"].fillna("en")
df["director_avg_rating"] = df["director_avg_rating"].fillna(6.5).astype(float)

# Log transform vote_count and popularity (reduces skew)
df["log_vote_count"] = np.log1p(df["vote_count"])
df["log_popularity"] = np.log1p(df["popularity"])

le_cinema   = LabelEncoder()
le_language = LabelEncoder()
le_label    = LabelEncoder()

df["cinema_type_enc"] = le_cinema.fit_transform(df["cinema_type"].astype(str))
df["language_enc"]    = le_language.fit_transform(df["original_language"].astype(str))
df["label_enc"]       = le_label.fit_transform(df["label"])

# ── Train ─────────────────────────────────────────────────────────────
FEATURES = [
    "cinema_type_enc",
    "language_enc",
    "release_month",
    "release_year",
    "log_popularity",
    "log_vote_count",
    "director_avg_rating",
]

X = df[FEATURES]
y = df["label_enc"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining on {len(X_train)} rows, testing on {len(X_test)} rows")
print("Training Random Forest...")

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    min_samples_split=4,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
acc    = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {acc:.2%}")
print(classification_report(y_test, y_pred, target_names=le_label.classes_))

print("Feature Importances:")
for feat, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {feat:25s} {imp:.4f}")

# ── Save ──────────────────────────────────────────────────────────────
os.makedirs("ml", exist_ok=True)
joblib.dump({
    "model":            model,
    "le_cinema":        le_cinema,
    "le_language":      le_language,
    "le_label":         le_label,
    "features":         FEATURES,
    "accuracy":         round(acc, 4),
    "cinema_classes":   list(le_cinema.classes_),
    "language_classes": list(le_language.classes_),
    "label_classes":    list(le_label.classes_),
}, "ml/model.pkl")

print("\n✅ Model saved to ml/model.pkl")
print(f"   Accuracy:     {acc:.2%}")
print(f"   Cinema types: {list(le_cinema.classes_)}")
print(f"   Labels:       {list(le_label.classes_)}")