-- Profile lookup RPC (SECURITY DEFINER) for authenticated sessions.

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id uuid,
  email varchar,
  full_name varchar,
  role public.user_role,
  deleted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.full_name, u.role, u.deleted_at
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
