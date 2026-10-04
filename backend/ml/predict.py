"""Loads the trained model and extracts skill phrases from raw text.

CLI usage:
    python predict.py --text "Looking for a Python and SQL developer."

Importable usage (this is what services/ml_skill_extractor.py calls):
    from predict import extract_skill_phrases
    extract_skill_phrases("some resume text", model_path="model/skill_ner_model.joblib")
"""

import argparse

import joblib

from features import sentence_features, tokenize_with_offsets

_CACHE = {}


def _load(model_path):
    if model_path not in _CACHE:
        _CACHE[model_path] = joblib.load(model_path)
    return _CACHE[model_path]


def extract_skill_phrases(text, model_path="model/skill_ner_model.joblib"):
    """Returns a list of unique skill phrases the model found in `text`,
    e.g. ["Python", "SQL", "machine learning"]."""
    bundle = _load(model_path)
    vectorizer, clf = bundle["vectorizer"], bundle["classifier"]

    tokens_with_offsets = tokenize_with_offsets(text)
    tokens = [t[0] for t in tokens_with_offsets]
    if not tokens:
        return []

    feats = sentence_features(tokens)
    X = vectorizer.transform(feats)
    tags = clf.predict(X)

    phrases = []
    current = []
    for token, tag in zip(tokens, tags):
        if tag == "B-SKILL":
            if current:
                phrases.append(" ".join(current))
            current = [token]
        elif tag == "I-SKILL" and current:
            current.append(token)
        else:
            if current:
                phrases.append(" ".join(current))
            current = []
    if current:
        phrases.append(" ".join(current))

    # de-duplicate, case-insensitive, preserving first-seen casing
    seen = set()
    unique = []
    for phrase in phrases:
        key = phrase.lower()
        if key not in seen:
            seen.add(key)
            unique.append(phrase)
    return unique


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--model", default="model/skill_ner_model.joblib")
    args = parser.parse_args()

    result = extract_skill_phrases(args.text, model_path=args.model)
    print("Detected skill phrases:", result)
