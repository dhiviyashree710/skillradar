from collections import Counter
from functools import wraps

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import User
from services.skill_matcher import (
    get_taxonomy, get_roles, get_courses,
    save_skill, delete_skill,
    save_role, delete_role,
    save_course, delete_course,
    analyze_gap,
)

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(fn):
    """Checked on every admin route: a valid JWT alone isn't enough, the
    user behind it must also have is_admin set (see routes/auth.py for how
    that gets granted via the ADMIN_EMAILS setting)."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = User.query.get(int(get_jwt_identity()))
        if not user or not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


# --- Skills taxonomy -----------------------------------------------------

@bp.get("/skills")
@admin_required
def list_skills_admin():
    return jsonify({"skills": list(get_taxonomy().values())})


@bp.post("/skills")
@admin_required
def create_skill():
    body = request.get_json(force=True) or {}
    required = {"id", "name", "category"}
    if not required.issubset(body):
        return jsonify({"error": f"Skill needs: {sorted(required)}"}), 400
    skill = {
        "id": body["id"].strip().lower().replace(" ", "_"),
        "name": body["name"].strip(),
        "category": body["category"].strip(),
        "aliases": [a.strip().lower() for a in body.get("aliases", [])],
    }
    save_skill(skill)
    return jsonify(skill), 201


@bp.delete("/skills/<skill_id>")
@admin_required
def remove_skill(skill_id):
    delete_skill(skill_id)
    return jsonify({"removed": skill_id})


# --- Role requirement templates ------------------------------------------

@bp.get("/roles")
@admin_required
def list_roles_admin():
    return jsonify({"roles": get_roles()})


@bp.put("/roles/<role_name>")
@admin_required
def upsert_role(role_name):
    """Body: {"requirements": [{"skill_id": "sql", "required": 85}, ...]}"""
    body = request.get_json(force=True) or {}
    requirements = body.get("requirements")
    if not isinstance(requirements, list):
        return jsonify({"error": "requirements must be a list of {skill_id, required}"}), 400
    save_role(role_name, requirements)
    return jsonify({"role": role_name, "requirements": requirements})


@bp.delete("/roles/<role_name>")
@admin_required
def remove_role(role_name):
    delete_role(role_name)
    return jsonify({"removed": role_name})


# --- Course catalog -------------------------------------------------------

@bp.get("/courses")
@admin_required
def list_courses_admin():
    return jsonify({"courses": get_courses()})


@bp.post("/courses")
@admin_required
def create_course():
    body = request.get_json(force=True) or {}
    required = {"skill_id", "title", "platform", "duration_hours", "difficulty", "free"}
    if not required.issubset(body):
        return jsonify({"error": f"Course needs: {sorted(required)}"}), 400
    course = {
        "skill_id": body["skill_id"],
        "title": body["title"],
        "platform": body["platform"],
        "duration_hours": body["duration_hours"],
        "difficulty": body["difficulty"],
        "free": bool(body["free"]),
        "rating": body.get("rating", 4.5),
        "url": body.get("url", "#"),
    }
    save_course(course)
    return jsonify(course), 201


@bp.delete("/courses/<title>")
@admin_required
def remove_course(title):
    delete_course(title)
    return jsonify({"removed": title})


# --- Analytics --------------------------------------------------------------

@bp.get("/analytics")
@admin_required
def analytics():
    """Aggregate, read-only view across all users: headcount, how many
    have completed onboarding, and the most common skill gaps platform-wide
    — the number product/career-services teams actually want to see."""
    users = User.query.all()
    onboarded = [u for u in users if u.target_role]

    gap_counter = Counter()
    role_counter = Counter()
    for user in onboarded:
        role_counter[user.target_role] += 1
        try:
            result = analyze_gap(
                [s.skill_id for s in user.skills],
                user.target_role,
                user.experience_level or "Fresher",
            )
            for b in result["breakdown"]:
                if b["status"] != "Strong":
                    gap_counter[b["skill_name"]] += 1
        except ValueError:
            continue  # target_role no longer exists in role_requirements.json

    return jsonify({
        "total_users": len(users),
        "onboarded_users": len(onboarded),
        "users_by_target_role": role_counter.most_common(),
        "most_common_gaps": gap_counter.most_common(10),
    })
