from sqlalchemy import (
    Column, Integer, String, Float,
    Text, Date, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

# ─── GENRES ───────────────────────────────────────────
class Genre(Base):
    __tablename__ = "genres"

    id      = Column(Integer, primary_key=True)
    tmdb_id = Column(Integer, unique=True, nullable=False)
    name    = Column(String(100), nullable=False)

# ─── DIRECTORS ────────────────────────────────────────
class Director(Base):
    __tablename__ = "directors"

    id              = Column(Integer, primary_key=True)
    tmdb_person_id  = Column(Integer, unique=True, nullable=False)
    name            = Column(String(200), nullable=False)
    biography       = Column(Text)
    birthday        = Column(Date, nullable=True)
    place_of_birth  = Column(String(200))
    profile_path    = Column(String(300))
    popularity      = Column(Float)

    movies          = relationship("MovieDirector", back_populates="director")

# ─── ACTORS ───────────────────────────────────────────
class Actor(Base):
    __tablename__ = "actors"

    id              = Column(Integer, primary_key=True)
    tmdb_person_id  = Column(Integer, unique=True, nullable=False)
    name            = Column(String(200), nullable=False)
    biography       = Column(Text)
    birthday        = Column(Date, nullable=True)
    place_of_birth  = Column(String(200))
    profile_path    = Column(String(300))
    popularity      = Column(Float)

    movies          = relationship("MovieActor", back_populates="actor")

# ─── MOVIES ───────────────────────────────────────────
class Movie(Base):
    __tablename__ = "movies"

    id                  = Column(Integer, primary_key=True)
    tmdb_id             = Column(Integer, unique=True, nullable=False)
    title               = Column(String(300), nullable=False)
    original_title      = Column(String(300))
    overview            = Column(Text)
    release_date        = Column(Date, nullable=True)
    release_year        = Column(Integer)
    rating              = Column(Float)
    vote_count          = Column(Integer)
    popularity          = Column(Float)
    poster_path         = Column(String(300))
    backdrop_path       = Column(String(300))
    original_language   = Column(String(50))
    region              = Column(String(10))
    cinema_type         = Column(String(100))

    genres              = relationship("MovieGenre",    back_populates="movie")
    directors           = relationship("MovieDirector", back_populates="movie")
    actors              = relationship("MovieActor",    back_populates="movie")

# ─── MOVIE ↔ GENRE (junction) ─────────────────────────
class MovieGenre(Base):
    __tablename__ = "movie_genres"

    id       = Column(Integer, primary_key=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    genre_id = Column(Integer, ForeignKey("genres.id"), nullable=False)

    movie    = relationship("Movie", back_populates="genres")
    genre    = relationship("Genre")

    __table_args__ = (
        UniqueConstraint("movie_id", "genre_id"),
    )

# ─── MOVIE ↔ DIRECTOR (junction) ──────────────────────
class MovieDirector(Base):
    __tablename__ = "movie_directors"

    id          = Column(Integer, primary_key=True)
    movie_id    = Column(Integer, ForeignKey("movies.id"),    nullable=False)
    director_id = Column(Integer, ForeignKey("directors.id"), nullable=False)

    movie       = relationship("Movie",    back_populates="directors")
    director    = relationship("Director", back_populates="movies")

    __table_args__ = (
        UniqueConstraint("movie_id", "director_id"),
    )

# ─── MOVIE ↔ ACTOR (junction) ─────────────────────────
class MovieActor(Base):
    __tablename__ = "movie_actors"

    id             = Column(Integer, primary_key=True)
    movie_id       = Column(Integer, ForeignKey("movies.id"),  nullable=False)
    actor_id       = Column(Integer, ForeignKey("actors.id"),  nullable=False)
    character_name = Column(String(300))
    cast_order     = Column(Integer)

    movie          = relationship("Movie", back_populates="actors")
    actor          = relationship("Actor", back_populates="movies")

    __table_args__ = (
        UniqueConstraint("movie_id", "actor_id"),
    )

# ─── COLLABORATIONS ───────────────────────────────────
class Collaboration(Base):
    __tablename__ = "collaborations"

    id          = Column(Integer, primary_key=True)
    director_id = Column(Integer, ForeignKey("directors.id"), nullable=False)
    actor_id    = Column(Integer, ForeignKey("actors.id"),    nullable=False)
    film_count  = Column(Integer, default=1)

    director    = relationship("Director")
    actor       = relationship("Actor")

    __table_args__ = (
        UniqueConstraint("director_id", "actor_id"),
    )