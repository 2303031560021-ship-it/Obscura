from flask import Flask
from flask_cors import CORS
from config import engine
from models import Base
from routes.movies import movies_bp
from routes.directors import directors_bp
from routes.genres import genres_bp
from routes.global_cinema import global_cinema_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(movies_bp)
app.register_blueprint(directors_bp)
app.register_blueprint(genres_bp)
app.register_blueprint(global_cinema_bp)

Base.metadata.create_all(bind=engine)

@app.route("/")
def home():
    return {"message": "Obscura API is running"}

if __name__ == "__main__":
    app.run(debug=True)