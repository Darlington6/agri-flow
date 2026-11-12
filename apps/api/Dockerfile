# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
# Keep the uv version in sync with .github/workflows/ci.yml.
COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /bin/uv
# Use the image's Python (never download one), and copy packages into the
# venv rather than hard-linking from a cache that won't exist at runtime.
ENV UV_PYTHON_DOWNLOADS=never \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --locked --no-dev

FROM base AS runtime
RUN addgroup --system agriflow && adduser --system --ingroup agriflow agriflow
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY . .
RUN chown -R agriflow:agriflow /app
USER agriflow
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
