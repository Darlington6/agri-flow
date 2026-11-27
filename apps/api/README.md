# AgriFlow API

Django + DRF backend. Currently a bare skeleton — settings split by environment, one health endpoint,
no domain logic yet. See the Platform Blueprint (Sections 1–2) for the intended bounded-context
architecture this grows into.

## Run it (via Docker — recommended, no local Python needed)

```bash
docker compose up -d --build api   # from the repo root; also brings up postgres, redis and mailpit
curl http://localhost:8000/api/v1/health/
```

Emails the local API sends land in Mailpit at http://localhost:8025 (the link is printed in the API's log
too). Packages live in the image (`/opt/venv`), so after a dependency change, `--build` is all it takes.

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
| `POST magic-link/code/` | `{email, code}`: the 6-digit code from the same email, for the phone apps. Signs in like the link; using either uses up both. Five tries. |
| `POST me/email/`, `POST email/confirm/` | Add an email: a link is sent to it, and the email is saved once the link is used (signed in or not). |
| `POST me/phone/`, `POST me/phone/confirm/` | Add a phone number: a code is texted to it and must be confirmed. |
| `POST google/` | Continue with Google: `{credential, nonce?}`: the ID token Google sent back, and the `nonce` the app put in its request to Google (the token must carry it; the web apps always send one). Signs in, links an existing account with the same Google-confirmed email, or creates one (named from Google). 400 for a token that isn't genuine or an unconfirmed email; 409 if that email's account is linked to a different Google account. |
| `POST token/refresh/` | New access + refresh tokens; each refresh token works once. |
| `POST token/logout/` | Retires the refresh token. |
| `GET`/`PATCH me/` | The signed-in user. `PATCH` takes `display_name`, `country` (ISO code, e.g. `RW`) and `language` (`en`, `fr`, `rw`, `sw`, `tw`). `needs_onboarding` is true until they've set up their account, and again when the terms change. |

Google sign-in tokens are checked here against Google's published keys (signature, issuer, expiry, and that
they're meant for one of `GOOGLE_CLIENT_IDS`, the web app's client by default; add the mobile apps' later).
The account keeps Google's own ID for the person, so it's found again even if their Google email changes.

Sign-in responses carry `access`, `refresh`, `user` and `created` (true when this sign-in created the
account). Adding a phone number or email that another account uses answers 409. Anything that sends a
text or an email is limited to 5 an hour per caller, and one address gets at most 5 emails an hour.

## Setting up an account (`/api/v1/onboarding/`, `/api/v1/network/`)

After signing up, people set up their account in a few steps, each saved as soon as it's done, so they can
stop and carry on later on any device: who they are (below), country and language, what they do on AgriFlow, a
phone number (optional), and agreeing to the terms and privacy notice.

| Endpoint | What it does |
| --- | --- |
| `GET`/`PUT compliance/personal-details/` | Who they are, as on their ID: `legal_name`, `date_of_birth` (`YYYY-MM-DD`) and `gender` (`woman`, `man`, `prefer_not_to_say`, or empty). Under 18 (worked out from the date of birth, `is_minor`), `guardian_name`, `guardian_relationship` (`parent`, `legal_guardian`, `relative`) and `guardian_phone` are required too; for adults they're kept empty. Private: only the person (here) and staff (`/admin`) see it, never other users or `me/`. The first step is done once these and the public `display_name` are set. |
| `GET onboarding/` | Which steps are done, the `next_step`, whether it's `complete`, and the `terms_version` to show. |
| `POST onboarding/skip-phone/` | They'd rather not add a phone number now; it isn't asked again. |
| `POST onboarding/complete/` | `{terms_version, accept_terms: true}`: records which terms they agreed to and when, and finishes. 409 if a step is missing or the terms changed meanwhile. Also how someone agrees to new terms. |
| `GET network/options/?country=RW` | The pick lists: Rwanda's provinces and districts (`regions` is null for countries without a list, where people type theirs), crops, buyer types and vehicle types. `cooperatives`: the cooperatives on AgriFlow in that country, new ones straight away (`verified: false`), never rejected ones. |
| `GET`/`POST network/profiles/` | The account's roles and their details. `POST {role, ...}` chooses a role (`farmer`, `buyer`, `delivery_partner` or `cooperative`) and grants it together with its profile. 409 if they already have it. |
| `PATCH network/profiles/<role>/` | Edit a profile. |
| `GET network/cooperative/members/` | For a cooperative's manager: the farmers who chose it (waiting first, then members, then declined: name, phone, place, crop names) and the counts. 403 for anyone without a cooperative. A cooperative profile also answers with `members` (`confirmed`, `pending`). |
| `POST network/cooperative/members/<id>/` | `{status: "confirmed" \| "declined"}`: confirms a farmer as a member, or declines them (removing a member declines them). 404 for another cooperative's. |

- **Farmers join cooperatives on AgriFlow.** A farmer profile's `cooperative_id` (from the options' list) asks to
  join that cooperative: a `Membership` that's `pending` until the cooperative confirms it (by its manager,
  `network/cooperative/members/`, or in `/admin`; field agents will confirm members too). Changing cooperative asks again; `null` leaves it. Farmer profiles answer
  with `cooperative` (`id`, `name`, `verified`, `membership`). A cooperative not on AgriFlow yet is typed in
  `cooperative_name` as before.
- **Nobody can give themselves a staff role.** Field agents and admins aren't offered; staff get their roles
  in `/admin` (Users → roles) and skip the role step.
- **A role isn't verification.** Every profile starts `unverified`; staff change `verification` in `/admin`.
- **Private details live in `apps/compliance`,** apart from the sign-in account, for verifying accounts
  (KYC) later. Gender is optional and only for reporting how many women AgriFlow reaches. The privacy notice
  must say what's collected and why before launch.
- **The terms version** is `TERMS_VERSION` (an environment variable, default `2026-11-draft`). Change it
  when the terms or privacy notice change materially, and everyone is asked to agree again.

## Deployed (staging and prod)

Both build on `config/settings/deployed.py`, which has no fallbacks: the server refuses to start if a
secret, the database, the allowed origins or the email settings are missing. Email links (sign in, sign up,
confirm an added email) go out through Brevo (django-anymail); phone codes answer 503 until there's an
SMS provider. The image collects
the admin's static files at build time and serves them with WhiteNoise; `scripts/serve.sh` runs `migrate`
and then gunicorn on `$PORT`.

Emails are rendered from `apps/identity/templates/identity/email/` (`link.html` and `link.txt`, one layout for
all three kinds; the wording per kind is `EMAIL_WORDING` in `apps/identity/channels.py`). The logo is loaded from
the website (`apps/site/public/email/`, at `PUBLIC_SITE_URL`); many email apps block images until asked, so the
wordmark beside it is text and the email reads fine without it. Set `PUBLIC_SITE_URL` once the real domain is live.

With `SENTRY_DSN` set, errors go to Sentry with the user's id and no personal data (see
`config/observability.py`; signed-in requests are tagged by `apps/identity/authentication.py`). Staff can check it works at
`/api/v1/debug/sentry-error/` after signing in at `/admin/`.

Hosting (Render, `render.yaml` in the repo root), the variables to set, and first-time setup are in the
Deployments section of [CONTRIBUTING](../../.github/CONTRIBUTING.md#deployments).
