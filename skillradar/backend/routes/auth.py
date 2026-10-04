from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from config import Config
from extensions import db
from models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/signup")
def signup():
    body = request.get_json(force=True) or {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not name or not email or len(password) < 6:
        return jsonify({"error": "name, email, and a password of 6+ characters are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists"}), 409

    user = User(
        name=name,
        email=email,
        current_role=body.get("current_role"),
        is_admin=email in Config.ADMIN_EMAILS,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@bp.post("/login")
def login():
    body = request.get_json(force=True) or {}
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Keep is_admin in sync with .env in case ADMIN_EMAILS changed since signup.
    should_be_admin = email in Config.ADMIN_EMAILS
    if user.is_admin != should_be_admin:
        user.is_admin = should_be_admin
        db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.to_dict())
