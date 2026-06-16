# Campus Connect — Backend

Django 5.2 + Django REST Framework + SimpleJWT (JWT auth) + PostgreSQL.
Dependency / runner: **[uv](https://docs.astral.sh/uv/)**.

---

## Prerequisites

- **Python** 3.11+
- **uv** — install: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **PostgreSQL** 14+ running locally (or update the DB env vars to point elsewhere)

---

## Setup

```bash
cd backend

# 1. Environment
cp .env.example .env
#   Fill in SECRET_KEY, the POSTGRES_* values, and (optionally) CONTACT_EMAIL.

# 2. Create the database (once) — example with psql:
createdb campus_connect           # or: psql -c "CREATE DATABASE campus_connect;"

# 3. Install dependencies
uv sync

# 4. Apply migrations
uv run python manage.py migrate

# 5. Seed the 79 campuses (IITs / NITs / IIITs)
uv run python manage.py seed_campuses

# 6. Create an admin user (for http://localhost:8000/admin/)
uv run python manage.py createsuperuser

# 7. Run
uv run python manage.py runserver      # → http://localhost:8000
```

---

## Environment variables (`.env`)

| Variable | Required | Notes |
|---|---|---|
| `SECRET_KEY` | yes | Django secret key. |
| `DEBUG` | no | `True` in dev. |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_PORT` | yes | PostgreSQL connection. |
| `GOOGLE_CLIENT_ID` | no | Enables Google sign-in verification. |
| `CONTACT_EMAIL` | no | Destination for Help-form messages. **Server-side only — never exposed to the client.** If blank, the contact form returns "not configured". |
| `EMAIL_BACKEND` + `EMAIL_*` / `DEFAULT_FROM_EMAIL` | no | Email delivery. Unset → console backend (prints to terminal). Set SMTP vars for real delivery. |

> `.env` is **gitignored** — secrets and `CONTACT_EMAIL` stay out of the repo.

---

## API overview

Base path: `/api`. All routes need a JWT `Authorization: Bearer <token>` header
**except** register, login, and contact.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Get JWT access + refresh |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET / PATCH | `/api/auth/me/` | Current user; PATCH to edit profile |
| POST | `/api/auth/google/` | Google sign-in |
| GET | `/api/posts/` | Feed (supports `?limit=`, default 50 / max 100) |
| POST | `/api/posts/create/` | Create post |
| GET | `/api/posts/me/` | Current user's posts |
| PATCH/PUT | `/api/posts/<id>/update/` | Edit own post |
| DELETE | `/api/posts/<id>/delete/` | Delete own post |
| POST / DELETE | `/api/posts/<id>/like/` · `/unlike/` | Like / unlike |
| GET | `/api/comments/post/<id>/` | Comments for a post |
| GET | `/api/campuses/` | List campuses (cached 5 min) |
| POST | `/api/campuses/<id>/join/` · `/api/campuses/leave/` | Membership |
| POST | `/api/contact/` | Help form → emails `CONTACT_EMAIL` (rate-limited) |

---

## Campus logos & banners

`Campus` has optional `logo_url` and `banner_url` fields. Leave them blank to use
the frontend's generated emblem + themed photo, or set real (official / freely-
licensed) asset URLs via **/admin/ → Campuses**. The repo intentionally ships **no**
trademarked logos.

---

## Production-hardening already applied

- **Rate limiting** (DRF throttles): anon 40/min, user 400/min, contact 5/min
- **Query optimization**: feed & profile annotate `num_likes` + `liked_by_me`, campus
  list annotates `num_students` — no N+1; serializers use the annotations
- **Indexes** on `Post(-created_at)`, `(author,-created_at)`, `(campus,-created_at)`
- **Caching**: campus list cached 5 min (LocMemCache), invalidated on join/leave/CRUD
- **Bounded feed**: `?limit` capped at 100

> For multi-process deploys, swap the cache `BACKEND` to Redis/Memcached and the email
> backend to SMTP.

---

## Common commands

```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
uv run python manage.py seed_campuses
uv run python manage.py createsuperuser
uv run python manage.py check
uv run ruff check .        # lint
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `OperationalError: could not connect` | PostgreSQL isn't running, or the `POSTGRES_*` values in `.env` are wrong. Verify with `psql`. |
| `database "campus_connect" does not exist` | Create it: `createdb campus_connect`. |
| `SECRET_KEY` / settings errors on boot | `.env` missing or incomplete — copy from `.env.example`. |
| Campus list empty | Run `seed_campuses`. |
| Contact form returns 503 "not configured" | Set `CONTACT_EMAIL` in `.env`. |
| Contact email not arriving | Dev uses the console backend (check the terminal). For real delivery set the SMTP `EMAIL_*` vars. |
| 429 Too Many Requests | Throttle hit — wait a minute, or raise the rates in `REST_FRAMEWORK` settings. |
| CORS errors from the frontend | Add the frontend origin to `CORS_ALLOWED_ORIGINS` in `backend/settings.py`. |
| Port 8000 in use | `uv run python manage.py runserver 8001` (update the frontend's `NEXT_PUBLIC_API_URL`). |
