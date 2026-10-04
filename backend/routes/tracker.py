from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import TrackerItem

bp = Blueprint("tracker", __name__, url_prefix="/api/tracker")

VALID_STATUSES = {"to_learn", "in_progress", "completed"}


@bp.get("")
@jwt_required()
def list_tracker():
    user_id = int(get_jwt_identity())
    items = TrackerItem.query.filter_by(user_id=user_id).all()
    return jsonify({"items": [i.to_dict() for i in items]})


@bp.post("")
@jwt_required()
def upsert_tracker_item():
    """Add a skill to the board (defaults to 'to_learn'), or move it by
    POSTing the same skill_id again with a new status."""
    body = request.get_json(force=True) or {}
    skill_id = body.get("skill_id")
    status = body.get("status", "to_learn")

    if not skill_id or status not in VALID_STATUSES:
        return jsonify({"error": f"skill_id required, status must be one of {sorted(VALID_STATUSES)}"}), 400

    user_id = int(get_jwt_identity())
    item = TrackerItem.query.filter_by(user_id=user_id, skill_id=skill_id).first()
    if item:
        item.status = status
    else:
        item = TrackerItem(user_id=user_id, skill_id=skill_id, status=status)
        db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict())


@bp.delete("/<skill_id>")
@jwt_required()
def remove_tracker_item(skill_id):
    user_id = int(get_jwt_identity())
    TrackerItem.query.filter_by(user_id=user_id, skill_id=skill_id).delete()
    db.session.commit()
    return jsonify({"removed": skill_id})
