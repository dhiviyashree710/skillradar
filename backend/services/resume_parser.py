"""Resume text extraction for PDF and DOCX uploads.

Kept separate from skill_matcher.py on purpose: this module's only job is
"file bytes -> plain text". What happens to that text (keyword matching
today, maybe an LLM call later) lives in skill_matcher.py.
"""

import io

import pdfplumber
from docx import Document


class UnsupportedFileType(Exception):
    pass


def extract_text(file_storage):
    """file_storage: a Werkzeug FileStorage from request.files['resume'].
    Returns extracted plain text, or '' if nothing could be read."""
    filename = (file_storage.filename or "").lower()
    raw = file_storage.read()

    if filename.endswith(".pdf"):
        return _extract_pdf(raw)
    if filename.endswith(".docx"):
        return _extract_docx(raw)
    if filename.endswith(".txt"):
        return raw.decode("utf-8", errors="ignore")

    raise UnsupportedFileType("Upload a .pdf, .docx, or .txt file.")


def _extract_pdf(raw_bytes):
    text_parts = []
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_docx(raw_bytes):
    doc = Document(io.BytesIO(raw_bytes))
    return "\n".join(p.text for p in doc.paragraphs)
