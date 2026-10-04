from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import User, UserSkill
from services.resume_parser import extract_text, UnsupportedFileType
from services.skill_matcher import extract_skills_with_ml_assist, resolve_skill_id, list_skills, list_roles

bp = Blueprint("profile", __name__, url_prefix="/api/profile")


@bp.get("/skills-catalog")
def skills_catalog():
    """Public: powers the onboarding skill-chip autocomplete."""
    return jsonify({
        "skills": [{"id": s["id"], "name": s["name"], "category": s["category"]} for s in list_skills()],
        "roles": list_roles(),
    })


@bp.put("/skills")
@jwt_required()
def set_skills():
    """Replace the current user's skill list with the given names/ids."""
    body = request.get_json(force=True) or {}
    raw_skills = body.get("skills", [])

    resolved = []
    unresolved = []
    for name in raw_skills:
        skill_id = resolve_skill_id(name)
        (resolved if skill_id else unresolved).append(skill_id or name)

    user_id = int(get_jwt_identity())
    UserSkill.query.filter_by(user_id=user_id).delete()
    for skill_id in set(resolved):
        db.session.add(UserSkill(user_id=user_id, skill_id=skill_id))
    db.session.commit()

    return jsonify({"added": resolved, "unrecognized": unresolved})


@bp.post("/resume")
@jwt_required()
def upload_resume():
    """Extracts text from an uploaded resume and returns the skills it
    recognizes — the frontend shows these as pre-filled chips for the user
    to confirm, rather than silently trusting the parse. Combines plain
    keyword matching with the trained model in backend/ml/, if one exists
    (ml_used tells the frontend which happened, purely informational)."""
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded under field name 'resume'"}), 400

    try:
        text = extract_text(request.files["resume"])
    except UnsupportedFileType as e:
        return jsonify({"error": str(e)}), 400

    result = extract_skills_with_ml_assist(text)
    return jsonify({
        "detected_skill_ids": result["skill_ids"],
        "ml_used": result["ml_used"],
        "ml_raw_phrases": result["ml_raw_phrases"],
        "char_count": len(text),
    })


@bp.put("/target")
@jwt_required()
def set_target():
    body = request.get_json(force=True) or {}
    user = User.query.get_or_404(int(get_jwt_identity()))
    user.target_role = body.get("target_role", user.target_role)
    user.experience_level = body.get("experience_level", user.experience_level)
    db.session.commit()
    return jsonify(user.to_dict())


@bp.put("/me")
@jwt_required()
def update_me():
    """Settings-page profile edit: name and current_role only. Email and
    password changes aren't exposed here on purpose — those touch login
    identity/security and deserve their own verified flow, not a quiet
    field edit (see README 'What's not built yet')."""
    body = request.get_json(force=True) or {}
    user = User.query.get_or_404(int(get_jwt_identity()))

    name = (body.get("name") or "").strip()
    if name:
        user.name = name
    if "current_role" in body:
        user.current_role = body["current_role"]

    db.session.commit()
    return jsonify(user.to_dict())
