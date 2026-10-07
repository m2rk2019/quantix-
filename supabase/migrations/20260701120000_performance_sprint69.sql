-- Sprint 6.9: Performance indexes and aggregation helpers

CREATE INDEX IF NOT EXISTS boq_items_project_sort_idx
  ON public.boq_items (project_id, item_code)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.sum_boq_total_amount(
  p_project_id UUID,
  p_wbs_id UUID DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM public.boq_items
  WHERE project_id = p_project_id
    AND deleted_at IS NULL
    AND (p_wbs_id IS NULL OR wbs_id = p_wbs_id);
$$;

CREATE OR REPLACE FUNCTION public.boq_direct_totals_by_wbs(
  p_project_id UUID
)
RETURNS TABLE (wbs_id UUID, direct_total NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wbs_id,
    COALESCE(SUM(total_amount), 0) AS direct_total
  FROM public.boq_items
  WHERE project_id = p_project_id
    AND deleted_at IS NULL
  GROUP BY wbs_id;
$$;

GRANT EXECUTE ON FUNCTION public.sum_boq_total_amount(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boq_direct_totals_by_wbs(UUID) TO authenticated;
