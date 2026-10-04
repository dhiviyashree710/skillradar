# SkillRadar — Skill Gap Analysis Platform

A full-stack prototype: upload a resume or list your skills, pick a target
role, and get a readiness score, a color-coded skill breakdown, and a
matched list of courses to close the gaps.

**No AI API, no training, no GPU.** The matching logic is rule-based —
plain Python comparing your skills against a JSON skills taxonomy and
role-requirement file, in the same spirit as public datasets like
[O*NET](https://www.onetonline.org/) or [Lightcast Open Skills](https://skills.lightcast.io/).
See *"The dataset"* and *"Upgrading the matcher"* below if you want to swap
in a real taxonomy or an LLM later.

```
skillradar/
├── backend/        Flask API (Python)
│   ├── app.py              app factory + blueprint registration
│   ├── config.py           reads .env
│   ├── models.py           SQLAlchemy models (User, UserSkill, TrackerItem)
│   ├── extensions.py       db / jwt / cors singletons
│   ├── routes/              one blueprint per feature (auth, profile, analysis, recommendations, tracker)
│   ├── services/
│   │   ├── skill_matcher.py    the matching/scoring logic — read this first
│   │   └── resume_parser.py    PDF/DOCX/TXT → plain text
│   └── data/                the "dataset": skills_taxonomy.json, role_requirements.json, courses.json
└── frontend/        React + Vite + Tailwind + Recharts
    └── src/
        ├── pages/            Landing, Auth, Onboarding, Dashboard, Recommendations, Tracker
        ├── components/       shared UI (AppShell, ReadinessRing, ProgressBar, …)
        ├── context/          AuthContext (JWT in localStorage)
        └── lib/api.js        axios instance, proxied to the backend in dev
```

---

## 1. Prerequisites

Install these once, from VS Code's integrated terminal or any terminal:

- **Python 3.10+** — `python3 --version`
- **Node.js 18+** and npm — `node -v`
- (Recommended VS Code extensions: Python, ESLint, Tailwind CSS IntelliSense)

## 2. Backend setup

```bash
cd skillradar/backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # Windows: copy .env.example .env
# open .env and set SECRET_KEY / JWT_SECRET_KEY to any random strings

python app.py
```

The API now runs at **http://localhost:5000** and creates
`backend/instance/skillradar.db` (SQLite) automatically on first run.
Visit http://localhost:5000/api/health — you should see `{"status": "ok"}`.

## 3. Frontend setup

Open a **second** terminal (leave the backend running):

```bash
cd skillradar/frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*`
requests to the Flask backend automatically (see `vite.config.js`), so
there's nothing else to configure for local dev.

## 4. Using it

1. Land on the homepage → **Analyze My Skills** → you'll be asked to sign
   up first (it's a real account, stored in SQLite).
2. Onboarding: add skills by hand and/or upload a resume (.pdf/.docx/.txt),
   pick a target role, pick an experience level.
3. **Dashboard**: readiness score, radar chart, color-coded skill list.
4. **Recommendations**: courses matched to whatever came back `Developing`
   or `Missing`; "Add to plan" pushes it onto your tracker board.
5. **Tracker**: move skills across To Learn → In Progress → Completed.

---

## The dataset

Three JSON files in `backend/data/` are the entire "dataset":

| File | What it holds |
|---|---|
| `skills_taxonomy.json` | ~30 skills, each with a category and alias strings (so résumé text matching "ReactJS" or "react.js" both resolve to the same skill) |
| `role_requirements.json` | 6 sample roles (Data Analyst, Frontend Developer, Backend Developer, Data Scientist, DevOps Engineer, UI/UX Designer), each with a required-level (0–100) per skill |
| `courses.json` | A small sample course catalog, each course tagged to one skill |

This is hand-curated starter data so the project runs with zero setup.
For something closer to production, swap in a real public dataset:

- **O\*NET** (US Dept. of Labor, free): download the "Skills" and "Technology
  Skills" text files from https://www.onetcenter.org/database.html and
  reshape them into the same `{id, name, category, aliases}` / role→skill
  shape.
- **ESCO** (EU equivalent, free): https://esco.ec.europa.eu/en/use-esco/download
- **Lightcast Open Skills** (free, very granular, actively maintained):
  https://skills.lightcast.io/
- **Course data**: for real course listings instead of the sample file,
  look at Coursera's and Udemy's affiliate/partner APIs, or YouTube Data
  API v3 for free video matches.

Whichever you pick, the rest of the app doesn't change — everything reads
through the functions in `services/skill_matcher.py`.

## Upgrading the matcher

`extract_skills_from_text()` in `skill_matcher.py` is deliberately simple:
a whole-word scan against the taxonomy's alias list. It's free, needs no
API key, and is good enough for an MVP. Two straightforward upgrades if
you outgrow it:

- **Better NLP matching**: swap in spaCy's `PhraseMatcher` for fuzzier,
  stemmed matching.
- **LLM-based extraction**: replace the function body with a call to the
  Anthropic or OpenAI API, prompting it to return structured JSON skills
  from the resume text. Every route already calls `extract_skills_from_text()`
  by name, so this is a one-file change.

## API reference

All routes are prefixed `/api`. Authenticated routes need
`Authorization: Bearer <token>` (the frontend handles this for you).

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | – | Create account, returns JWT |
| POST | `/auth/login` | – | Returns JWT |
| GET | `/auth/me` | ✓ | Current user |
| GET | `/profile/skills-catalog` | – | Full skill list + role list, for onboarding dropdowns |
| PUT | `/profile/skills` | ✓ | Replace the user's skill list |
| POST | `/profile/resume` | ✓ | Upload resume file → `{ detected_skill_ids }` |
| PUT | `/profile/target` | ✓ | Set target_role + experience_level |
| GET | `/analysis` | ✓ | Full gap-analysis payload for the dashboard |
| GET | `/recommendations?free=true\|false` | ✓ | Courses matched to current gaps |
| GET | `/tracker` | ✓ | Tracker board items |
| POST | `/tracker` | ✓ | Add/move a skill: `{ skill_id, status }` |
| DELETE | `/tracker/<skill_id>` | ✓ | Remove from board |

## What's not built yet

This covers the core user-facing flow end to end. Not included (ask if
you want these scaffolded next):

- Forgot-password email flow (the UI has a link; no backend route yet)
- Admin panel (skill taxonomy / role template / course CRUD + analytics)
- PDF export of the gap report
- Deployment config (Dockerfile, hosting-specific settings)
