from .deployed import *  # noqa: F401,F403

# Staging is prod-shaped on purpose — this is where the Platform Blueprint's
# QA/UAT and demos happen against realistic data (Section 19). Everything
# strict lives in deployed.py and applies here too; only prod adds HSTS,
# which browsers remember for a year and is hard to take back.
