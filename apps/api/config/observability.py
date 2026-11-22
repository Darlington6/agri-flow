"""Error reporting to Sentry, without personal data.

Errors carry the user's id (look them up in the admin) and nothing that
identifies them directly: no names, emails, phone numbers, IP addresses,
cookies or request bodies, and no sign-in tokens or codes. Copying contact
details to a third party abroad would need a legal basis and a line in the
privacy notice under Rwanda's data protection law, for no debugging gain.
"""

import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import sentry_sdk

FILTERED = "[Filtered]"

# Query parameters that carry one-time secrets (magic links, codes) or tokens.
SECRET_PARAMS = {"token", "code", "refresh", "access", "password"}

EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
# International phone numbers: + then 8 to 15 digits, spaces/dashes allowed.
PHONE = re.compile(r"\+\d[\d\s-]{6,17}\d")


def scrub_text(text: str) -> str:
    return PHONE.sub(FILTERED, EMAIL.sub(FILTERED, text))


def scrub_query(query: str) -> str:
    pairs = parse_qsl(query, keep_blank_values=True)
    return urlencode(
        [(k, FILTERED if k.lower() in SECRET_PARAMS else scrub_text(v)) for k, v in pairs],
        safe="[]",
    )


def scrub_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit(parts._replace(query=scrub_query(parts.query))) if parts.query else url


def scrub_event(event, hint=None):
    """Sentry `before_send`: strips what the SDK settings can't."""
    request = event.get("request")
    if request:
        for key in ("data", "cookies", "env"):
            request.pop(key, None)
        if isinstance(request.get("query_string"), str):
            request["query_string"] = scrub_query(request["query_string"])
        if isinstance(request.get("url"), str):
            request["url"] = scrub_url(request["url"])

    if isinstance(event.get("message"), str):
        event["message"] = scrub_text(event["message"])
    logentry = event.get("logentry") or {}
    for key in ("message", "formatted"):
        if isinstance(logentry.get(key), str):
            logentry[key] = scrub_text(logentry[key])
    if "params" in logentry:
        logentry["params"] = [scrub_text(str(p)) for p in logentry["params"]]
    for exc in (event.get("exception") or {}).get("values") or []:
        if isinstance(exc.get("value"), str):
            exc["value"] = scrub_text(exc["value"])

    for crumb in (event.get("breadcrumbs") or {}).get("values") or []:
        if isinstance(crumb.get("message"), str):
            crumb["message"] = scrub_text(crumb["message"])
        data = crumb.get("data") or {}
        if isinstance(data.get("url"), str):
            data["url"] = scrub_url(data["url"])
    return event


# What the SDK may collect at all (scrub_event then cleans what's left).
DATA_COLLECTION = {
    "user_info": False,  # no email, username or IP address; identify() adds the id
    "cookies": {"mode": "off"},
    "http_headers": {"request": {"mode": "allowlist", "terms": ["content-type", "user-agent"]}},
    "http_bodies": [],  # no request bodies of any type
    "url_query_params": {"mode": "off"},
    "database_query_data": False,  # SQL is kept, the values in it aren't
    "stack_frame_variables": False,
}

ENVIRONMENTS = {"prod": "production", "staging": "staging"}


def init_sentry(dsn: str, settings_module: str, release: str | None, **overrides) -> None:
    """Starts reporting when a DSN is set; does nothing otherwise.
    `overrides` are for tests (e.g. a transport that records events)."""
    if not dsn:
        return
    flavour = settings_module.rsplit(".", 1)[-1]
    options = {
        "dsn": dsn,
        "environment": ENVIRONMENTS.get(flavour, flavour),
        "release": release or None,
        "data_collection": DATA_COLLECTION,
        # A sample of requests is timed, to spot slow endpoints. Low enough to
        # stay inside the free plan.
        "traces_sample_rate": 0.1,
        "before_send": scrub_event,
        "before_send_transaction": scrub_event,
    }
    sentry_sdk.init(**{**options, **overrides})


def identify(user) -> None:
    """Tags the current request's errors with the signed-in user's id only."""
    sentry_sdk.set_user({"id": str(user.pk)} if user is not None else None)
