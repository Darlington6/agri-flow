## Summary

<!-- What does this change, and why? Link an issue if there is one. -->

## Type of change

- [ ] Feature
- [ ] Fix
- [ ] Chore / tooling
- [ ] Docs

## Testing

<!-- What did you actually run? Be specific — "it works" isn't verification. -->

## Checklist

- [ ] PR title is a Conventional Commit, e.g. `feat(identity): add OTP resend` (it becomes the squash commit)
- [ ] `pnpm lint` / `uv run ruff check .` + `uv run ruff format --check .` pass (whichever app this touches)
- [ ] `pnpm typecheck` / `uv run python manage.py check` pass
- [ ] Tests pass locally
- [ ] Docs updated if behavior or setup changed (README, CONTRIBUTING, or the Platform Blueprint)
- [ ] Targets `dev` (not `staging` or `main` directly — see CONTRIBUTING.md; CI enforces this)
