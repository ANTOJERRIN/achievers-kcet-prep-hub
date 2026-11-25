# Achievers Club KCET Prep Hub

Achievers Club helps Class 11 and 12 students prepare for Karnataka's KCET in Physics, Chemistry, and Mathematics. Students read notes, take timed practice sets, review explanations, and get recommendations based on their results. Staff publish study material in Django admin. See the [implementation plan](docs/DJANGO_IMPLEMENTATION_PLAN.md).

## Run locally

Install Python 3.12 and Node.js. From the repository root in PowerShell:

```powershell
py -3.12 -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
.venv/Scripts/python.exe backend/manage.py migrate
.venv/Scripts/python.exe backend/manage.py seed_kcet
.venv/Scripts/python.exe backend/manage.py seed_resources
.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

In a separate terminal:

```powershell
npm ci
npm run dev
```

Open [the student app](http://localhost:8080). Vite proxies `/api/` to Django. The app uses SQLite locally unless PostgreSQL is configured. The seed command adds six original notes and six short practice sets with 18 questions across the three subjects.

For staff access, run `.venv/Scripts/python.exe backend/manage.py createsuperuser` and sign in to [Django admin](http://127.0.0.1:8000/admin/). Create a subject and topic before adding a note or practice set. Each question has four choices, one correct choice, and an explanation. Use the Published checkbox to release content to students.

Use **Learning resources** in Django admin to attach a reading or video to any topic. For a YouTube video or OpenStax book section, paste the URL and leave the title or source blank to look it up. For other sites, enter the title, source, and HTTPS URL. Publish the resource when ready. Students see it in Notes or Videos and open the original source in a new tab.

## Student API

Student requests use the Django session cookie. Get a CSRF token from `/api/auth/session/` and send it as `X-CSRFToken` for every write. Register, login, and logout responses return the current token.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health/` | Check the database connection |
| GET | `/api/auth/session/` | Get the current student and CSRF token |
| POST | `/api/auth/register/`, `/api/auth/login/`, `/api/auth/logout/` | Manage the session |
| GET | `/api/dashboard/` | Get published resources, progress, and attempt history |
| GET, POST | `/api/lessons/<id>/` | Read a published note or mark it complete |
| POST | `/api/quizzes/<id>/attempts/` | Start or resume a practice set |
| GET | `/api/attempts/<uuid>/` | Resume or review your attempt |
| PUT | `/api/attempts/<uuid>/answers/<question-id>/` | Save or clear an answer using its current revision |
| POST | `/api/attempts/<uuid>/submit/` | Grade your saved answers |
| GET | `/api/study-plan.pdf` | Download your study plan |

Each correct choice earns one point. Unanswered questions earn zero. Topic recommendations use cumulative scored accuracy, with a minimum of three graded questions and a threshold below 70%. Timed attempts are finalized on the next access after the deadline, using the answers saved before it.

## Verify

```powershell
.venv/Scripts/python.exe backend/manage.py check
.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
.venv/Scripts/python.exe backend/manage.py test prep
npm run lint
npm run build
npm exec -- tsc -p tsconfig.app.json --noEmit
```

## Production configuration

Set `KCET_DEBUG=0`, provide a unique `KCET_SECRET_KEY`, and configure `KCET_ALLOWED_HOSTS` and PostgreSQL through `KCET_DB_NAME`, `KCET_DB_USER`, `KCET_DB_PASSWORD`, `KCET_DB_HOST`, `KCET_DB_PORT`, and `KCET_DB_SSLMODE` as appropriate. Run migrations and `collectstatic` for admin assets. Serve the Vite `dist/` build on the same HTTPS origin as Django, forwarding `/api/` and `/admin/` to a WSGI server for `config.wsgi:application` with `backend/` as its working directory. Serve Django's collected admin assets at `/static/`.

Set `KCET_TRUST_HTTPS_PROXY=1` only when a trusted proxy overwrites the forwarded protocol header. Apply rate limits to registration and login before a public rollout.
