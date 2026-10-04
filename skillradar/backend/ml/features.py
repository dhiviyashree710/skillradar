"""Turns a token (and its neighbors) into the hand-engineered features the
classifier trains on. This is the "feature engineering" a CRF would
normally use internally — spelling it out explicitly here keeps the whole
pipeline readable with just scikit-learn, no extra NLP library required.
"""

import re

TOKEN_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9+./#-]*|\S")


def tokenize_with_offsets(text):
    """Returns [(token_string, start_offset, end_offset_inclusive), ...].
    A simple regex tokenizer: keeps things like "Node.js", "C++", "CI/CD"
    as single tokens instead of splitting on every punctuation mark."""
    tokens = []
    for match in TOKEN_PATTERN.finditer(text):
        tokens.append((match.group(), match.start(), match.end() - 1))
    return tokens


def word_shape(word):
    if word.isupper():
        return "ALL_CAPS"
    if word[0].isupper():
        return "Title_Case"
    if word.isdigit():
        return "digits"
    return "lower"


def token_features(tokens, i):
    """tokens: list of plain token strings (no offsets) for one resume.
    i: index of the token to build features for."""
    word = tokens[i]
    features = {
        "word.lower": word.lower(),
        "word.shape": word_shape(word),
        "word.len": len(word),
        "word.is_first": i == 0,
        "word.is_last": i == len(tokens) - 1,
        "word.has_digit": any(c.isdigit() for c in word),
    }

    if i > 0:
        prev = tokens[i - 1]
        features["prev.lower"] = prev.lower()
        features["prev.shape"] = word_shape(prev)
    else:
        features["BOS"] = True

    if i < len(tokens) - 1:
        nxt = tokens[i + 1]
        features["next.lower"] = nxt.lower()
        features["next.shape"] = word_shape(nxt)
    else:
        features["EOS"] = True

    return features


def sentence_features(tokens):
    """tokens: list of plain token strings. Returns one feature dict per
    token, ready for sklearn's DictVectorizer."""
    return [token_features(tokens, i) for i in range(len(tokens))]
