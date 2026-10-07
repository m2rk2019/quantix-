# User Acceptance Testing — Bug Tracker

| Field | Value |
|-------|-------|
| **Document** | UAT_BUG_TRACKER |
| **Product** | Quantix |
| **Version** | 1.0 |
| **Related** | [UAT_PLAN.md](./UAT_PLAN.md) · [UAT_CHECKLIST.md](./UAT_CHECKLIST.md) |

Use this log during UAT execution. Copy rows as needed or track in your issue system (Jira, Linear, GitHub Issues) using the same ID format: `UAT-BUG-###`.

**UAT period:** _______________ **Environment:** _______________ **Build:** _______________

---

## 1. Defect Severity Definitions

| Severity | Code | Release impact | Example |
|----------|------|----------------|---------|
| **Critical** | S1 | **Block release** | Wrong grand total; unauthorized data access; data loss on save |
| **High** | S2 | **Block release** unless accepted | Cannot export valid project; lifecycle transition fails |
| **Medium** | S3 | May ship with fix date | Filter incorrect; audit missing optional field |
| **Low** | S4 | Backlog | Label typo; minor alignment issue |
| **Info** | S5 | Backlog / V2 | Enhancement request; documentation note |

---

## 2. Defect Status Workflow

```
New → Triaged → In Progress → Fixed → Retest → Closed
                    ↓
              Deferred / Won't fix (with PO approval)
```

| Status | Meaning |
|--------|---------|
| **New** | Logged by tester; not yet reviewed |
| **Triaged** | Severity and priority assigned |
| **In Progress** | Developer working on fix |
| **Fixed** | Fix deployed to UAT environment |
| **Retest** | Tester verifying fix |
| **Closed** | Verified fixed |
| **Deferred** | Accepted for post-release (document reason) |
| **Won't fix** | Not a defect or out of scope (PO approval) |

---

## 3. Defect Log

| ID | Date | Scenario ID | Module | Summary | Steps to reproduce | Expected | Actual | Severity | Priority | Status | Assignee | Fixed in | Retest result |
|----|------|-------------|--------|---------|-------------------|----------|--------|----------|----------|--------|----------|----------|---------------|
| UAT-BUG-001 | | | | | | | | | | New | | | |
| UAT-BUG-002 | | | | | | | | | | New | | | |
| UAT-BUG-003 | | | | | | | | | | New | | | |
| UAT-BUG-004 | | | | | | | | | | New | | | |
| UAT-BUG-005 | | | | | | | | | | New | | | |
| UAT-BUG-006 | | | | | | | | | | New | | | |
| UAT-BUG-007 | | | | | | | | | | New | | | |
| UAT-BUG-008 | | | | | | | | | | New | | | |
| UAT-BUG-009 | | | | | | | | | | New | | | |
| UAT-BUG-010 | | | | | | | | | | New | | | |

*Add rows as needed. Do not delete closed defects — mark Closed for audit trail.*

---

## 4. Defect Entry Template (copy for each new bug)

```
ID:            UAT-BUG-___
Date reported: YYYY-MM-DD
Reporter:      
Scenario ID:   UAT-____-___
Module:        
Build:         

SUMMARY:
One-line description

STEPS TO REPRODUCE:
1.
2.
3.

EXPECTED RESULT:
(per UAT_CHECKLIST)

ACTUAL RESULT:


SEVERITY:  S1 / S2 / S3 / S4 / S5
PRIORITY:  P1 / P2 / P3 / P4
STATUS:    New

ENVIRONMENT:
- Browser:
- Viewport:
- Role/account:
- Project ID (if applicable):

SCREENSHOTS / ATTACHMENTS:


ASSIGNEE:      
TARGET FIX:    
```

---

## 5. Defect Summary Dashboard

Update at end of each UAT day and at sign-off.

| Severity | New | Triaged | In Progress | Fixed | Retest | Closed | Deferred |
|----------|-----|---------|-------------|-------|--------|--------|----------|
| S1 Critical | | | | | | | |
| S2 High | | | | | | | |
| S3 Medium | | | | | | | |
| S4 Low | | | | | | | |
| S5 Info | | | | | | | |
| **Total** | | | | | | | |

### Open blockers (must be empty for Go decision)

| ID | Summary | Severity | Owner | ETA |
|----|---------|----------|-------|-----|
| | | | | |

---

## 6. Defects by Module

| Module | S1 | S2 | S3 | S4 | S5 | Open total |
|--------|----|----|----|----|-----|------------|
| Login | | | | | | |
| Dashboard | | | | | | |
| Projects | | | | | | |
| Create Project | | | | | | |
| Project Details | | | | | | |
| WBS | | | | | | |
| BOQ | | | | | | |
| Estimate Summary | | | | | | |
| Validation | | | | | | |
| Audit Trail | | | | | | |
| Excel Export | | | | | | |
| Cross-cutting | | | | | | |

---

## 7. Triage Meeting Notes

| Date | Attendees | Decisions |
|------|-----------|-----------|
| | | |
| | | |
| | | |

---

## 8. Retest Log

| Bug ID | Fix description | Retest date | Tester | Result (Pass/Fail) | Notes |
|--------|-----------------|-------------|--------|-------------------|-------|
| | | | | | |
| | | | | | |

---

## 9. Deferred / Accepted Defects (Conditional Go)

Defects approved for release with mitigation — requires Product Owner written approval.

| Bug ID | Severity | Summary | Mitigation / workaround | Approved by | Date |
|--------|----------|---------|-------------------------|-------------|------|
| | | | | | |

---

## 10. Link to Sign-Off

When all S1/S2 defects are Closed (or formally deferred in Section 9), complete the sign-off template in [UAT_PLAN.md](./UAT_PLAN.md) Section 10.

---

*End of Document*
