from flask import Flask
from flask_cors import CORS
from config import engine
from models import Base
from routes.movies import movies_bp
from routes.directors import directors_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
# WHY BLUEPRINTS? They let us split routes into separate files
# instead of having one massive app.py with 20+ routes
app.register_blueprint(movies_bp)
app.register_blueprint(directors_bp)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

@app.route("/")
def home():
    return {"message": "Obscura API is running"}

if __name__ == "__main__":
    app.run(debug=True)

