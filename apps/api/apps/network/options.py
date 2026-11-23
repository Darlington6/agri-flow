"""The pick lists people choose from while setting up their account.

Stored values are the codes (and place names); the labels are English for
now and move to the app's translation files once it's translated. Places
are listed for countries we operate in; anywhere else people type their
region, so nobody is blocked by a missing list.
"""

CROPS = [
    ("maize", "Maize"),
    ("beans", "Beans"),
    ("rice", "Rice"),
    ("sorghum", "Sorghum"),
    ("wheat", "Wheat"),
    ("soybean", "Soybeans"),
    ("groundnut", "Groundnuts"),
    ("cassava", "Cassava"),
    ("irish_potato", "Irish potatoes"),
    ("sweet_potato", "Sweet potatoes"),
    ("yam", "Yams"),
    ("banana", "Bananas"),
    ("coffee", "Coffee"),
    ("tea", "Tea"),
    ("cocoa", "Cocoa"),
    ("avocado", "Avocados"),
    ("vegetables", "Vegetables"),
    ("fruits", "Fruits"),
    ("other", "Other"),
]

BUYER_TYPES = [
    ("processor", "Processor"),
    ("exporter", "Exporter"),
    ("wholesaler", "Wholesaler"),
    ("retailer", "Retailer or supermarket"),
    ("hospitality", "Hotel or restaurant"),
    ("institution", "School, hospital or other institution"),
    ("aggregator", "Aggregator or trader"),
    ("other", "Other"),
]

VEHICLE_TYPES = [
    ("bicycle", "Bicycle"),
    ("motorbike", "Motorbike"),
    ("car", "Car"),
    ("pickup", "Pickup"),
    ("truck", "Truck"),
    ("refrigerated_truck", "Refrigerated truck"),
]

# Rwanda's five provinces and thirty districts (2006 administrative map).
PLACES: dict[str, dict[str, list[str]]] = {
    "RW": {
        "City of Kigali": ["Gasabo", "Kicukiro", "Nyarugenge"],
        "Eastern Province": [
            "Bugesera",
            "Gatsibo",
            "Kayonza",
            "Kirehe",
            "Ngoma",
            "Nyagatare",
            "Rwamagana",
        ],
        "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
        "Southern Province": [
            "Gisagara",
            "Huye",
            "Kamonyi",
            "Muhanga",
            "Nyamagabe",
            "Nyanza",
            "Nyaruguru",
            "Ruhango",
        ],
        "Western Province": [
            "Karongi",
            "Ngororero",
            "Nyabihu",
            "Nyamasheke",
            "Rubavu",
            "Rusizi",
            "Rutsiro",
        ],
    },
}


def codes(choices: list[tuple[str, str]]) -> set[str]:
    return {code for code, _ in choices}


def as_options(choices: list[tuple[str, str]]) -> list[dict[str, str]]:
    return [{"value": code, "label": label} for code, label in choices]


def places_for(country: str) -> list[dict] | None:
    """The regions and districts to choose from, or None to type them."""
    regions = PLACES.get(country)
    if regions is None:
        return None
    return [{"name": name, "districts": districts} for name, districts in regions.items()]
