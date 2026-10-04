"""Rule-based skill matching — no AI API, no model training.

This is the core logic the whole project is built around: it loads the
open-style taxonomy/role/course JSON files from backend/data/ once, then
answers three questions with plain lookups and arithmetic:

  1. Which taxonomy skills does a piece of resume text mention?
  2. Given a user's skill list + experience level, how do they compare
     to a role's requirements?
  3. Which courses close the specific gaps that comparison finds?

Swap this module out for an LLM-API-backed version later without touching
any route code — every route only calls the functions defined here.
"""

import json
import os
from functools import lru_cache

from config import Config

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


def list_skills():
    return list(get_taxonomy().values())


def resolve_skill_id(name_or_id):
    """Accepts either a taxonomy id ('sql') or a free-text name ('SQL',
    'Structured Query Language') and returns the canonical id, or None."""
    taxonomy = get_taxonomy()
    needle = name_or_id.strip().lower()
    if needle in taxonomy:
        return needle
    for skill_id, skill in taxonomy.items():
        if needle == skill["name"].lower() or needle in skill["aliases"]:
            return skill_id
    return None


def extract_skills_from_text(text):
    """Very small, dependency-free keyword matcher: scans resume text for
    any taxonomy alias as a whole word. Good enough for a rule-based MVP;
    swap for spaCy PhraseMatcher or an LLM call if you need fuzzier matching
    (see README 'Upgrading the matcher' section)."""
    text_lower = f" {text.lower()} "
    found = []
    for skill_id, skill in get_taxonomy().items():
        for alias in [skill["name"].lower()] + skill["aliases"]:
            token = f" {alias} "
            if token in text_lower or text_lower.startswith(f"{alias} ") or text_lower.endswith(f" {alias}"):
                found.append(skill_id)
                break
    return sorted(set(found))


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
