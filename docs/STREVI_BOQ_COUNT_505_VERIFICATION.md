# STREVI BOQ Count 504 → 505 Verification

**Code modified:** No

**BEFORE extract leaves:** 504
**AFTER extract leaves:** 505
**DB active BOQ:** 505
**Net change:** 1

## Why the count changed

(+2 newly imported leaves) - (1 former package leaf) = +1

### Newly imported BOQ row(s)

| Field | Value |
| --- | --- |
| Excel row | 37 |
| Description | Maintenance Crew |
| Quantity | 1 |
| Unit | lot |
| Rate | 5637199.03 |
| Amount | 5637199.03 |
| Excel exact matches | 1 (rows: 37) |
| Classification | **A_existed_in_excel_previously_skipped** |

| Field | Value |
| --- | --- |
| Excel row | 377 |
| Description | Security Grills (Meter Center & Busduct) |
| Quantity | 1 |
| Unit | lot |
| Rate | 6000000 |
| Amount | 6000000 |
| Excel exact matches | 1 (rows: 377) |
| Classification | **A_existed_in_excel_previously_skipped** |

### Former leaf now treated as package/rollup (not a duplicate)

| Field | Value |
| --- | --- |
| Excel row | 373 |
| Description | MC2 Typ to MC-3F TO MC-16F |
| Quantity | 60 |
| Unit | set/s |
| Amount | 8619299.4 |
| Now group header | true |
| Reason | Previously imported package leaf; now correctly classified as rollup/assembly parent (components remain as leaves). |

## Acceptance

**Result: PASS**

Each newly imported BOQ row exists exactly once in Excel and exactly once in Quantix. Classification A (previously skipped). Not duplicated.
