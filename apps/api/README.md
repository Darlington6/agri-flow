# AgriFlow API

Django + DRF backend. Currently a bare skeleton — settings split by environment, one health endpoint,
no domain logic yet. See the Platform Blueprint (Sections 1–2) for the intended bounded-context
architecture this grows into.

## Run it (via Docker — recommended, no local Python needed)

```bash
docker compose up api        # from the repo root; also brings up postgres + redis
curl http://localhost:8000/api/v1/health/
```

## Run it locally (needs [uv](https://docs.astral.sh/uv/))

uv installs Python 3.12 itself if needed (pinned in `.python-version`) and the exact dependency versions in
`uv.lock`. CI and the Dockerfile (which Render deploys) install from that same lock.

```bash
cp .env.example .env         # DATABASE_URL points at the compose Postgres on localhost:5433
docker compose up -d postgres redis   # from the repo root
uv sync                      # creates .venv with runtime + dev dependencies
uv run python manage.py migrate
uv run python manage.py runserver
docker compose down          # when you're done
```

## Common tasks

```bash
uv run ruff check .
uv run ruff format .         # CI runs `ruff format --check .`
uv run pytest                # against the compose Postgres, same as CI
uv run python manage.py makemigrations
uv run python manage.py createsuperuser
```

## Dependencies

`pyproject.toml` declares dependencies; `uv.lock` pins every version, and is the only lock file. CI runs
`uv sync --locked`, so it fails if `uv.lock` is out of date with `pyproject.toml`.

```bash
uv add <package>             # runtime dependency (updates pyproject.toml and uv.lock)
uv add --dev <package>       # dev-only tool (dependency-groups.dev)
uv lock --upgrade-package <package>   # bump one package within its version range
```

Everything Django imports at startup must be a runtime dependency. `config/__init__.py` imports the Celery
app, so `celery` and `redis` are runtime dependencies even where no worker runs.

If `docker compose` serves stale packages after a dependency change, the API's virtualenv lives in the
`agriflow_agriflow_api_venv` volume (Compose prefixes the project name): `docker compose down`, then
`docker volume rm agriflow_agriflow_api_venv`, then `docker compose build api`.

`DJANGO_SETTINGS_MODULE` selects the environment: `config.settings.dev` (default for `manage.py`),
`.staging`, or `.prod` (default for `wsgi.py`/`asgi.py`). Never hardcode secrets — everything comes from
the environment; see `.env.example` for what's expected. A local `.env` is only read with the dev settings.

## Sign-up and sign-in (`/api/v1/auth/`)

An account has a phone number, an email, or both, never neither. The first successful sign-in creates it.

| Endpoint | What it does |
| --- | --- |
| `POST otp/request/`, `POST otp/verify/` | Text a code; the code signs in (or signs up). |
| `POST magic-link/request/`, `GET magic-link/verify/?token=` | Email a link; the link signs in (or signs up). The answer is the same whether or not the email has an account. |
| `POST me/email/`, `POST email/confirm/` | Add an email: a link is sent to it, and the email is saved once the link is used (signed in or not). |
| `POST me/phone/`, `POST me/phone/confirm/` | Add a phone number: a code is texted to it and must be confirmed. |
| `POST token/refresh/` | New access + refresh tokens; each refresh token works once. |
| `POST token/logout/` | Retires the refresh token. |
| `GET`/`PATCH me/` | The signed-in user. |

Sign-in responses carry `access`, `refresh`, `user` and `created` (true when this sign-in created the
account). Adding a phone number or email that another account uses answers 409. Anything that sends a
text or an email is limited to 5 an hour per caller, and one address gets at most 5 emails an hour.

## Deployed (staging and prod)

Both build on `config/settings/deployed.py`, which has no fallbacks: the server refuses to start if a
secret, the database, the allowed origins or the email settings are missing. Email links (sign in, sign up,
confirm an added email) go out through Brevo (django-anymail); phone codes answer 503 until there's an
SMS provider. The image collects
the admin's static files at build time and serves them with WhiteNoise; `scripts/serve.sh` runs `migrate`
and then gunicorn on `$PORT`.

With `SENTRY_DSN` set, errors go to Sentry with the user's id and no personal data (see
`config/observability.py`; signed-in requests are tagged by `apps/identity/authentication.py`).

Hosting (Render, `render.yaml` in the repo root), the variables to set, and first-time setup are in the
Deployments section of [CONTRIBUTING](../../.github/CONTRIBUTING.md#deployments).
