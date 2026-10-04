"""Skill matching — rule-based by default, with an optional trained-model
assist layered on top.

This is the core logic the whole project is built around: it loads the
open-style taxonomy/role/course JSON files from backend/data/ once, then
answers three questions with plain lookups and arithmetic:

  1. Which taxonomy skills does a piece of resume text mention?
  2. Given a user's skill list + experience level, how do they compare
     to a role's requirements?
  3. Which courses close the specific gaps that comparison finds?

Question 1 also calls out to ml_skill_extractor.py, which uses the
classifier trained in backend/ml/ (see backend/ml/README.md) if one
exists, to catch skill phrases the fixed taxonomy's alias list would
otherwise miss. If no model has been trained yet, that call is a no-op
and matching falls back to keywords alone — nothing here depends on the
model existing.
"""

import json
import os
from functools import lru_cache

from config import Config
from services.ml_skill_extractor import extract_skill_phrases_ml, is_model_available

# Experience level -> assumed proficiency ceiling for any skill the user
# claims to have. A fresher who lists "SQL" probably isn't at the same
# level as someone with years of experience, so we don't take self-reported
# skills at 100% face value; we scale them by level.
EXPERIENCE_MULTIPLIER = {
    "Fresher": 0.55,
    "Intermediate": 0.75,
    "Experienced": 0.95,
}

GAP_THRESHOLDS = {
    # user_score >= required           -> "Strong"
    # user_score >= required - WEAK_BAND -> "Developing"
    # else                             -> "Missing"
    "WEAK_BAND": 25,
}


def _load_json(filename):
    path = os.path.join(Config.DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(filename, data):
    path = os.path.join(Config.DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@lru_cache(maxsize=1)
def get_taxonomy():
    """id -> {id, name, category, aliases} for every known skill."""
    data = _load_json("skills_taxonomy.json")
    return {s["id"]: s for s in data["skills"]}


@lru_cache(maxsize=1)
def get_roles():
    """role name -> {experience_levels, requirements: [{skill_id, required}]}"""
    return _load_json("role_requirements.json")["roles"]


@lru_cache(maxsize=1)
def get_courses():
    """list of course dicts, each tagged with a skill_id."""
    return _load_json("courses.json")["courses"]


def list_roles():
    return list(get_roles().keys())


# --- Admin-panel write paths -------------------------------------------
# These are the only functions that touch the JSON files on disk after
# startup. Each one writes the full file back out, then clears the
# relevant lru_cache so the next read picks up the change — there's no
# separate "admin database," the taxonomy/role/course JSON files are the
# single source of truth in both directions.

def save_skill(skill):
    """Insert or update one skill (matched by id) in skills_taxonomy.json."""
    data = _load_json("skills_taxonomy.json")
    data["skills"] = [s for s in data["skills"] if s["id"] != skill["id"]] + [skill]
    _save_json("skills_taxonomy.json", data)
    get_taxonomy.cache_clear()


def delete_skill(skill_id):
    data = _load_json("skills_taxonomy.json")
    data["skills"] = [s for s in data["skills"] if s["id"] != skill_id]
    _save_json("skills_taxonomy.json", data)
    get_taxonomy.cache_clear()


def save_role(role_name, requirements):
    """requirements: [{skill_id, required}, ...]. Creates the role if new."""
    data = _load_json("role_requirements.json")
    existing = data["roles"].get(role_name, {})
    data["roles"][role_name] = {
        "experience_levels": existing.get("experience_levels", ["Fresher", "Intermediate", "Experienced"]),
        "requirements": requirements,
    }
    _save_json("role_requirements.json", data)
    get_roles.cache_clear()


def delete_role(role_name):
    data = _load_json("role_requirements.json")
    data["roles"].pop(role_name, None)
    _save_json("role_requirements.json", data)
    get_roles.cache_clear()


def save_course(course):
    """course must include a unique 'title'; matched/replaced by title."""
    data = _load_json("courses.json")
    data["courses"] = [c for c in data["courses"] if c["title"] != course["title"]] + [course]
    _save_json("courses.json", data)
    get_courses.cache_clear()


def delete_course(title):
    data = _load_json("courses.json")
    data["courses"] = [c for c in data["courses"] if c["title"] != title]
    _save_json("courses.json", data)
    get_courses.cache_clear()


def list_skills():
    return list(get_taxonomy().values())


def resolve_skill_id(name_or_id):
    """Accepts either a taxonomy id ('sql') or a free-text name ('SQL',
    'Structured Query Language') and returns the canonical id, or None.
    Strips trailing punctuation a tokenizer can leave behind (e.g. "Docker."
    at the end of a sentence) before comparing, so phrases pulled straight
    from extract_skills_from_text()/the ML extractor still resolve."""
    taxonomy = get_taxonomy()
    needle = name_or_id.strip().lower().strip(".,;:!?()[]\"'")
    if needle in taxonomy:
        return needle
    for skill_id, skill in taxonomy.items():
        if needle == skill["name"].lower() or needle in skill["aliases"]:
            return skill_id
    return None


def extract_skills_from_text(text):
    """Dependency-free keyword matcher: scans resume text for any taxonomy
    alias as a whole word. This alone is a complete, working matcher."""
    text_lower = f" {text.lower()} "
    found = []
    for skill_id, skill in get_taxonomy().items():
        for alias in [skill["name"].lower()] + skill["aliases"]:
            token = f" {alias} "
            if token in text_lower or text_lower.startswith(f"{alias} ") or text_lower.endswith(f" {alias}"):
                found.append(skill_id)
                break
    return sorted(set(found))


def extract_skills_with_ml_assist(text):
    """Keyword matches, plus anything the trained model (backend/ml/)
    recognizes that the fixed taxonomy's aliases missed. Returns:
        {
          "skill_ids": [...],       # resolved taxonomy ids, keyword + ML combined
          "ml_used": bool,          # whether a trained model was actually available
          "ml_raw_phrases": [...],  # free-text phrases the model found, for display
        }
    Safe to call even with no model trained — ml_used will be False and
    behavior is identical to calling extract_skills_from_text() alone."""
    keyword_ids = set(extract_skills_from_text(text))

    ml_raw_phrases = extract_skill_phrases_ml(text)
    for phrase in ml_raw_phrases:
        skill_id = resolve_skill_id(phrase)
        if skill_id:
            keyword_ids.add(skill_id)

    return {
        "skill_ids": sorted(keyword_ids),
        "ml_used": is_model_available(),
        "ml_raw_phrases": ml_raw_phrases,
    }


def analyze_gap(user_skill_ids, target_role, experience_level):
    """Returns the full gap-analysis payload the dashboard renders:
    per-skill required vs. user score + status, and an overall readiness
    score (0-100)."""
    roles = get_roles()
    taxonomy = get_taxonomy()

    if target_role not in roles:
        raise ValueError(f"Unknown role: {target_role}")

    multiplier = EXPERIENCE_MULTIPLIER.get(experience_level, 0.6)
    user_skill_set = set(user_skill_ids)
    weak_band = GAP_THRESHOLDS["WEAK_BAND"]

    breakdown = []
    readiness_components = []

    for req in roles[target_role]["requirements"]:
        skill_id = req["skill_id"]
        required = req["required"]
        skill = taxonomy.get(skill_id, {"name": skill_id, "category": "Other"})

        has_skill = skill_id in user_skill_set
        user_score = round(required * multiplier) if has_skill else 0
        user_score = min(user_score, 100)

        if user_score >= required:
            status = "Strong"
        elif user_score >= required - weak_band:
            status = "Developing"
        else:
            status = "Missing"

        breakdown.append({
            "skill_id": skill_id,
            "skill_name": skill["name"],
            "category": skill.get("category", "Other"),
            "required": required,
            "user_score": user_score,
            "status": status,
        })
        readiness_components.append(min(user_score / required, 1.0))

    readiness_score = round(sum(readiness_components) / len(readiness_components) * 100) if readiness_components else 0

    return {
        "target_role": target_role,
        "experience_level": experience_level,
        "readiness_score": readiness_score,
        "breakdown": breakdown,
        "missing_skill_ids": [b["skill_id"] for b in breakdown if b["status"] != "Strong"],
    }


def recommend_courses_for_skills(skill_ids, free_only=None):
    """Courses whose skill_id is in the given list, optionally filtered to
    free or paid only. Ordered by rating, highest first."""
    skill_id_set = set(skill_ids)
    courses = [c for c in get_courses() if c["skill_id"] in skill_id_set]
    if free_only is True:
        courses = [c for c in courses if c["free"]]
    elif free_only is False:
        courses = [c for c in courses if not c["free"]]
    return sorted(courses, key=lambda c: c["rating"], reverse=True)
