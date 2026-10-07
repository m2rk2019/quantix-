# Quantix Version 1.0.0
## Official Stable Release

**Release Date:** October 2026

---

## Status

✓ Smart Excel Import  
✓ WBS  
✓ BOQ  
✓ Resource Library  
✓ Rate Library  
✓ Estimate Summary  
✓ Tender Package  
✓ Master Templates  
✓ Manual Quantity Takeoff Foundation  
✓ Production Build PASS  
✓ Import Regression PASS  
✓ NIA PASS  
✓ STREVI PASS  

---

## Known limitations

- AI Quantity Takeoff not included  
- AI Estimator not included  
- Procurement not included  
- Contracts not included  
- Cash Flow not included  

---

## Version 1 — Frozen

**Version 1 is frozen.**

- Future development starts at **Version 1.1**.
- Do **not** modify the Import Engine (`lib/smart-import/**`, `services/smart-import/**`) unless a **production bug** is discovered.
- Do **not** change Version 1 estimating core behavior (WBS, BOQ, Resource Library, Rate Library, Estimate Summary, Tender, Master Templates, Historical Archive) except for production bug fixes.
- Manual Quantity Takeoff continues under the V1.1 module paths (`features/takeoff/**`, `services/takeoff/**`, `lib/takeoff/**`).

Freeze markers:

| Component | Location |
|-----------|----------|
| Import Engine version | `lib/smart-import/engine-version.ts` |
| Import Engine freeze rule | `.cursor/rules/import-engine-v1-freeze.mdc` |
| Quantix V1 freeze rule | `.cursor/rules/quantix-v1-freeze.mdc` |
| Regression goldens | `docs/import-engine-v1/REGRESSION_GOLDENS.json` |
| This release | `VERSION` → `1.0.0` |

---

## Git tag recommendation

This repository must have at least one commit before a tag can be created.

After the release commit that includes this file, `CHANGELOG.md`, and `VERSION`:

```bash
git tag -a v1.0.0 -m "Quantix Official Release v1.0.0"
git push origin v1.0.0
```

Lightweight alternative (not preferred for official releases):

```bash
git tag v1.0.0
git push origin v1.0.0
```

Verify:

```bash
git show v1.0.0 --no-patch
npm run regression:import-engine-v1
npm run build
```

---

## Related documents

- [CHANGELOG.md](./CHANGELOG.md) — Version 1 milestones  
- [VERSION](./VERSION) — current version marker  
- [docs/DEMO_SEED.md](./docs/DEMO_SEED.md) — demo environment  
- [docs/IMPORT_ENGINE_V1.md](./docs/IMPORT_ENGINE_V1.md) — Import Engine standard  
- [docs/V1_KNOWN_LIMITATIONS.md](./docs/V1_KNOWN_LIMITATIONS.md) — detailed limitations  
