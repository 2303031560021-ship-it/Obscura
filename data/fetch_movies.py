import requests
import pandas as pd
import os
import time
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# CORRECT ORDER
load_dotenv(r"C:\Users\Rishi Patel\OneDrive\Desktop\Obscura\backend\.env")
# CORRECT - the variable name goes inside getenv, not the key itself
API_KEY = os.getenv("TMDB_API_KEY")

BASE_URL = "https://api.themoviedb.org/3"


def create_session():
    # Retry transient network/server errors to avoid failing entire fetch.
    session = requests.Session()
    retries = Retry(
        total=4,
        connect=4,
        read=4,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def validate_api_key():
    if not API_KEY:
        raise RuntimeError(
            "TMDB_API_KEY is missing. Add TMDB_API_KEY=... to your .env file."
        )

# ─────────────────────────────────────────────
# WHY THESE REGIONS?
# Your Global Cinema page compares Hollywood vs
# Bollywood vs Korean vs Japanese cinema.
# Each region has a TMDB language/region code.
# ─────────────────────────────────────────────
REGIONS = [
    {"name": "Hollywood",  "language": "en", "region": "US"},
    {"name": "Bollywood",  "language": "hi", "region": "IN"},
    {"name": "Korean",     "language": "ko", "region": "KR"},
    {"name": "Japanese",   "language": "ja", "region": "JP"},
    {"name": "French",     "language": "fr", "region": "FR"},
]

def fetch_movies_by_region(language, region, pages=50):
    """
    Fetch movies for a specific region.
    50 pages × 20 movies = 1,000 movies per region.
    5 regions × 1,000 = 5,000+ movies minimum.
    We also add popular + top_rated on top of this.
    """
    movies = []
    session = create_session()
    
    for page in range(1, pages + 1):
        url = f"{BASE_URL}/discover/movie"
        params = {
            "api_key": API_KEY,
            "language": "en-US",        # response in English
            "with_original_language": language,
            "region": region,
            "sort_by": "popularity.desc",
            "page": page,
            "vote_count.gte": 50,       # filter out obscure films with fake ratings
        }
        
        try:
            response = session.get(url, params=params, timeout=20)
            
            # TMDB rate limit: 40 requests per 10 seconds
            # We sleep 0.25s between calls to stay safe
            time.sleep(0.25)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                if not results:
                    # No more movies for this region, stop early
                    break
                    
                for movie in results:
                    movies.append({
                        "tmdb_id":       movie.get("id"),
                        "title":         movie.get("title"),
                        "original_title":movie.get("original_title"),
                        "overview":      movie.get("overview"),
                        "release_date":  movie.get("release_date"),
                        "rating":        movie.get("vote_average"),
                        "vote_count":    movie.get("vote_count"),
                        "popularity":    movie.get("popularity"),
                        "poster_path":   movie.get("poster_path"),
                        "backdrop_path": movie.get("backdrop_path"),
                        "original_language": movie.get("original_language"),
                        "region":        region,
                        "cinema_type":   get_cinema_label(language),
                    })
                    
                print(f"  ✓ {region} page {page} — {len(results)} movies fetched")
                
            elif response.status_code == 429:
                # 429 = Too Many Requests — TMDB is rate limiting us
                print(f"  ⚠ Rate limited on page {page}. Sleeping 10 seconds...")
                time.sleep(10)

            elif response.status_code == 401:
                print("  ✗ Unauthorized (401): check TMDB_API_KEY in .env")
                break
                
            else:
                print(f"  ✗ Error on page {page}: Status {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Exception on page {page}: {e}")
            continue
    
    return movies


def fetch_popular_and_toprated(pages=100):
    """
    Fetch globally popular + top rated movies.
    These are mostly Hollywood but give us strong
    rating/revenue data for comparisons.
    100 pages × 20 = 2,000 additional movies.
    """
    movies = []
    session = create_session()
    endpoints = ["popular", "top_rated"]
    
    for endpoint in endpoints:
        print(f"\n📡 Fetching /movie/{endpoint}...")
        for page in range(1, pages + 1):
            url = f"{BASE_URL}/movie/{endpoint}"
            params = {
                "api_key": API_KEY,
                "language": "en-US",
                "page": page,
            }
            
            try:
                response = session.get(url, params=params, timeout=20)
                time.sleep(0.25)
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    
                    if not results:
                        break
                    
                    for movie in results:
                        movies.append({
                            "tmdb_id":       movie.get("id"),
                            "title":         movie.get("title"),
                            "original_title":movie.get("original_title"),
                            "overview":      movie.get("overview"),
                            "release_date":  movie.get("release_date"),
                            "rating":        movie.get("vote_average"),
                            "vote_count":    movie.get("vote_count"),
                            "popularity":    movie.get("popularity"),
                            "poster_path":   movie.get("poster_path"),
                            "backdrop_path": movie.get("backdrop_path"),
                            "original_language": movie.get("original_language"),
                            "region":        "GLOBAL",
                            "cinema_type":   "Hollywood",
                        })
                        
                    print(f"  ✓ {endpoint} page {page} — {len(results)} movies")
                    
                elif response.status_code == 429:
                    print(f"  ⚠ Rate limited. Sleeping 10 seconds...")
                    time.sleep(10)

                elif response.status_code == 401:
                    print("  ✗ Unauthorized (401): check TMDB_API_KEY in .env")
                    return movies

                else:
                    print(f"  ✗ Error on {endpoint} page {page}: Status {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"  ✗ Exception on {endpoint} page {page}: {e}")
                continue
    
    return movies


def get_cinema_label(language_code):
    """
    Maps language code to cinema type label.
    This is what powers your Global Cinema page filters.
    """
    mapping = {
        "en": "Hollywood",
        "hi": "Bollywood",
        "ko": "Korean",
        "ja": "Japanese",
        "fr": "French",
    }
    return mapping.get(language_code, "World Cinema")


def remove_duplicates(movies):
    """
    The same movie can appear in multiple fetches.
    We deduplicate by tmdb_id — each movie has a unique TMDB ID.
    """
    seen = set()
    unique = []
    for movie in movies:
        if movie["tmdb_id"] not in seen:
            seen.add(movie["tmdb_id"])
            unique.append(movie)
    return unique


# ─────────────────────────────────────────────
# MAIN — runs when you execute this script
# ─────────────────────────────────────────────
if __name__ == "__main__":
    validate_api_key()
    all_movies = []
    
    # Step 1: Fetch by region
    for region_config in REGIONS:
        print(f"\n🌍 Fetching {region_config['name']} movies...")
        region_movies = fetch_movies_by_region(
            language=region_config["language"],
            region=region_config["region"],
            pages=50  # 50 pages × 20 = 1,000 per region
        )
        all_movies.extend(region_movies)
        print(f"  → {len(region_movies)} {region_config['name']} movies collected")
    
    # Step 2: Fetch popular + top rated globally
    global_movies = fetch_popular_and_toprated(pages=50)
    all_movies.extend(global_movies)
    
    # Step 3: Remove duplicates
    print(f"\n🔄 Deduplicating... (had {len(all_movies)} total)")
    all_movies = remove_duplicates(all_movies)
    print(f"✅ {len(all_movies)} unique movies after deduplication")
    
    # Step 4: Save to CSV
    # WHY CSV? It's a checkpoint. If load_to_db.py fails later,
    # you don't have to re-fetch everything from TMDB again.
    df = pd.DataFrame(all_movies)
    output_path = os.path.join(os.path.dirname(__file__), "movies_raw.csv")
    df.to_csv(output_path, index=False)
    
    print(f"\n🎬 Done! Saved to data/movies_raw.csv")
    print(f"📊 Total unique movies: {len(df)}")
    print(f"🌍 Cinema breakdown:\n{df['cinema_type'].value_counts()}")