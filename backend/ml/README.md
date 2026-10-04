# Skill-extraction ML pipeline

This folder trains a real, from-scratch classifier that reads resume text
and tags which words are **skills** — the "fine-tune a classifier on a
labeled resume dataset" upgrade. It plugs into the app as an optional
upgrade to `services/skill_matcher.py`'s keyword matcher: if a trained
model exists, resume uploads use it *in addition to* keyword matching; if
not, the app falls back to keyword-only matching exactly as before. Nothing
breaks either way.

**No deep learning, no GPU, no spaCy.** This trains a standard
`scikit-learn` `LogisticRegression` classifier over hand-engineered word
features (a lightweight, from-scratch stand-in for CRF-based NER) — it
runs on a laptop CPU in under a minute on a few thousand resumes.

## What it does, in one sentence

For every word in a resume, the model predicts one of three tags —
`B-SKILL` (first word of a skill phrase), `I-SKILL` (continuation of a
skill phrase), or `O` (not a skill) — then adjacent `B`/`I` words are
glued back into phrases like "machine learning" or "power bi".

## 1. Get the dataset from Kaggle

Use **"Resume Entities for NER"** (search that name on kaggle.com, or
direct: `kaggle.com/datasets/dataturks/resume-entities-for-ner`). It's
~220 resumes, each hand-annotated with spans for Skills, Degree,
Companies, etc. — exactly the shape this pipeline expects.

```bash
# Option A: Kaggle CLI (needs a free Kaggle account + API token,
# kaggle.com/settings -> "Create New Token" -> saves kaggle.json)
pip install kaggle
kaggle datasets download -d dataturks/resume-entities-for-ner -p backend/ml/data --unzip

# Option B: download the .json manually from the Kaggle page and drop it in:
#   backend/ml/data/Entity Recognition in Resumes.json
```

A **tiny toy file** (`data/sample_resumes.json`, 6 fake resumes) is
included so you can run every command below immediately and see it work
end to end before plugging in the real dataset — swap the `--input` path
once you have the real file.

## 2. Turn raw annotations into train/test data

```bash
cd backend/ml
pip install -r requirements-ml.txt
python prepare_data.py --input data/sample_resumes.json --output data/
```

This tokenizes every resume, labels each token `B-SKILL`/`I-SKILL`/`O`
based on the annotation spans, and writes `data/train.jsonl` and
`data/test.jsonl` (80/20 split).

## 3. Train the classifier

```bash
python train_model.py
```

Prints precision/recall/F1 on the held-out test set and saves the trained
model to `model/skill_ner_model.joblib`.

## 4. Try it

```bash
python predict.py --text "Looking for a role using Python, SQL and Power BI. Strong communication skills."
```

## 5. Use the real dataset

Repeat step 2 with `--input data/"Entity Recognition in Resumes.json"`
(the real Kaggle file uses `content`/`annotation` fields in the same
shape as the toy sample — no code changes needed), then re-run step 3.
The bigger and more varied the training data, the better the model
generalizes beyond the fixed taxonomy's keyword list.

## 6. It's already wired into the app

Once `model/skill_ner_model.joblib` exists, restart the Flask backend —
`services/skill_matcher.py` picks it up automatically (see
`ml_skill_extractor.py`) and resume uploads will use it alongside the
keyword matcher. No model file yet? The app keeps working on keyword
matching alone — this entire folder is additive.

## Files

| File | Job |
|---|---|
| `prepare_data.py` | Kaggle JSON annotations → tokenized, BIO-tagged train/test files |
| `features.py` | turns a token (plus its neighbors) into a feature dict |
| `train_model.py` | trains + evaluates the `LogisticRegression` tagger, saves it |
| `predict.py` | CLI to try the trained model on arbitrary text |
| `../services/ml_skill_extractor.py` | the thin loader the live Flask app imports |
