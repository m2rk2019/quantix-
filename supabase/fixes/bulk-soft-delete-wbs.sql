-- Bulk recursive soft-delete for WBS (+ related BOQ) in one statement/transaction.
-- SECURITY DEFINER so soft-delete is not blocked by UPDATE WITH CHECK reuse of
-- deleted_at IS NULL (same class of issue as 20260712120000_fix_wbs_soft_delete_rls).

BEGIN;

CREATE OR REPLACE FUNCTION public.bulk_soft_delete_wbs(
  p_project_id uuid,
  p_node_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_actor uuid := auth.uid();
  v_role public.user_role;
  v_project_status public.project_status;
  v_project_owner uuid;
  v_result jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_node_ids IS NULL OR cardinality(p_node_ids) = 0 THEN
    RETURN jsonb_build_object(
      'wbs_count', 0,
      'boq_count', 0,
      'deleted_ids', '[]'::jsonb
    );
  END IF;

  SELECT u.role
  INTO v_role
  FROM public.users u
  WHERE u.id = v_actor
    AND u.deleted_at IS NULL;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  SELECT p.status, p.created_by
  INTO v_project_status, v_project_owner
  FROM public.projects p
  WHERE p.id = p_project_id
    AND p.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF NOT (
    v_role IN ('super_admin', 'admin')
    OR (
      v_role = 'quantity_surveyor'
      AND v_project_status NOT IN ('approved', 'archived')
    )
    OR (
      v_role = 'estimator'
      AND v_project_owner = v_actor
      AND v_project_status IN ('draft', 'in_progress')
    )
  ) THEN
    RAISE EXCEPTION 'You do not have permission to edit WBS.';
  END IF;

  WITH RECURSIVE targets AS (
    SELECT w.id
    FROM public.wbs w
    WHERE w.project_id = p_project_id
      AND w.deleted_at IS NULL
      AND w.id = ANY (p_node_ids)

    UNION

    SELECT child.id
    FROM public.wbs child
    INNER JOIN targets t ON child.parent_id = t.id
    WHERE child.project_id = p_project_id
      AND child.deleted_at IS NULL
  ),
  boq_upd AS (
    UPDATE public.boq_items b
    SET
      deleted_at = v_now,
      updated_by = v_actor
    WHERE b.project_id = p_project_id
      AND b.deleted_at IS NULL
      AND b.wbs_id IN (SELECT id FROM targets)
    RETURNING b.id
  ),
  wbs_upd AS (
    UPDATE public.wbs w
    SET
      deleted_at = v_now,
      updated_by = v_actor
    WHERE w.project_id = p_project_id
      AND w.deleted_at IS NULL
      AND w.id IN (SELECT id FROM targets)
    RETURNING w.id
  )
  SELECT jsonb_build_object(
    'wbs_count', (SELECT count(*)::int FROM wbs_upd),
    'boq_count', (SELECT count(*)::int FROM boq_upd),
    'deleted_ids', coalesce(
      (SELECT jsonb_agg(id) FROM wbs_upd),
      '[]'::jsonb
    )
  )
  INTO v_result;

  RETURN coalesce(
    v_result,
    jsonb_build_object(
      'wbs_count', 0,
      'boq_count', 0,
      'deleted_ids', '[]'::jsonb
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_soft_delete_wbs(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_soft_delete_wbs(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_soft_delete_wbs(uuid, uuid[]) TO service_role;

COMMIT;
