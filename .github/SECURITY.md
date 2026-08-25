# Security Policy

AgriFlow is early-stage (see the root README for what's real vs. mock data today), but this repo is
public and payments/KYC/contract data are on the roadmap — report vulnerabilities responsibly rather than
opening a public issue.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repo: **Security tab → Report a vulnerability**.
This opens a private advisory only visible to maintainers, so details don't become public before a fix
ships.

Please include: what you found, steps to reproduce, and the potential impact. We'll acknowledge reports
and follow up as this moves from prototype toward the real implementation described in the Platform
Blueprint.

## Scope

- `apps/web`, `apps/api`, and the CI/CD configuration in this repo.
- Currently mock-data-only — see the README's "Current prototype limitations." Findings against the
  live-data paths (auth, payments, KYC) will matter most once `apps/api` has real endpoints.
