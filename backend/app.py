from flask import Flask
from flask_cors import CORS
from config import engine
from models import Base

app = Flask(__name__)
CORS(app)



Base.metadata.create_all(bind=engine)

@app.route("/")
def home():
    return {"message": "Obscura API is running"}

if __name__ == "__main__":
    app.run(debug=True)