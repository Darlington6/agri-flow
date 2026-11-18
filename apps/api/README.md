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

## Deployed (staging and prod)

Both build on `config/settings/deployed.py`, which has no fallbacks: the server refuses to start if a
secret, the database, the allowed origins or the email settings are missing. Magic links go out by email
through Brevo (django-anymail); phone sign-in answers 503 until there's an SMS provider. The image collects
the admin's static files at build time and serves them with WhiteNoise; `scripts/serve.sh` runs `migrate`
and then gunicorn on `$PORT`.

Hosting (Render, `render.yaml` in the repo root), the variables to set, and first-time setup are in the
Deployments section of [CONTRIBUTING](../../.github/CONTRIBUTING.md#deployments).
