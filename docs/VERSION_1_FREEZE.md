# Quantix Version 1 — Freeze Lock

**Status:** Frozen  
**Version:** 1.0.0  
**Effective:** October 2026  

## Policy

**Version 1 is frozen.**

Future development starts at **Version 1.1**.

No modification of the Import Engine (`lib/smart-import/**`, `services/smart-import/**`) unless production bugs are discovered.

No modification of Version 1 estimating core behavior (WBS, BOQ, Resource Library, Rate Library, Estimate Summary, Tender Package, Master Templates, Historical Archive) except for production bug fixes.

## Official release artifacts

| Artifact | Path |
|----------|------|
| Release notes | [RELEASE.md](../RELEASE.md) |
| Changelog | [CHANGELOG.md](../CHANGELOG.md) |
| Version marker | [VERSION](../VERSION) |
| Git tag | `v1.0.0` (see RELEASE.md tag recommendation) |

## Enforcement

- Cursor rules: `.cursor/rules/quantix-v1-freeze.mdc`, `.cursor/rules/import-engine-v1-freeze.mdc`
- Import regression: `npm run regression:import-engine-v1` (NIA + STREVI must PASS)
