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


def fetch_director_details(person_id, session):
    """
    After finding who directed a movie, we fetch
    that person's full profile — nationality, birthday,
    biography, profile photo.
    WHY? The Director Profile page needs all of this.
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
        print(f"    ✗ Error fetching person {person_id}: {e}")
    
    return None


def fetch_movie_credits(tmdb_id, session):
    """
    Every movie has a /credits endpoint on TMDB.
    It returns the full cast AND crew.
    We filter crew to find job == 'Director'.
    One movie can have multiple directors (rare but happens).
    """
    url = f"{BASE_URL}/movie/{tmdb_id}/credits"
    params = {"api_key": API_KEY, "language": "en-US"}
    
    try:
        response = session.get(url, params=params, timeout=15)
        time.sleep(0.25)
        
        if response.status_code == 200:
            data = response.json()
            crew = data.get("crew", [])
            
            # Filter crew to only directors
            directors = [
                member for member in crew
                if member.get("job") == "Director"
            ]
            return directors
            
    except Exception as e:
        print(f"  ✗ Error fetching credits for movie {tmdb_id}: {e}")
    
    return []


if __name__ == "__main__":
    # Step 1: Load movies we already fetched
    movies_path = os.path.join(os.path.dirname(__file__), "movies_raw.csv")
    movies_df = pd.read_csv(movies_path)
    print(f"📂 Loaded {len(movies_df)} movies from movies_raw.csv")
    
    session = create_session()
    
    all_directors = {}      # person_id → director details (avoids duplicates)
    movie_director_links = []  # list of {tmdb_id, director_person_id}
    
    total = len(movies_df)
    
    # Step 2: Loop through every movie
    for i, row in movies_df.iterrows():
        tmdb_id = row["tmdb_id"]
        title = row["title"]
        
        # Progress indicator every 100 movies
        if i % 100 == 0:
            print(f"  Progress: {i}/{total} movies processed...")
        
        # Get credits for this movie
        directors = fetch_movie_credits(tmdb_id, session)
        
        for director in directors:
            person_id = director.get("id")
            
            if not person_id:
                continue
            
            # Save the movie↔director link
            movie_director_links.append({
                "tmdb_movie_id":    tmdb_id,
                "tmdb_director_id": person_id,
                "movie_title":      title,
            })
            
            # Only fetch full director details if we haven't seen them before
            # WHY? Same director makes many movies — fetch their profile once only
            if person_id not in all_directors:
                details = fetch_director_details(person_id, session)
                if details:
                    all_directors[person_id] = details
                    print(f"    ✓ New director: {details['name']}")
    
    # Step 3: Save directors to CSV
    directors_df = pd.DataFrame(all_directors.values())
    directors_path = os.path.join(os.path.dirname(__file__), "directors_raw.csv")
    directors_df.to_csv(directors_path, index=False)
    print(f"\n✅ {len(directors_df)} unique directors saved to directors_raw.csv")
    
    # Step 4: Save movie↔director links to CSV
    links_df = pd.DataFrame(movie_director_links)
    links_path = os.path.join(os.path.dirname(__file__), "movie_director_links.csv")
    links_df.to_csv(links_path, index=False)
    print(f"✅ {len(links_df)} movie-director links saved to movie_director_links.csv")
    
    print(f"\n🎬 Done! Top directors by film count:")
    print(links_df["movie_title"].count())