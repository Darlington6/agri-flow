#!/bin/sh
# Starts the API in a deployed environment: brings the database up to date,
# then serves. Migrations run here, on every start, because Render's free
# plan has no separate pre-deploy step; with one instance there's no race.
# PORT comes from the host (Render sets it); 8000 otherwise.
set -e
python manage.py migrate --noinput
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
