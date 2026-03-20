from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config import engine

genres_bp = Blueprint("genres", __name__)


def run_query(sql, params=None):
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]


# ─────────────────────────────────────────────
# GET /api/genres
# Returns all genres with movie counts
# Used by: Genre Analytics page, filters
# ─────────────────────────────────────────────
@genres_bp.route("/api/genres", methods=["GET"])
def get_genres():
    sql = """
        SELECT
            cinema_type         AS genre,
            COUNT(*)            AS total_movies,
            ROUND(AVG(rating)::numeric, 2) AS avg_rating,
            ROUND(AVG(popularity)::numeric, 2) AS avg_popularity
        FROM movies
        WHERE vote_count > 50
        GROUP BY cinema_type
        ORDER BY total_movies DESC
    """
    genres = run_query(sql)
    return jsonify({"genres": genres})


# ─────────────────────────────────────────────
# GET /api/genres/analytics
# Returns rating + popularity trends by cinema type
# Used by: Genre Analytics page charts
# ─────────────────────────────────────────────
@genres_bp.route("/api/genres/analytics", methods=["GET"])
def get_genre_analytics():
    # Rating trend over years per cinema type
    rating_trend_sql = """
        SELECT
            cinema_type,
            release_year,
            ROUND(AVG(rating)::numeric, 2)    AS avg_rating,
            ROUND(AVG(popularity)::numeric, 2) AS avg_popularity,
            COUNT(*)                           AS movie_count
        FROM movies
        WHERE vote_count > 50
        AND release_year >= 1990
        AND release_year <= 2024
        GROUP BY cinema_type, release_year
        ORDER BY cinema_type, release_year
    """
    rating_trends = run_query(rating_trend_sql)

    # Overall stats per cinema type
    overall_sql = """
        SELECT
            cinema_type,
            COUNT(*)                              AS total_movies,
            ROUND(AVG(rating)::numeric, 2)        AS avg_rating,
            ROUND(AVG(popularity)::numeric, 2)    AS avg_popularity,
            ROUND(MAX(rating)::numeric, 2)        AS highest_rating,
            ROUND(MIN(rating)::numeric, 2)        AS lowest_rating,
            MAX(release_year)                     AS latest_year,
            MIN(release_year)                     AS earliest_year
        FROM movies
        WHERE vote_count > 50
        GROUP BY cinema_type
        ORDER BY avg_rating DESC
    """
    overall = run_query(overall_sql)

    # Top movie per cinema type
    top_movies_sql = """
        SELECT DISTINCT ON (cinema_type)
            cinema_type,
            title,
            rating,
            release_year,
            poster_path
        FROM movies
        WHERE vote_count > 500
        ORDER BY cinema_type, rating DESC
    """
    top_movies = run_query(top_movies_sql)

    return jsonify({
        "rating_trends": rating_trends,
        "overall":       overall,
        "top_movies":    top_movies
    })


# ─────────────────────────────────────────────
# GET /api/genres/distribution
# Returns movie count by decade per cinema type
# Used by: Genre Analytics page - decade chart
# ─────────────────────────────────────────────
@genres_bp.route("/api/genres/distribution", methods=["GET"])
def get_genre_distribution():
    sql = """
        SELECT
            cinema_type,
            (release_year / 10) * 10  AS decade,
            COUNT(*)                  AS movie_count,
            ROUND(AVG(rating)::numeric, 2) AS avg_rating
        FROM movies
        WHERE vote_count > 50
        AND release_year >= 1950
        GROUP BY cinema_type, decade
        ORDER BY decade, cinema_type
    """
    distribution = run_query(sql)
    return jsonify({"distribution": distribution})