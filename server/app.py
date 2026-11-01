from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from routes import api_bp

# Load environment variables (e.g., OPENAI_API_KEY)
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# Register the routes from routes.py
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)