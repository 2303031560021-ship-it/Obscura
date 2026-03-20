import pandas as pd
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(r"C:\Users\Rishi Patel\OneDrive\Desktop\Obscura\backend\.env")

import os
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing from .env")

# Create SQLAlchemy engine
# WHY SQLAlchemy? It handles connections, transactions,
# and works perfectly with our existing models.py setup
engine = create_engine(DATABASE_URL)
DATA_DIR = os.path.dirname(__file__)


def load_csv(filename):
    """Helper to load a clean CSV."""
    path = os.path.join(DATA_DIR, filename)
    df = pd.read_csv(path)
    print(f"  📂 Loaded {filename}: {len(df)} rows")
    return df


def insert_directors(df):
    """
    Insert directors first.
    WHY FIRST? Movies reference directors via foreign keys.
    You can't insert the reference before the thing being referenced.
    """
    print("\n👤 Inserting directors...")
    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            try:
                conn.execute(text("""
                    INSERT INTO directors 
                        (tmdb_person_id, name, biography, birthday, 
                         place_of_birth, profile_path, popularity)
                    VALUES 
                        (:tmdb_person_id, :name, :biography, :birthday,
                         :place_of_birth, :profile_path, :popularity)
                    ON CONFLICT (tmdb_person_id) DO NOTHING
                """), {
                    "tmdb_person_id": int(row["tmdb_person_id"]),
                    "name":           str(row["name"]),
                    "biography":      str(row.get("biography", "")),
                    "birthday":       row["birthday"] if pd.notna(row.get("birthday")) else None,
                    "place_of_birth": str(row.get("place_of_birth", "Unknown")),
                    "profile_path":   str(row.get("profile_path", "")),
                    "popularity":     float(row.get("popularity", 0)),
                })
                inserted += 1
            except Exception as e:
                skipped += 1
                continue

    print(f"  ✓ Directors inserted: {inserted}, skipped: {skipped}")


def insert_actors(df):
    """Insert actors."""
    print("\n🎭 Inserting actors...")
    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            try:
                conn.execute(text("""
                    INSERT INTO actors
                        (tmdb_person_id, name, biography, birthday,
                         place_of_birth, profile_path, popularity)
                    VALUES
                        (:tmdb_person_id, :name, :biography, :birthday,
                         :place_of_birth, :profile_path, :popularity)
                    ON CONFLICT (tmdb_person_id) DO NOTHING
                """), {
                    "tmdb_person_id": int(row["tmdb_person_id"]),
                    "name":           str(row["name"]),
                    "biography":      str(row.get("biography", "")),
                    "birthday":       row["birthday"] if pd.notna(row.get("birthday")) else None,
                    "place_of_birth": str(row.get("place_of_birth", "Unknown")),
                    "profile_path":   str(row.get("profile_path", "")),
                    "popularity":     float(row.get("popularity", 0)),
                })
                inserted += 1
            except Exception as e:
                skipped += 1
                continue

    print(f"  ✓ Actors inserted: {inserted}, skipped: {skipped}")


def insert_movies(df):
    """Insert movies after directors exist."""
    print("\n🎬 Inserting movies...")
    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            try:
                conn.execute(text("""
                    INSERT INTO movies
                        (tmdb_id, title, original_title, overview,
                         release_date, release_year, rating, vote_count,
                         popularity, poster_path, backdrop_path,
                         original_language, region, cinema_type)
                    VALUES
                        (:tmdb_id, :title, :original_title, :overview,
                         :release_date, :release_year, :rating, :vote_count,
                         :popularity, :poster_path, :backdrop_path,
                         :original_language, :region, :cinema_type)
                    ON CONFLICT (tmdb_id) DO NOTHING
                """), {
                    "tmdb_id":          int(row["tmdb_id"]),
                    "title":            str(row["title"]),
                    "original_title":   str(row.get("original_title", "")),
                    "overview":         str(row.get("overview", "")),
                    "release_date":     row["release_date"] if pd.notna(row.get("release_date")) else None,
                    "release_year":     int(row.get("release_year", 0)),
                    "rating":           float(row.get("rating", 0)),
                    "vote_count":       int(row.get("vote_count", 0)),
                    "popularity":       float(row.get("popularity", 0)),
                    "poster_path":      str(row.get("poster_path", "")),
                    "backdrop_path":    str(row.get("backdrop_path", "")),
                    "original_language":str(row.get("original_language", "")),
                    "region":           str(row.get("region", "")),
                    "cinema_type":      str(row.get("cinema_type", "World Cinema")),
                })
                inserted += 1
            except Exception as e:
                skipped += 1
                continue

    print(f"  ✓ Movies inserted: {inserted}, skipped: {skipped}")


def insert_movie_director_links(df):
    print("\n🔗 Inserting movie-director links...")
    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            try:
                # Get internal movie id from tmdb_id
                movie = conn.execute(text(
                    "SELECT id FROM movies WHERE tmdb_id = :tmdb_id"
                ), {"tmdb_id": int(row["tmdb_movie_id"])}).fetchone()

                # Get internal director id from tmdb_person_id
                director = conn.execute(text(
                    "SELECT id FROM directors WHERE tmdb_person_id = :tmdb_person_id"
                ), {"tmdb_person_id": int(row["tmdb_director_id"])}).fetchone()

                if not movie or not director:
                    skipped += 1
                    continue

                conn.execute(text("""
                    INSERT INTO movie_directors (movie_id, director_id)
                    VALUES (:movie_id, :director_id)
                    ON CONFLICT DO NOTHING
                """), {
                    "movie_id":    movie[0],
                    "director_id": director[0],
                })
                inserted += 1

            except Exception as e:
                skipped += 1
                continue

    print(f"  ✓ Movie-director links inserted: {inserted}, skipped: {skipped}")

def insert_movie_actor_links(df):
    print("\n🔗 Inserting movie-actor links...")
    inserted = 0
    skipped = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            try:
                # Get internal movie id
                movie = conn.execute(text(
                    "SELECT id FROM movies WHERE tmdb_id = :tmdb_id"
                ), {"tmdb_id": int(row["tmdb_movie_id"])}).fetchone()

                # Get internal actor id
                actor = conn.execute(text(
                    "SELECT id FROM actors WHERE tmdb_person_id = :tmdb_person_id"
                ), {"tmdb_person_id": int(row["tmdb_actor_id"])}).fetchone()

                if not movie or not actor:
                    skipped += 1
                    continue

                conn.execute(text("""
                    INSERT INTO movie_actors 
                        (movie_id, actor_id, character_name, cast_order)
                    VALUES 
                        (:movie_id, :actor_id, :character_name, :cast_order)
                    ON CONFLICT DO NOTHING
                """), {
                    "movie_id":      movie[0],
                    "actor_id":      actor[0],
                    "character_name": str(row.get("character", "Unknown")),
                    "cast_order":     int(row.get("cast_order", 99)),
                })
                inserted += 1

            except Exception as e:
                skipped += 1
                continue

    print(f"  ✓ Movie-actor links inserted: {inserted}, skipped: {skipped}")


if __name__ == "__main__":
    print("🚀 Starting database load...")
    print(f"📡 Connecting to: {DATABASE_URL[:30]}...")

    # Load all clean CSVs
    directors = load_csv("directors_clean.csv")
    actors    = load_csv("actors_clean.csv")
    movies    = load_csv("movies_clean.csv")
    mov_dir   = load_csv("movie_director_links_clean.csv")
    mov_act   = load_csv("movie_actor_links_clean.csv")

    # Insert in correct order
    # WHY THIS ORDER?
    # directors and actors first (no dependencies)
    # movies second (no foreign keys to directors/actors directly)
    # junction tables last (depend on both sides existing)
    insert_directors(directors)
    insert_actors(actors)
    insert_movies(movies)
    insert_movie_director_links(mov_dir)
    insert_movie_actor_links(mov_act)

    print("\n✅ Database load complete!")
    print("🎬 Obscura database is now fully populated!")