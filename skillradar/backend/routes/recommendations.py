from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import User
from services.skill_matcher import analyze_gap, recommend_courses_for_skills

bp = Blueprint("recommendations", __name__, url_prefix="/api/recommendations")


@bp.get("")
@jwt_required()
def get_recommendations():
    """Courses matched to the user's current missing/developing skills.
    ?free=true|false filters; omit for both."""
    user = User.query.get_or_404(int(get_jwt_identity()))
    if not user.target_role:
        return jsonify({"error": "Set a target_role first"}), 400

    user_skill_ids = [s.skill_id for s in user.skills]
    gap = analyze_gap(user_skill_ids, user.target_role, user.experience_level or "Fresher")

    free_param = request.args.get("free")
    free_only = {"true": True, "false": False}.get(free_param)

    courses = recommend_courses_for_skills(gap["missing_skill_ids"], free_only=free_only)
    return jsonify({"courses": courses})
