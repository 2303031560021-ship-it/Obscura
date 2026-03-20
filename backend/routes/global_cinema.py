from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config import engine

global_cinema_bp = Blueprint("global_cinema", __name__)


def run_query(sql, params=None):
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]


# ─────────────────────────────────────────────
# GET /api/global/stats
# Returns hero stats for Home page
# ─────────────────────────────────────────────
@global_cinema_bp.route("/api/global/stats", methods=["GET"])
def get_global_stats():
    sql = """
        SELECT
            COUNT(*)                          AS total_movies,
            COUNT(DISTINCT cinema_type)       AS total_industries,
            ROUND(AVG(rating)::numeric, 2)    AS avg_rating,
            COUNT(DISTINCT release_year)      AS years_covered,
            MAX(release_year)                 AS latest_year
        FROM movies
        WHERE vote_count > 0
    """
    stats = run_query(sql)

    # Total directors
    directors_sql = """
        SELECT COUNT(*) AS total_directors FROM directors
    """
    directors = run_query(directors_sql)

    # Total actors
    actors_sql = """
        SELECT COUNT(*) AS total_actors FROM actors
    """
    actors = run_query(actors_sql)

    result = stats[0]
    result["total_directors"] = directors[0]["total_directors"]
    result["total_actors"]    = actors[0]["total_actors"]

    return jsonify(result)


# ─────────────────────────────────────────────
# GET /api/global/comparison
# Hollywood vs Bollywood vs Korean vs Japanese
# Used by: Global Cinema page
# ─────────────────────────────────────────────
@global_cinema_bp.route("/api/global/comparison", methods=["GET"])
def get_global_comparison():
    sql = """
        SELECT
            cinema_type,
            COUNT(*)                              AS total_movies,
            ROUND(AVG(rating)::numeric, 2)        AS avg_rating,
            ROUND(AVG(popularity)::numeric, 2)    AS avg_popularity,
            ROUND(AVG(vote_count)::numeric, 0)    AS avg_votes,
            MAX(release_year)                     AS latest_year,
            MIN(release_year)                     AS earliest_year,
            COUNT(DISTINCT release_year)          AS active_years
        FROM movies
        WHERE vote_count > 50
        GROUP BY cinema_type
        ORDER BY avg_rating DESC
    """
    comparison = run_query(sql)
    return jsonify({"comparison": comparison})


# ─────────────────────────────────────────────
# GET /api/global/trends
# Growth trends over years by cinema type
# Used by: Global Cinema page - trend chart
# ─────────────────────────────────────────────
@global_cinema_bp.route("/api/global/trends", methods=["GET"])
def get_global_trends():
    sql = """
        SELECT
            cinema_type,
            release_year,
            COUNT(*)                              AS movie_count,
            ROUND(AVG(rating)::numeric, 2)        AS avg_rating,
            ROUND(AVG(popularity)::numeric, 2)    AS avg_popularity
        FROM movies
        WHERE vote_count > 50
        AND release_year >= 1990
        AND release_year <= 2024
        GROUP BY cinema_type, release_year
        ORDER BY release_year, cinema_type
    """
    trends = run_query(sql)
    return jsonify({"trends": trends})


# ─────────────────────────────────────────────
# GET /api/global/top-per-industry
# Top rated movie from each cinema type
# Used by: Global Cinema page
# ─────────────────────────────────────────────
@global_cinema_bp.route("/api/global/top-per-industry", methods=["GET"])
def get_top_per_industry():
    sql = """
        SELECT DISTINCT ON (cinema_type)
            cinema_type,
            title,
            release_year,
            rating,
            vote_count,
            poster_path,
            overview
        FROM movies
        WHERE vote_count > 500
        ORDER BY cinema_type, rating DESC
    """
    top = run_query(sql)
    return jsonify({"top_per_industry": top})


# ─────────────────────────────────────────────
# GET /api/global/directors-by-industry
# Top directors per cinema type
# Used by: Global Cinema page
# ─────────────────────────────────────────────
@global_cinema_bp.route("/api/global/directors-by-industry", methods=["GET"])
def get_directors_by_industry():
    sql = """
        SELECT
            m.cinema_type,
            d.name            AS director_name,
            d.tmdb_person_id,
            d.profile_path,
            COUNT(*)          AS total_films,
            ROUND(AVG(m.rating)::numeric, 2) AS avg_rating
        FROM directors d
        JOIN movie_directors md ON md.director_id = d.id
        JOIN movies m ON m.id = md.movie_id
        WHERE m.vote_count > 100
        GROUP BY m.cinema_type, d.name, d.tmdb_person_id, d.profile_path
        HAVING COUNT(*) >= 2
        ORDER BY m.cinema_type, avg_rating DESC
    """
    directors = run_query(sql)
    return jsonify({"directors_by_industry": directors})