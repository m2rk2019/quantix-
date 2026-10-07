-- BOQ category extended totals (additive RPC, no table changes)

CREATE OR REPLACE FUNCTION public.boq_category_totals(
  p_project_id UUID,
  p_wbs_id UUID DEFAULT NULL
)
RETURNS TABLE (
  material_total NUMERIC,
  labor_total NUMERIC,
  equipment_total NUMERIC,
  subcontract_total NUMERIC,
  grand_total NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(quantity * material_rate), 0) AS material_total,
    COALESCE(SUM(quantity * labor_rate), 0) AS labor_total,
    COALESCE(SUM(quantity * equipment_rate), 0) AS equipment_total,
    COALESCE(SUM(quantity * subcontract_rate), 0) AS subcontract_total,
    COALESCE(SUM(total_amount), 0) AS grand_total
  FROM public.boq_items
  WHERE project_id = p_project_id
    AND deleted_at IS NULL
    AND (p_wbs_id IS NULL OR wbs_id = p_wbs_id);
$$;

GRANT EXECUTE ON FUNCTION public.boq_category_totals(UUID, UUID) TO authenticated;
