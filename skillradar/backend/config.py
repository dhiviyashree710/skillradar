import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'skillradar.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    DATA_DIR = os.path.join(BASE_DIR, "data")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB upload limit for resumes

    # Comma-separated emails that get is_admin=True automatically on signup
    # (and retroactively on login, in case they signed up before being added
    # here). Set your own email in .env to unlock the Admin Panel screen.
    ADMIN_EMAILS = {
        e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()
    }
