import pandas as pd
import numpy as np
import os

DATA_DIR = os.path.dirname(__file__)

def load_raw_data():
    """Load all 4 raw CSVs we collected."""
    print("📂 Loading raw CSVs...")
    movies     = pd.read_csv(os.path.join(DATA_DIR, "movies_raw.csv"))
    directors  = pd.read_csv(os.path.join(DATA_DIR, "directors_raw.csv"))
    actors     = pd.read_csv(os.path.join(DATA_DIR, "actors_raw.csv"))
    mov_dir    = pd.read_csv(os.path.join(DATA_DIR, "movie_director_links.csv"))
    mov_act    = pd.read_csv(os.path.join(DATA_DIR, "movie_actor_links.csv"))
    
    print(f"  ✓ Movies: {len(movies)}")
    print(f"  ✓ Directors: {len(directors)}")
    print(f"  ✓ Actors: {len(actors)}")
    print(f"  ✓ Movie-Director links: {len(mov_dir)}")
    print(f"  ✓ Movie-Actor links: {len(mov_act)}")
    
    return movies, directors, actors, mov_dir, mov_act


def clean_movies(df):
    """
    Clean the movies dataframe.
    WHY? Raw API data has nulls, wrong types,
    and inconsistent formats that will break
    our database inserts and chart calculations.
    """
    print("\n🧹 Cleaning movies...")
    
    # Drop rows with no title or tmdb_id — useless without these
    df = df.dropna(subset=["tmdb_id", "title"])
    
    # Fill missing text fields with empty string
    df["overview"]       = df["overview"].fillna("")
    df["poster_path"]    = df["poster_path"].fillna("")
    df["backdrop_path"]  = df["backdrop_path"].fillna("")
    df["cinema_type"]    = df["cinema_type"].fillna("World Cinema")
    
    # Fill missing numbers with 0
    df["rating"]         = pd.to_numeric(df["rating"], errors="coerce").fillna(0)
    df["vote_count"]     = pd.to_numeric(df["vote_count"], errors="coerce").fillna(0)
    df["popularity"]     = pd.to_numeric(df["popularity"], errors="coerce").fillna(0)
    
    # Clean release_date — extract just the year
    df["release_date"]   = pd.to_datetime(df["release_date"], errors="coerce")
    df["release_year"]   = df["release_date"].dt.year.fillna(0).astype(int)
    
    # Remove movies with 0 rating AND 0 votes — likely bad data
    df = df[~((df["rating"] == 0) & (df["vote_count"] == 0))]
    
    # Remove duplicates by tmdb_id
    df = df.drop_duplicates(subset=["tmdb_id"])
    
    # Reset index
    df = df.reset_index(drop=True)
    
    print(f"  ✓ Clean movies: {len(df)}")
    return df


def clean_directors(df):
    """Clean directors dataframe."""
    print("\n🧹 Cleaning directors...")
    
    df = df.dropna(subset=["tmdb_person_id", "name"])
    df["biography"]      = df["biography"].fillna("")
    df["place_of_birth"] = df["place_of_birth"].fillna("Unknown")
    df["profile_path"]   = df["profile_path"].fillna("")
    df["popularity"]     = pd.to_numeric(df["popularity"], errors="coerce").fillna(0)
    df = df.drop_duplicates(subset=["tmdb_person_id"])
    df = df.reset_index(drop=True)
    
    print(f"  ✓ Clean directors: {len(df)}")
    return df


def clean_actors(df):
    """Clean actors dataframe."""
    print("\n🧹 Cleaning actors...")
    
    df = df.dropna(subset=["tmdb_person_id", "name"])
    df["biography"]      = df["biography"].fillna("")
    df["place_of_birth"] = df["place_of_birth"].fillna("Unknown")
    df["profile_path"]   = df["profile_path"].fillna("")
    df["popularity"]     = pd.to_numeric(df["popularity"], errors="coerce").fillna(0)
    df = df.drop_duplicates(subset=["tmdb_person_id"])
    df = df.reset_index(drop=True)
    
    print(f"  ✓ Clean actors: {len(df)}")
    return df


def clean_links(mov_dir, mov_act, clean_movie_ids, clean_director_ids, clean_actor_ids):
    """
    Clean junction tables.
    WHY? We only keep links where BOTH sides exist
    in our cleaned data. If a movie was removed during
    cleaning, its director/actor links are now orphans
    and will break foreign key constraints in PostgreSQL.
    """
    print("\n🧹 Cleaning links...")
    
    # Only keep links where movie exists in clean movies
    mov_dir = mov_dir[mov_dir["tmdb_movie_id"].isin(clean_movie_ids)]
    mov_dir = mov_dir[mov_dir["tmdb_director_id"].isin(clean_director_ids)]
    mov_dir = mov_dir.drop_duplicates()
    mov_dir = mov_dir.reset_index(drop=True)
    
    mov_act = mov_act[mov_act["tmdb_movie_id"].isin(clean_movie_ids)]
    mov_act = mov_act[mov_act["tmdb_actor_id"].isin(clean_actor_ids)]
    mov_act["character"]  = mov_act["character"].fillna("Unknown")
    mov_act["cast_order"] = pd.to_numeric(mov_act["cast_order"], errors="coerce").fillna(99).astype(int)
    mov_act = mov_act.drop_duplicates()
    mov_act = mov_act.reset_index(drop=True)
    
    print(f"  ✓ Clean movie-director links: {len(mov_dir)}")
    print(f"  ✓ Clean movie-actor links: {len(mov_act)}")
    
    return mov_dir, mov_act


def save_clean_data(movies, directors, actors, mov_dir, mov_act):
    """Save all cleaned dataframes as new CSVs."""
    print("\n💾 Saving cleaned data...")
    
    movies.to_csv(os.path.join(DATA_DIR, "movies_clean.csv"), index=False)
    directors.to_csv(os.path.join(DATA_DIR, "directors_clean.csv"), index=False)
    actors.to_csv(os.path.join(DATA_DIR, "actors_clean.csv"), index=False)
    mov_dir.to_csv(os.path.join(DATA_DIR, "movie_director_links_clean.csv"), index=False)
    mov_act.to_csv(os.path.join(DATA_DIR, "movie_actor_links_clean.csv"), index=False)
    
    print("  ✓ movies_clean.csv")
    print("  ✓ directors_clean.csv")
    print("  ✓ actors_clean.csv")
    print("  ✓ movie_director_links_clean.csv")
    print("  ✓ movie_actor_links_clean.csv")


if __name__ == "__main__":
    # Load
    movies, directors, actors, mov_dir, mov_act = load_raw_data()
    
    # Clean
    movies    = clean_movies(movies)
    directors = clean_directors(directors)
    actors    = clean_actors(actors)
    
    # Clean links using cleaned IDs
    mov_dir, mov_act = clean_links(
        mov_dir, mov_act,
        clean_movie_ids=set(movies["tmdb_id"]),
        clean_director_ids=set(directors["tmdb_person_id"]),
        clean_actor_ids=set(actors["tmdb_person_id"]),
    )
    
    # Save
    save_clean_data(movies, directors, actors, mov_dir, mov_act)
    
    print("\n✅ All data cleaned and saved!")
    print(f"📊 Final counts:")
    print(f"   Movies:              {len(movies)}")
    print(f"   Directors:           {len(directors)}")
    print(f"   Actors:              {len(actors)}")
    print(f"   Movie-Director links:{len(mov_dir)}")
    print(f"   Movie-Actor links:   {len(mov_act)}")