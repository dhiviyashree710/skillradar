"""One-off generator for sample_resumes.json — finds each skill phrase in
the resume text with str.find() so start/end offsets are always correct,
in the same {content, annotation:[{label, points:[{start,end,text}]}]}
shape as the real Kaggle 'Resume Entities for NER' dataset. Run again if
you edit the RESUMES list below; not needed once you're using real data."""

import json

RESUMES = [
    ("Data analyst with experience in SQL, Python and Power BI. Comfortable building "
     "dashboards and presenting findings to stakeholders.",
     ["SQL", "Python", "Power BI", "stakeholders"]),

    ("Frontend developer skilled in JavaScript, React and CSS, with a focus on "
     "accessibility and testing.",
     ["JavaScript", "React", "CSS", "accessibility", "testing"]),

    ("Backend engineer with strong Python and Node.js background, building REST APIs "
     "and working with Docker for deployment.",
     ["Python", "Node.js", "REST APIs", "Docker"]),

    ("Data scientist with a background in statistics, machine learning and deep "
     "learning, using Python daily.",
     ["statistics", "machine learning", "deep learning", "Python"]),

    ("DevOps engineer focused on Docker, CI/CD pipelines and AWS, with git for "
     "version control.",
     ["Docker", "CI/CD", "AWS", "git"]),

    ("UI/UX designer proficient in Figma, wireframing and prototyping, with strong "
     "communication and critical thinking.",
     ["Figma", "wireframing", "prototyping", "communication", "critical thinking"]),
]


def build():
    records = []
    for content, skills in RESUMES:
        annotations = []
        for skill in skills:
            start = content.find(skill)
            if start == -1:
                raise ValueError(f"Could not find {skill!r} in: {content}")
            end = start + len(skill) - 1  # dataturks uses inclusive end index
            annotations.append({"label": ["Skills"], "points": [{"start": start, "end": end, "text": skill}]})
        records.append({"content": content, "annotation": annotations})
    return records


if __name__ == "__main__":
    records = build()
    with open("sample_resumes.json", "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"Wrote {len(records)} sample resumes to sample_resumes.json")
