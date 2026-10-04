"""Trains a token-level classifier (B-SKILL / I-SKILL / O) on the
prepared train/test JSONL files and saves it with joblib.

Usage:
    python train_model.py
    python train_model.py --train data/train.jsonl --test data/test.jsonl
"""

import argparse
import json

import joblib
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

from features import sentence_features


def load_jsonl(path):
    examples = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                examples.append(json.loads(line))
    return examples


def flatten(examples):
    """Expands a list of {tokens, tags} resumes into one flat list of
    per-token feature dicts and one flat list of tags, which is what a
    plain (non-sequence) sklearn classifier trains on."""
    X, y = [], []
    for ex in examples:
        feats = sentence_features(ex["tokens"])
        X.extend(feats)
        y.extend(ex["tags"])
    return X, y


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", default="data/train.jsonl")
    parser.add_argument("--test", default="data/test.jsonl")
    parser.add_argument("--output", default="model/skill_ner_model.joblib")
    args = parser.parse_args()

    train_examples = load_jsonl(args.train)
    test_examples = load_jsonl(args.test)
    print(f"Training on {len(train_examples)} resumes, testing on {len(test_examples)}")

    X_train_dicts, y_train = flatten(train_examples)
    X_test_dicts, y_test = flatten(test_examples)

    vectorizer = DictVectorizer(sparse=True)
    X_train = vectorizer.fit_transform(X_train_dicts)
    X_test = vectorizer.transform(X_test_dicts)

    clf = LogisticRegression(max_iter=1000, class_weight="balanced")
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("\n--- Held-out test set performance ---")
    print(classification_report(y_test, y_pred, zero_division=0))

    joblib.dump({"vectorizer": vectorizer, "classifier": clf}, args.output)
    print(f"Saved trained model to {args.output}")
    print("Restart the Flask backend to pick it up automatically.")


if __name__ == "__main__":
    main()
