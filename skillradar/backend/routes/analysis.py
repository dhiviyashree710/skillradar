from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import User
from services.skill_matcher import analyze_gap

bp = Blueprint("analysis", __name__, url_prefix="/api/analysis")


@bp.get("")
@jwt_required()
def get_analysis():
    """Runs the rule-based gap analysis for the logged-in user against
    their saved target_role + experience_level."""
    user = User.query.get_or_404(int(get_jwt_identity()))

    if not user.target_role:
        return jsonify({"error": "Set a target_role first via PUT /api/profile/target"}), 400

    user_skill_ids = [s.skill_id for s in user.skills]
    try:
        result = analyze_gap(user_skill_ids, user.target_role, user.experience_level or "Fresher")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(result)
