from flask import Blueprint, jsonify, request
from sqlalchemy import text
from config import engine

directors_bp = Blueprint("directors", __name__)


def run_query(sql, params=None):
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        rows = result.fetchall()
        keys = result.keys()
        return [dict(zip(keys, row)) for row in rows]


# ─────────────────────────────────────────────
# GET /api/directors
# Returns all directors with success score
# Used by: Directors page
# ─────────────────────────────────────────────
@directors_bp.route("/api/directors", methods=["GET"])
def get_directors():
    limit  = request.args.get("limit", 50)
    offset = request.args.get("offset", 0)
    search = request.args.get("search")

    search_sql = ""
    params = {"limit": int(limit), "offset": int(offset)}

    if search:
        search_sql = "AND d.name ILIKE :search"
        params["search"] = f"%{search}%"

    sql = f"""
        SELECT
            d.id,
            d.tmdb_person_id,
            d.name,
            d.place_of_birth,
            d.profile_path,
            d.popularity,
            COUNT(md.movie_id)              AS total_films,
            ROUND(AVG(m.rating)::numeric, 2) AS avg_rating,
            ROUND(AVG(m.popularity)::numeric, 2) AS avg_popularity,
            MAX(m.title)                    AS best_film,

            -- SUCCESS SCORE FORMULA
            -- avg_rating * 0.4 + avg_popularity_normalized * 0.3 + consistency * 0.3
            ROUND((
                (AVG(m.rating) * 0.4) +
                (LEAST(AVG(m.popularity) / 100.0, 1.0) * 30 * 0.3) +
                (CASE 
                    WHEN STDDEV(m.rating) IS NULL THEN 0
                    ELSE GREATEST(0, (1 - STDDEV(m.rating) / 10.0)) * 30 * 0.3
                END)
            )::numeric, 2) AS success_score

        FROM directors d
        JOIN movie_directors md ON md.director_id = d.id
        JOIN movies m ON m.id = md.movie_id
        WHERE m.vote_count > 50
        {search_sql}
        GROUP BY d.id, d.tmdb_person_id, d.name, d.place_of_birth,
                 d.profile_path, d.popularity
        HAVING COUNT(md.movie_id) >= 2
        ORDER BY success_score DESC
        LIMIT :limit OFFSET :offset
    """

    directors = run_query(sql, params)

    count_sql = f"""
        SELECT COUNT(*) as total FROM (
            SELECT d.id
            FROM directors d
            JOIN movie_directors md ON md.director_id = d.id
            JOIN movies m ON m.id = md.movie_id
            WHERE m.vote_count > 50
            {search_sql}
            GROUP BY d.id
            HAVING COUNT(md.movie_id) >= 2
        ) sub
    """
    count_params = {k: v for k, v in params.items() if k not in ["limit", "offset"]}
    total = run_query(count_sql, count_params)[0]["total"]

    return jsonify({
        "directors": directors,
        "total": total,
        "limit": int(limit),
        "offset": int(offset)
    })


# ─────────────────────────────────────────────
# GET /api/directors/<tmdb_person_id>
# Returns full director profile
# Used by: Director Profile page
# ─────────────────────────────────────────────
@directors_bp.route("/api/directors/<int:tmdb_person_id>", methods=["GET"])
def get_director(tmdb_person_id):
    # Basic director info
    sql = """
        SELECT
            d.id, d.tmdb_person_id, d.name, d.biography,
            d.birthday, d.place_of_birth, d.profile_path, d.popularity,
            COUNT(md.movie_id)               AS total_films,
            ROUND(AVG(m.rating)::numeric, 2)  AS avg_rating,
            ROUND(AVG(m.popularity)::numeric, 2) AS avg_popularity,
            ROUND((
                (AVG(m.rating) * 0.4) +
                (LEAST(AVG(m.popularity) / 100.0, 1.0) * 30 * 0.3) +
                (CASE
                    WHEN STDDEV(m.rating) IS NULL THEN 0
                    ELSE GREATEST(0, (1 - STDDEV(m.rating) / 10.0)) * 30 * 0.3
                END)
            )::numeric, 2) AS success_score
        FROM directors d
        JOIN movie_directors md ON md.director_id = d.id
        JOIN movies m ON m.id = md.movie_id
        WHERE d.tmdb_person_id = :tmdb_person_id
        GROUP BY d.id, d.tmdb_person_id, d.name, d.biography,
                 d.birthday, d.place_of_birth, d.profile_path, d.popularity
    """
    directors = run_query(sql, {"tmdb_person_id": tmdb_person_id})

    if not directors:
        return jsonify({"error": "Director not found"}), 404

    director = directors[0]

    # Get all films by this director for career timeline
    films_sql = """
        SELECT
            m.tmdb_id, m.title, m.release_year,
            m.rating, m.vote_count, m.popularity,
            m.poster_path, m.cinema_type
        FROM movies m
        JOIN movie_directors md ON md.movie_id = m.id
        JOIN directors d ON d.id = md.director_id
        WHERE d.tmdb_person_id = :tmdb_person_id
        ORDER BY m.release_year ASC
    """
    films = run_query(films_sql, {"tmdb_person_id": tmdb_person_id})

    # Get best film
    best_film = max(films, key=lambda x: x["rating"]) if films else None

    director["films"]     = films
    director["best_film"] = best_film

    return jsonify(director)


# ─────────────────────────────────────────────
# GET /api/directors/<tmdb_person_id>/collaborations
# Returns D3.js network data
# Used by: Director Profile page - Collaboration Network
# ─────────────────────────────────────────────
@directors_bp.route("/api/directors/<int:tmdb_person_id>/collaborations", methods=["GET"])
def get_collaborations(tmdb_person_id):
    """
    This powers the D3.js force directed graph.
    We return nodes (director + actors) and links (connections).
    The more films together = stronger link = thicker line in D3.
    """
    sql = """
        SELECT
            a.tmdb_person_id  AS actor_id,
            a.name            AS actor_name,
            a.profile_path    AS actor_photo,
            COUNT(*)          AS films_together
        FROM directors d
        JOIN movie_directors md ON md.director_id = d.id
        JOIN movie_actors ma    ON ma.movie_id = md.movie_id
        JOIN actors a           ON a.id = ma.actor_id
        WHERE d.tmdb_person_id = :tmdb_person_id
        GROUP BY a.tmdb_person_id, a.name, a.profile_path
        HAVING COUNT(*) >= 1
        ORDER BY films_together DESC
        LIMIT 20
    """
    collaborators = run_query(sql, {"tmdb_person_id": tmdb_person_id})

    # Get director info for center node
    director_sql = """
        SELECT tmdb_person_id, name, profile_path
        FROM directors
        WHERE tmdb_person_id = :tmdb_person_id
    """
    director = run_query(director_sql, {"tmdb_person_id": tmdb_person_id})

    if not director:
        return jsonify({"error": "Director not found"}), 404

    # Format for D3.js
    # nodes = all people (director + actors)
    # links = connections between director and each actor
    nodes = [{
        "id":    f"director_{tmdb_person_id}",
        "name":  director[0]["name"],
        "photo": director[0]["profile_path"],
        "type":  "director"
    }]

    links = []

    for actor in collaborators:
        nodes.append({
            "id":            f"actor_{actor['actor_id']}",
            "name":          actor["actor_name"],
            "photo":         actor["actor_photo"],
            "type":          "actor",
            "films_together": actor["films_together"]
        })
        links.append({
            "source":        f"director_{tmdb_person_id}",
            "target":        f"actor_{actor['actor_id']}",
            "films_together": actor["films_together"]
        })

    return jsonify({
        "nodes": nodes,
        "links": links
    })


# ─────────────────────────────────────────────
# GET /api/directors/top
# Returns top 10 directors by success score
# Used by: Home page
# ─────────────────────────────────────────────
@directors_bp.route("/api/directors/top", methods=["GET"])
def get_top_directors():
    sql = """
        SELECT
            d.tmdb_person_id,
            d.name,
            d.profile_path,
            d.place_of_birth,
            COUNT(md.movie_id) AS total_films,
            ROUND(AVG(m.rating)::numeric, 2) AS avg_rating,
            ROUND((
                (AVG(m.rating) * 0.4) +
                (LEAST(AVG(m.popularity) / 100.0, 1.0) * 30 * 0.3) +
                (CASE
                    WHEN STDDEV(m.rating) IS NULL THEN 0
                    ELSE GREATEST(0, (1 - STDDEV(m.rating) / 10.0)) * 30 * 0.3
                END)
            )::numeric, 2) AS success_score
        FROM directors d
        JOIN movie_directors md ON md.director_id = d.id
        JOIN movies m ON m.id = md.movie_id
        WHERE m.vote_count > 100
        GROUP BY d.id, d.tmdb_person_id, d.name, d.profile_path, d.place_of_birth
        HAVING COUNT(md.movie_id) >= 3
        ORDER BY success_score DESC
        LIMIT 10
    """
    directors = run_query(sql)
    return jsonify({"directors": directors})