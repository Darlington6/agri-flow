# AgriFlow API

Django + DRF backend. Currently a bare skeleton — settings split by environment, one health endpoint,
no domain logic yet. See the Platform Blueprint (Sections 1–2) for the intended bounded-context
architecture this grows into.

## Run it (via Docker — recommended, no local Python needed)

```bash
docker compose up api        # from the repo root; also brings up postgres + redis
curl http://localhost:8000/api/v1/health/
```

## Run it locally (needs Python 3.12 + Poetry 2.x)

Python is pinned in `.python-version`. `pyproject.toml` uses the standard PEP 621 `[project]` table, which
Poetry 1.x can't read. Use Poetry **2.4.1**, the version CI and the Dockerfile pin.

```bash
cp .env.example .env         # DATABASE_URL points at the compose Postgres on localhost:5433
docker compose up -d postgres redis   # from the repo root
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

## Common tasks

```bash
poetry run ruff check .
poetry run ruff format .     # CI runs `ruff format --check .`
poetry run pytest            # against the compose Postgres, same as CI
poetry run python manage.py makemigrations
poetry run python manage.py createsuperuser
```

## Dependencies and `requirements.txt`

`pyproject.toml` + `poetry.lock` are the source of truth. `requirements.txt` exists because Vercel installs
from it. It's generated, never hand-edited, and CI fails if it drifts from `poetry.lock`. After any
dependency change:

```bash
poetry add <package>                  # or edit pyproject.toml, then: poetry lock
poetry self add poetry-plugin-export  # once; Poetry 2 ships without `export`
poetry export --without-hashes --only main -f requirements.txt -o requirements.txt
```

It must include everything Django imports at startup. `config/__init__.py` imports the Celery app, so
`celery` and `redis` are runtime dependencies even where no worker runs.

`DJANGO_SETTINGS_MODULE` selects the environment: `config.settings.dev` (default for `manage.py`),
`.staging`, or `.prod` (default for `wsgi.py`/`asgi.py`). Never hardcode secrets — everything comes from
the environment; see `.env.example` for what's expected.
