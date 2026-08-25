# AgriFlow API

Django + DRF backend. Currently a bare skeleton — settings split by environment, one health endpoint,
no domain logic yet. See the Platform Blueprint (Sections 1–2) for the intended bounded-context
architecture this grows into.

## Run it (via Docker — recommended, no local Python needed)

```bash
docker compose up api        # from the repo root; also brings up postgres + redis
curl http://localhost:8000/api/v1/health/
```

## Run it locally (needs Python 3.12 + Poetry)

```bash
cp .env.example .env         # then point DATABASE_URL / REDIS_URL at something reachable
poetry install
poetry run python manage.py migrate
poetry run python manage.py runserver
```

## Common tasks

```bash
poetry run ruff check .
poetry run pytest
poetry run python manage.py makemigrations
poetry run python manage.py createsuperuser
```

`DJANGO_SETTINGS_MODULE` selects the environment: `config.settings.dev` (default for `manage.py`),
`.staging`, or `.prod` (default for `wsgi.py`/`asgi.py`). Never hardcode secrets — everything comes from
the environment; see `.env.example` for what's expected.
