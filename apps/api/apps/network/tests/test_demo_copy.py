"""The app's demo walkthrough runs without the API, so it carries its own
copy of the pick lists (apps/web/src/data/setupOptions.ts). This keeps the
two the same: change a list here, and this fails until the copy matches."""

import re
from pathlib import Path

import pytest

from apps.network import options

DEMO_COPY = Path(__file__).resolve().parents[5] / "apps/web/src/data/setupOptions.ts"


@pytest.fixture(scope="module")
def demo_copy() -> str:
    if not DEMO_COPY.exists():  # e.g. inside the API's Docker image
        pytest.skip("the web app isn't next to the API here")
    return DEMO_COPY.read_text()


def _section(source: str, name: str) -> str:
    return re.search(rf"const {name}\b.*?= [\[{{](.*?)\n[\]}}]", source, re.S).group(1)


def _options(source: str, name: str) -> list[tuple[str, str]]:
    return re.findall(r"value: '(\w+)', label: [\"']([^\"']+)[\"']", _section(source, name))


@pytest.mark.parametrize(
    "name,expected",
    [
        ("CROPS", options.CROPS),
        ("BUYER_TYPES", options.BUYER_TYPES),
        ("VEHICLE_TYPES", options.VEHICLE_TYPES),
    ],
)
def test_option_lists_match_the_demo_copy(demo_copy, name, expected):
    assert _options(demo_copy, name) == expected


def test_places_match_the_demo_copy(demo_copy):
    pattern = r"name: '([^']+)',\s*districts: \[([^\]]*)\]"
    places = re.findall(pattern, _section(demo_copy, "PLACES"))
    copied = {region: re.findall(r"'([^']+)'", districts) for region, districts in places}
    assert copied == options.PLACES["RW"]
