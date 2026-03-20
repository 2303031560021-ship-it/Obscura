from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config import engine

movies_bp = Blueprint("movies", __name__)


def run_query(sql, params=None):
    """
    Helper function to run any SQL query and return results as list of dicts.
    WHY? So every route doesn't have to repeat connection handling code.
    """
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]


# ─────────────────────────────────────────────
# GET /api/movies
# Returns all movies with optional filters
# Used by: Movies page
# ─────────────────────────────────────────────
@movies_bp.route("/api/movies", methods=["GET"])
def get_movies():
    cinema_type = request.args.get("cinema_type")
    year        = request.args.get("year")
    min_rating  = request.args.get("min_rating")
    search      = request.args.get("search")
    limit       = request.args.get("limit", 50)
    offset      = request.args.get("offset", 0)

    # Build query dynamically based on filters provided
    # WHY DYNAMIC? User might filter by just year, or just rating,
    # or both — we only add WHERE clauses that are actually needed
    where_clauses = []
    params = {"limit": int(limit), "offset": int(offset)}

    if cinema_type:
        where_clauses.append("cinema_type = :cinema_type")
        params["cinema_type"] = cinema_type

    if year:
        where_clauses.append("release_year = :year")
        params["year"] = int(year)

    if min_rating:
        where_clauses.append("rating >= :min_rating")
        params["min_rating"] = float(min_rating)

    if search:
        where_clauses.append("title ILIKE :search")
        params["search"] = f"%{search}%"

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    sql = f"""
        SELECT 
            id, tmdb_id, title, original_title,
            release_year, rating, vote_count,
            popularity, poster_path, cinema_type,
            region, original_language
        FROM movies
        {where_sql}
        ORDER BY popularity DESC
        LIMIT :limit OFFSET :offset
    """

    movies = run_query(sql, params)

    # Also get total count for pagination
    count_sql = f"SELECT COUNT(*) as total FROM movies {where_sql}"
    count_params = {k: v for k, v in params.items() if k not in ["limit", "offset"]}
    total = run_query(count_sql, count_params)[0]["total"]

    return jsonify({
        "movies": movies,
        "total": total,
        "limit": int(limit),
        "offset": int(offset)
    })


# ─────────────────────────────────────────────
# GET /api/movies/trending
# Returns top 10 movies by popularity
# Used by: Home page
# ─────────────────────────────────────────────
@movies_bp.route("/api/movies/trending", methods=["GET"])
def get_trending():
    sql = """
        SELECT 
            id, tmdb_id, title, release_year,
            rating, popularity, poster_path, cinema_type
        FROM movies
        ORDER BY popularity DESC
        LIMIT 10
    """
    movies = run_query(sql)
    return jsonify({"movies": movies})


# ─────────────────────────────────────────────
# GET /api/movies/top-rated
# Returns top 10 movies by rating
# Used by: Home page
# ─────────────────────────────────────────────
@movies_bp.route("/api/movies/top-rated", methods=["GET"])
def get_top_rated():
    sql = """
        SELECT 
            id, tmdb_id, title, release_year,
            rating, vote_count, poster_path, cinema_type
        FROM movies
        WHERE vote_count > 1000
        ORDER BY rating DESC
        LIMIT 10
    """
    movies = run_query(sql)
    return jsonify({"movies": movies})


# ─────────────────────────────────────────────
# GET /api/movies/<tmdb_id>
# Returns single movie with full cast + director
# Used by: Movie Detail page
# ─────────────────────────────────────────────
@movies_bp.route("/api/movies/<int:tmdb_id>", methods=["GET"])
def get_movie(tmdb_id):
    # Get movie details
    sql = """
        SELECT *
        FROM movies
        WHERE tmdb_id = :tmdb_id
    """
    movies = run_query(sql, {"tmdb_id": tmdb_id})

    if not movies:
        return jsonify({"error": "Movie not found"}), 404

    movie = movies[0]

    # Get cast for this movie
    cast_sql = """
        SELECT 
            a.tmdb_person_id, a.name, a.profile_path,
            ma.character_name, ma.cast_order
        FROM movie_actors ma
        JOIN actors a ON a.id = ma.actor_id
        JOIN movies m ON m.id = ma.movie_id
        WHERE m.tmdb_id = :tmdb_id
        ORDER BY ma.cast_order ASC
        LIMIT 10
    """
    cast = run_query(cast_sql, {"tmdb_id": tmdb_id})

    # Get director for this movie
    director_sql = """
        SELECT 
            d.tmdb_person_id, d.name, d.profile_path,
            d.place_of_birth, d.popularity
        FROM movie_directors md
        JOIN directors d ON d.id = md.director_id
        JOIN movies m ON m.id = md.movie_id
        WHERE m.tmdb_id = :tmdb_id
    """
    directors = run_query(director_sql, {"tmdb_id": tmdb_id})

    # Get genre average rating for comparison
    genre_avg_sql = """
        SELECT AVG(m2.rating) as genre_avg_rating
        FROM movies m2
        WHERE m2.cinema_type = :cinema_type
        AND m2.vote_count > 100
    """
    genre_avg = run_query(genre_avg_sql, {"cinema_type": movie["cinema_type"]})

    movie["cast"]             = cast
    movie["directors"]        = directors
    movie["genre_avg_rating"] = round(genre_avg[0]["genre_avg_rating"] or 0, 2)

    return jsonify(movie)


# ─────────────────────────────────────────────
# GET /api/movies/stats
# Returns overall stats for Home page hero section
# ─────────────────────────────────────────────
@movies_bp.route("/api/movies/stats", methods=["GET"])
def get_stats():
    sql = """
        SELECT
            COUNT(*)                    as total_movies,
            ROUND(AVG(rating)::numeric, 2) as avg_rating,
            COUNT(DISTINCT cinema_type) as total_cinema_types,
            COUNT(DISTINCT release_year) as years_covered,
            MAX(release_year)           as latest_year,
            MIN(release_year)           as earliest_year
        FROM movies
        WHERE vote_count > 0
    """
    stats = run_query(sql)
    return jsonify(stats[0])