-- Rollback for 20260715120000_rate_library_category_extend.sql
-- PostgreSQL cannot drop enum values safely once added.
-- This file is a no-op marker documenting that enum extension is irreversible
-- without recreating the type (not performed automatically).

-- Manual extreme rollback (destructive — do not run in production):
-- 1. Ensure no rows use category IN ('service','productivity')
-- 2. Recreate rate_library_category without those labels and migrate columns
-- Prefer leaving the additive labels in place.
