# Issue Report Template — Quantix V1

Copy this template when reporting a bug or issue during the pilot. Fill in every **Required** field.

---

## Report Header

| Field | Value |
|-------|-------|
| **Report ID** | _[Auto or manual, e.g. QTX-2026-001]_ |
| **Date reported** | _[YYYY-MM-DD]_ |
| **Reported by** | _[Name, email]_ |
| **Role** | _[Estimator / QS / Admin / Viewer]_ |
| **Environment** | _[Pilot URL, e.g. https://quantix.example.com]_ |
| **Browser** | _[Chrome 138 / Edge 138 / Firefox / Safari + version]_ |

---

## Issue Summary

**Title (Required):** _[One line — e.g. "BOQ total amount wrong after quantity edit"]_

**Severity (Required):** _[ Critical / High / Medium / Low ]_

**Module (Required):** _[ Authentication / Projects / WBS / BOQ / Rate Analysis / Estimate Summary / Export / Dashboard / Other ]_

**UAT Scenario ID (if applicable):** _[ e.g. UAT-BOQ-004 or N/A ]_

---

## Description

**What happened? (Required)**

_Describe the issue in plain language._

**What did you expect? (Required)**

_Describe the correct behavior._

**What did you actually see? (Required)**

_Describe what occurred, including any error messages._

---

## Reproduction Steps

**Steps to reproduce (Required):**

1. _[Step 1 — e.g. Log in as Estimator]_
2. _[Step 2 — e.g. Open project QTX-2026-000042]_
3. _[Step 3 — e.g. Edit BOQ line 001 quantity from 10 to 15]_
4. _[Step 4 — e.g. Observe total amount]_

**Reproducibility:** _[ Always / Sometimes / Once ]_

**Frequency:** _[ e.g. 3 of 5 attempts ]_

---

## Evidence

| Item | Attached? | Notes |
|------|-----------|-------|
| Screenshot(s) | _[ Yes / No ]_ | _[Filenames or links]_ |
| Screen recording | _[ Yes / No ]_ | |
| Exported Excel file | _[ Yes / No ]_ | |
| Browser console errors | _[ Yes / No ]_ | _[F12 → Console, copy errors]_ |
| Network error (HAR) | _[ Yes / No ]_ | _[For failed API calls]_ |

---

## Project Context

| Field | Value |
|-------|-------|
| **Project code** | _[ e.g. QTX-2026-000042 or N/A ]_ |
| **Project status** | _[ Draft / In Progress / For Review / Approved ]_ |
| **BOQ line count** | _[ Approximate or N/A ]_ |
| **WBS node count** | _[ Approximate or N/A ]_ |

---

## Calculation Details (if applicable)

_For estimating/calculation issues, provide manual check:_

| Field | Manual | System | Variance |
|-------|--------|--------|----------|
| Quantity | | | |
| Unit rate | | | |
| Line amount | | | |
| Direct cost | | | |
| Grand total | | | |

---

## Impact

**Who is affected?** _[ Just me / All estimators / All users ]_

**Workaround available?** _[ Yes — describe / No ]_

**Blocks pilot testing?** _[ Yes / No ]_

---

## Triage (filled by support team)

| Field | Value |
|-------|-------|
| **Status** | _[ New / Confirmed / In Progress / Fixed / Won't Fix / Duplicate ]_ |
| **Assigned to** | |
| **Root cause** | |
| **Fix version** | |
| **Resolution notes** | |

---

## Checklist Before Submitting

- [ ] Title is specific and actionable
- [ ] Reproduction steps are complete
- [ ] Severity matches impact (see PILOT_TEST_GUIDE.md)
- [ ] Screenshots attached for UI issues
- [ ] Project code included for data issues
- [ ] Not listed in KNOWN_LIMITATIONS.md (or noted if unexpected)

---

*Template version: 1.0.0-pilot · Quantix V1*
