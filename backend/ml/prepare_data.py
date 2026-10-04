"""Converts Kaggle-style resume NER annotations (dataturks format: each
resume has "content" plain text + "annotation" list of labeled spans)
into BIO-tagged token sequences, then writes an 80/20 train/test split.

Usage:
    python prepare_data.py --input data/sample_resumes.json --output data/
"""

import argparse
import json
import random

from features import tokenize_with_offsets

SKILL_LABELS = {"Skills", "skills", "SKILLS"}  # dataturks resume dataset uses "Skills"


def spans_for_record(record):
    """Pulls out (start, end_inclusive) character spans labeled as a skill,
    from whichever of the annotation/entities formats the file uses."""
    spans = []

    # dataturks format: {"annotation": [{"label": [...], "points": [{"start","end"}]}]}
    for ann in record.get("annotation", []) or []:
        labels = set(ann.get("label", []))
        if labels & SKILL_LABELS:
            for point in ann.get("points", []):
                spans.append((point["start"], point["end"]))

    # fallback format some Kaggle mirrors use: {"entities": [[start, end, "Skills"]]}
    for ent in record.get("entities", []) or []:
        if len(ent) >= 3 and ent[2] in SKILL_LABELS:
            spans.append((ent[0], ent[1] - 1))  # this format's end is exclusive

    return spans


def tag_tokens(text, spans):
    """Returns (list_of_token_strings, list_of_BIO_tags) for one resume."""
    tokens_with_offsets = tokenize_with_offsets(text)
    tokens = [t[0] for t in tokens_with_offsets]
    tags = ["O"] * len(tokens)

    for start, end in spans:
        inside = False
        for i, (_, tok_start, tok_end) in enumerate(tokens_with_offsets):
            overlaps = tok_start <= end and tok_end >= start
            if overlaps:
                tags[i] = "I-SKILL" if inside else "B-SKILL"
                inside = True

    return tokens, tags


def load_records(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Some Kaggle exports are JSON Lines instead of a JSON array — handle both.
    if isinstance(data, dict):
        data = [data]
    return data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to the annotated resume JSON file")
    parser.add_argument("--output", default="data/", help="Directory to write train.jsonl / test.jsonl into")
    parser.add_argument("--test-fraction", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    records = load_records(args.input)
    print(f"Loaded {len(records)} resumes from {args.input}")

    examples = []
    skipped = 0
    for record in records:
        text = record.get("content") or record.get("text")
        if not text:
            skipped += 1
            continue
        spans = spans_for_record(record)
        tokens, tags = tag_tokens(text, spans)
        if tokens:
            examples.append({"tokens": tokens, "tags": tags})

    if skipped:
        print(f"Skipped {skipped} records with no text field")

    random.seed(args.seed)
    random.shuffle(examples)
    split_at = max(1, int(len(examples) * (1 - args.test_fraction)))
    train, test = examples[:split_at], examples[split_at:]
    if not test:  # guarantee at least one test example on tiny datasets
        test = [train.pop()]

    total_skill_tokens = sum(tag != "O" for ex in examples for tag in ex["tags"])
    print(f"{len(train)} train / {len(test)} test examples. "
          f"{total_skill_tokens} skill-tagged tokens total.")

    for name, subset in [("train.jsonl", train), ("test.jsonl", test)]:
        out_path = f"{args.output.rstrip('/')}/{name}"
        with open(out_path, "w", encoding="utf-8") as f:
            for ex in subset:
                f.write(json.dumps(ex) + "\n")
        print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
