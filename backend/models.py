from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    current_role = db.Column(db.String(120), nullable=True)
    target_role = db.Column(db.String(120), nullable=True)
    experience_level = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    skills = db.relationship("UserSkill", backref="user", cascade="all, delete-orphan")
    tracker_items = db.relationship("TrackerItem", backref="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "current_role": self.current_role,
            "target_role": self.target_role,
            "experience_level": self.experience_level,
            "skills": [s.skill_id for s in self.skills],
        }


class UserSkill(db.Model):
    """A skill the user says they have. No proficiency score is stored from
    the user directly — proficiency is inferred by skill_matcher.py from
    experience_level, keeping the model honest about what's actually known."""

    __tablename__ = "user_skills"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id = db.Column(db.String(80), nullable=False)

    __table_args__ = (db.UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)


class TrackerItem(db.Model):
    __tablename__ = "tracker_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id = db.Column(db.String(80), nullable=False)
    status = db.Column(db.String(20), default="to_learn")  # to_learn | in_progress | completed
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "skill_id", name="uq_user_tracker_skill"),)

    def to_dict(self):
        return {"skill_id": self.skill_id, "status": self.status}
