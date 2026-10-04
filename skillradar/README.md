# SkillRadar — Skill Gap Analysis Platform

A full-stack app: upload a resume or list your skills, pick a target role,
and get a readiness score, a color-coded skill breakdown, and a matched
list of courses to close the gaps. Includes an admin panel, a trained
skill-extraction model, a downloadable PDF report, and animated UI
throughout (page transitions, scroll reveals, hover states, loading
skeletons, toast notifications).

```
skillradar/
├── backend/            Flask API (Python)
│   ├── app.py                  app factory + blueprint registration
│   ├── config.py                reads .env (incl. ADMIN_EMAILS)
│   ├── models.py                SQLAlchemy models (User, UserSkill, TrackerItem)
│   ├── extensions.py            db / jwt / cors singletons
│   ├── routes/                   auth, profile, analysis, recommendations, tracker, admin, report
│   ├── services/
│   │   ├── skill_matcher.py         matching/scoring logic + admin read-write helpers — read this first
│   │   ├── resume_parser.py         PDF/DOCX/TXT → plain text
│   │   └── ml_skill_extractor.py    bridges the trained model into the app (no-op if untrained)
│   ├── data/                     the "dataset": skills_taxonomy.json, role_requirements.json, courses.json
│   └── ml/                       trains the skill-extraction classifier — see backend/ml/README.md
└── frontend/            React + Vite + Tailwind + Recharts
    └── src/
        ├── pages/            Landing, Auth, Onboarding, Dashboard, Recommendations, Tracker, Settings, Admin
        ├── components/       AppShell, ReadinessRing, ProgressBar, Toast, Skeleton, Reveal, PageTransition, …
        ├── context/          AuthContext (JWT in localStorage)
        └── lib/api.js        axios instance, proxied to the backend in dev
```

---

## 1. Prerequisites

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
# open .env: set SECRET_KEY / JWT_SECRET_KEY to any random strings,
# and set ADMIN_EMAILS to your own email so you can see the Admin Panel

python app.py
```

The API now runs at **http://localhost:5000** and creates
`backend/instance/skillradar.db` (SQLite) automatically on first run.
Visit http://localhost:5000/api/health — you should see `{"status": "ok"}`.

> **Upgrading from an earlier copy of this project?** This version adds an
> `is_admin` column to the `users` table. SQLAlchemy's `db.create_all()`
> only creates *missing* tables, it won't add a column to a table that
> already exists — so if you already had `instance/skillradar.db` from
> before, delete that file once and restart `python app.py` to get a
> fresh schema (you'll need to sign up again).

## 3. Frontend setup

Open a **second** terminal (leave the backend running):

```bash
cd skillradar/frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*`
requests to the Flask backend automatically (see `vite.config.js`).

## 4. Using it

1. Land on the homepage → **Analyze My Skills** → sign up (a real account,
   stored in SQLite). If your email matches `ADMIN_EMAILS` in `.env`,
   you'll also see **Admin Panel** in the sidebar.
2. Onboarding: add skills by hand and/or upload a resume (.pdf/.docx/.txt) —
   this combines keyword matching with the trained model, if one exists.
   Pick a target role, pick an experience level.
3. **Dashboard**: readiness score, radar chart, color-coded skill list.
4. **Recommendations**: courses matched to whatever came back `Developing`
   or `Missing`; "Add to plan" pushes it onto your tracker board (toast
   confirms it).
5. **Tracker**: move skills across To Learn → In Progress → Completed.
6. **Settings**: edit your profile, or download your gap analysis as a PDF.
7. **Admin Panel** (admins only): edit the skill taxonomy, role
   requirement templates, and course catalog; view platform-wide
   analytics (headcount, most common gaps).

---

## The dataset

Three JSON files in `backend/data/` are the entire "dataset" the rule-based
matcher reads, and the Admin Panel's Skills/Roles/Courses tabs edit these
same files directly (through `services/skill_matcher.py`'s `save_*` /
`delete_*` functions) — there's no separate admin database.

| File | What it holds |
|---|---|
| `skills_taxonomy.json` | ~30 skills, each with a category and alias strings (so résumé text matching "ReactJS" or "react.js" both resolve to the same skill) |
| `role_requirements.json` | 6 sample roles, each with a required level (0–100) per skill |
| `courses.json` | A small sample course catalog, each course tagged to one skill |

For something closer to production, swap in a real public dataset — see
below. Whichever you pick, the rest of the app doesn't change.

- **O\*NET** (US Dept. of Labor, free): https://www.onetcenter.org/database.html
- **ESCO** (EU equivalent, free): https://esco.ec.europa.eu/en/use-esco/download
- **Lightcast Open Skills** (free, actively maintained): https://skills.lightcast.io/
- **Course data**: Coursera/Udemy partner APIs, or YouTube Data API v3.

## The trained skill-extraction model (backend/ml/)

`backend/ml/` is a separate, from-scratch ML pipeline: it trains a
`scikit-learn` classifier on Kaggle's **"Resume Entities for NER"**
dataset to tag skill phrases directly in resume text (`B-SKILL`/`I-SKILL`/
`O` per word) — catching things the fixed taxonomy's alias list would
otherwise miss. **Full walkthrough: `backend/ml/README.md`.**

It's wired in but entirely optional:

- `services/ml_skill_extractor.py` checks whether
  `backend/ml/model/skill_ner_model.joblib` exists. If not, resume uploads
  silently fall back to keyword matching alone — nothing breaks.
- A **toy model trained on 6 sample resumes** ships in this repo so you can
  see it work immediately (`backend/ml/data/sample_resumes.json`). It's
  not enough data to generalize well — retrain on the real Kaggle dataset
  (steps in `backend/ml/README.md`) for real accuracy.
- `routes/profile.py`'s resume upload returns `ml_used: true/false` so the
  frontend can show whether the model actually ran (see the toast on the
  onboarding resume-upload step).

## Admin panel

Any user whose email is listed in `.env`'s `ADMIN_EMAILS` gets `is_admin`
set automatically (on signup, or retroactively on next login) and sees an
**Admin Panel** link in the sidebar. Backend routes in `routes/admin.py`
are also protected independently (`admin_required` checks the JWT's user,
not just whether a token exists), so the frontend link is a convenience,
not the actual security boundary.

- **Skills** — add/remove taxonomy entries
- **Roles** — edit a role's per-skill required levels with sliders, add
  new skill requirements
- **Courses** — add/remove the course catalog
- **Analytics** — total users, how many completed onboarding, and the
  most common skill gaps aggregated across everyone (a `Counter` over
  every onboarded user's `analyze_gap()` result)

## PDF gap report

`GET /api/report/gap-report.pdf` (used by the Settings page's "Download
gap report" button) renders the current user's readiness score and full
skill breakdown as a PDF with `reportlab` — real, generated-on-the-fly
PDF bytes, not a static template.

## Frontend animation system

- **Page transitions**: `components/PageTransition.jsx` remounts the
  routed page on navigation, restarting a fade/slide-in (`sr-page-in` in
  `index.css`).
- **Scroll reveals**: `components/Reveal.jsx` uses `IntersectionObserver`
  to fade sections up as they enter the viewport (landing page).
- **Hover micro-interactions**: `sr-card-hover` lift on cards, nav-link
  slide, button scale-on-hover throughout.
- **Loading skeletons**: `components/Skeleton.jsx` — shimmering
  placeholders instead of "Loading…" text on Dashboard, Recommendations,
  Tracker, Admin.
- **Toast notifications**: `components/Toast.jsx` — a `useToast()` hook
  used for save confirmations, upload results, and errors across the app.
- All animation respects `prefers-reduced-motion`.

## Upgrading the matcher further

Two more upgrades if you outgrow both the keyword matcher and the
from-scratch classifier in `backend/ml/`:

- **spaCy's `PhraseMatcher`** for fuzzier, stemmed keyword matching.
- **LLM-based extraction**: replace `extract_skills_from_text()`'s body
  with a call to the Anthropic or OpenAI API, prompting it to return
  structured JSON skills from resume text.

## API reference

All routes are prefixed `/api`. Authenticated routes need
`Authorization: Bearer <token>` (the frontend handles this for you).
Admin routes additionally require `is_admin` on the token's user.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | – | Create account, returns JWT |
| POST | `/auth/login` | – | Returns JWT |
| GET | `/auth/me` | ✓ | Current user |
| GET | `/profile/skills-catalog` | – | Full skill list + role list, for onboarding dropdowns |
| PUT | `/profile/skills` | ✓ | Replace the user's skill list |
| POST | `/profile/resume` | ✓ | Upload resume file → `{ detected_skill_ids, ml_used, ml_raw_phrases }` |
| PUT | `/profile/target` | ✓ | Set target_role + experience_level |
| PUT | `/profile/me` | ✓ | Edit name / current_role |
| GET | `/analysis` | ✓ | Full gap-analysis payload for the dashboard |
| GET | `/recommendations?free=true\|false` | ✓ | Courses matched to current gaps |
| GET | `/tracker` | ✓ | Tracker board items |
| POST | `/tracker` | ✓ | Add/move a skill: `{ skill_id, status }` |
| DELETE | `/tracker/<skill_id>` | ✓ | Remove from board |
| GET | `/report/gap-report.pdf` | ✓ | Download the gap analysis as a PDF |
| GET/POST/DELETE | `/admin/skills[/<id>]` | ✓ admin | Manage the skills taxonomy |
| GET/PUT/DELETE | `/admin/roles[/<name>]` | ✓ admin | Manage role requirement templates |
| GET/POST/DELETE | `/admin/courses[/<title>]` | ✓ admin | Manage the course catalog |
| GET | `/admin/analytics` | ✓ admin | Headcount + most common gaps platform-wide |

## What's not built yet

- Forgot-password email flow (the UI has a link; no backend route yet)
- Account email/password change (Settings only edits name/current_role —
  see the docstring on `PUT /profile/me` for why)
- Deployment config (Dockerfile, hosting-specific settings)
