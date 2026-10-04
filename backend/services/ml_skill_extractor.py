"""Thin bridge between the Flask app and backend/ml/predict.py.

Kept deliberately separate from skill_matcher.py: if the trained model
file doesn't exist (nobody's run the training pipeline in backend/ml/
yet), every function here returns an empty list instead of raising, so
resume uploads keep working on keyword matching alone. Train a model and
restart the server — no other code changes needed.
"""

import os
import sys

_ML_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml")
_MODEL_PATH = os.path.join(_ML_DIR, "model", "skill_ner_model.joblib")

_available = None  # cached tri-state: None = not checked yet


def is_model_available():
    global _available
    if _available is None:
        _available = os.path.exists(_MODEL_PATH)
    return _available


def extract_skill_phrases_ml(text):
    """Returns a list of free-text skill phrases the trained model found,
    e.g. ["machine learning", "Power BI"]. Empty list if no model is
    trained yet, or if prediction fails for any reason — this must never
    be the thing that breaks a resume upload."""
    if not is_model_available():
        return []

    if _ML_DIR not in sys.path:
        sys.path.insert(0, _ML_DIR)

    try:
        from predict import extract_skill_phrases  # backend/ml/predict.py
        return extract_skill_phrases(text, model_path=_MODEL_PATH)
    except Exception as e:  # pragma: no cover - defensive, see docstring
        print(f"[ml_skill_extractor] prediction failed, falling back to keywords only: {e}")
        return []
