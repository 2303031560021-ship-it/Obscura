import requests
import pandas as pd
import os
import time
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv(r"C:\Users\Rishi Patel\OneDrive\Desktop\Obscura\backend\.env")
API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"


def create_session():
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    return session


def fetch_movie_cast(tmdb_id, session):
    """
    Fetches the cast for a single movie.
    We limit to top 10 actors (order <= 10).
    WHY TOP 10? Lead actors matter most for the
    collaboration network. Supporting roles with
    1 scene add noise, not value.
    """
    url = f"{BASE_URL}/movie/{tmdb_id}/credits"
    params = {"api_key": API_KEY, "language": "en-US"}

    try:
        response = session.get(url, params=params, timeout=15)
        time.sleep(0.25)

        if response.status_code == 200:
            data = response.json()
            cast = data.get("cast", [])

            # Only take top 10 billed actors
            top_cast = [c for c in cast if c.get("order", 99) < 10]
            return top_cast

    except Exception as e:
        print(f"  ✗ Error fetching cast for movie {tmdb_id}: {e}")

    return []


def fetch_actor_details(person_id, session):
    """
    Fetches full profile for an actor.
    Same as director details — we want photo,
    nationality, birthday for the UI cards.
    """
    url = f"{BASE_URL}/person/{person_id}"
    params = {"api_key": API_KEY, "language": "en-US"}

    try:
        response = session.get(url, params=params, timeout=15)
        time.sleep(0.25)

        if response.status_code == 200:
            p = response.json()
            return {
                "tmdb_person_id": p.get("id"),
                "name":           p.get("name"),
                "biography":      p.get("biography"),
                "birthday":       p.get("birthday"),
                "place_of_birth": p.get("place_of_birth"),
                "profile_path":   p.get("profile_path"),
                "popularity":     p.get("popularity"),
            }

    except Exception as e:
        print(f"  ✗ Error fetching actor {person_id}: {e}")

    return None


if __name__ == "__main__":
    # Step 1: Load movies
    movies_path = os.path.join(os.path.dirname(__file__), "movies_raw.csv")
    movies_df = pd.read_csv(movies_path)
    print(f"📂 Loaded {len(movies_df)} movies from movies_raw.csv")

    session = create_session()

    all_actors = {}         # person_id → actor details (no duplicates)
    movie_actor_links = []  # {tmdb_movie_id, tmdb_actor_id, character, order}

    total = len(movies_df)

    # Step 2: Loop through every movie
    for i, row in movies_df.iterrows():
        tmdb_id = row["tmdb_id"]
        title = row["title"]

        if i % 100 == 0:
            print(f"  Progress: {i}/{total} movies processed...")

        cast = fetch_movie_cast(tmdb_id, session)

        for actor in cast:
            person_id = actor.get("id")

            if not person_id:
                continue

            # Save movie↔actor link
            movie_actor_links.append({
                "tmdb_movie_id": tmdb_id,
                "tmdb_actor_id": person_id,
                "movie_title":   title,
                "character":     actor.get("character"),
                "cast_order":    actor.get("order"),
            })

            # Fetch full profile only once per actor
            if person_id not in all_actors:
                details = fetch_actor_details(person_id, session)
                if details:
                    all_actors[person_id] = details
                    print(f"    ✓ New actor: {details['name']}")

    # Step 3: Save actors CSV
    actors_df = pd.DataFrame(all_actors.values())
    actors_path = os.path.join(os.path.dirname(__file__), "actors_raw.csv")
    actors_df.to_csv(actors_path, index=False)
    print(f"\n✅ {len(actors_df)} unique actors saved to actors_raw.csv")

    # Step 4: Save movie↔actor links CSV
    links_df = pd.DataFrame(movie_actor_links)
    links_path = os.path.join(os.path.dirname(__file__), "movie_actor_links.csv")
    links_df.to_csv(links_path, index=False)
    print(f"✅ {len(links_df)} movie-actor links saved to movie_actor_links.csv")

    print(f"\n🎬 Done!")
    print(f"👥 Unique actors: {len(actors_df)}")
    print(f"🔗 Movie-actor links: {len(links_df)}")