"""Shared Flask extension instances, created here to avoid circular imports
between app.py and the route/model modules."""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
