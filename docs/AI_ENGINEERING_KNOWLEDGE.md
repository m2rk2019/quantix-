# AI Engineering Knowledge Engine — Quantix V1 (Sprint 10)

| Field | Value |
|-------|-------|
| **Document** | AI_ENGINEERING_KNOWLEDGE |
| **Version** | 10.0.0 |
| **Related** | [FORMULA_VALIDATION.md](./FORMULA_VALIDATION.md) |

---

## 1. Purpose

Sprint 10 upgrades the AI Estimator from template-based suggestions to an **engineering knowledge engine** with:

- Discipline-specific WBS/BOQ templates
- Material consumption and productivity factors
- Engineering quantity calculators (20 types)
- Company resource matching (no duplicates)
- Scope validation and alternatives
- Learning from approved estimates (audit history)
- Full audit trail for AI actions

---

## 2. Engineering Modules

| Module | Scope |
|--------|-------|
| Structural | Frame, slabs, rebar, formworks |
| Architectural | Masonry, plaster, paint, ceiling, floors, doors/windows |
| Civil | Earthworks, foundations, substructure |
| MEPF | Plumbing, electrical, HVAC, fire protection |
| Site Development | Mobilization, temporary works |
| Roads | Pavements, access roads |
| Drainage | Storm water systems |
| Water Supply | Domestic water connection |
| Sewer | Sanitary sewer connection |
| Landscaping | Softscape and external finishes |

Source: `lib/ai-estimator/knowledge/`

---

## 3. Quantity Generator

| Quantity Type | Typical Formula |
|---------------|-----------------|
| Concrete volume | GFA × 0.18 × basement factor |
| Rebar quantity | GFA × 45 kg/m² |
| Formworks | GFA × 1.6 m² contact area |
| CHB wall | Wall area × 0.35 |
| Plastering / Painting | GFA × 2.8 (wall/ceiling area) |
| Ceiling | Net floor × 0.88 |
| Floor finishes | Net floor area |
| Doors | storeys × 8 + basement × 2 |
| Windows | Floor plate × 0.35 glazing ratio |
| Lighting | Net floor / 12 m² per fixture |
| HVAC | Net floor / 25 m² per cassette |
| Fire protection | Net floor / 12 m² per sprinkler |
| Earthworks | GFA × 0.35 × basement factor |
| Piping / conduits | storeys × distribution factor |

Each quantity includes: **formula**, **engineering assumption**, **reference basis**, **confidence %**.

---

## 4. Resource Recommendation

1. Search Company Resource Library by description keywords
2. Reserve matched `library_item_id` to prevent duplicates
3. Apply material consumption + labor crew productivity
4. Flag unmatched rates as **AI Estimated**

---

## 5. Scope Checker

Detects: missing work, duplicate BOQ, empty WBS, incomplete WBS, missing disciplines, zero quantities, zero rates, missing resources.

---

## 6. AI Alternatives

- **Cheaper materials** — lower-cost library match
- **Alternative methods** — e.g. precast vs cast-in-place
- **Value engineering** — finish downgrades with savings estimate

---

## 7. Learning System

- On **apply**, logs `ai_estimate.applied` to `audit_log` with `approved: true`
- On **generate**, logs `ai_estimate.generated`
- Future plans for same `building_type` receive confidence boost (max +12%)

No database schema changes — uses existing `audit_log.payload` JSON.

---

## 8. Safety

| Rule | Implementation |
|------|----------------|
| Never overwrite manual edits | `user_edited_quantity` / `user_edited_rates` flags |
| All values editable | BOQ review panel inline quantity edit |
| Audit every AI action | `logAiEstimateGenerated`, `logAiEstimateApplied` |

---

## 9. Verification

```bash
npm run verify:ai-engineering
npm run verify:estimating-engine
npm run lint
npm run build
```

---

## 10. File Reference

| Path | Purpose |
|------|---------|
| `lib/ai-estimator/knowledge/` | WBS, BOQ, consumption, productivity, crews, sequences |
| `lib/ai-estimator/quantity-generator.ts` | Engineering quantity calculators |
| `lib/ai-estimator/alternatives.ts` | Value engineering suggestions |
| `lib/ai-estimator/learning.ts` | Learning boost computation |
| `services/ai-estimator/ai-learning.ts` | Audit integration |
| `features/ai-estimator/components/` | Wizard, review, alternatives, chat |
