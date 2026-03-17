import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TMDB_API_KEY")
url = f"https://api.themoviedb.org/3/movie/popular?api_key={API_KEY}&language=en-US&page=1"

response = requests.get(url)
data = response.json()

print(f"Status: {response.status_code}")
print(f"Total results: {data['total_results']}")
print(f"First movie: {data['results'][0]['title']}")