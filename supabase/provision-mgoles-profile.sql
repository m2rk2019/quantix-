-- Provision profile for existing Auth user (run AFTER apply-all-migrations.sql)
-- Auth email: mgoles@megawide.com.ph
-- Role: super_admin (highest application role)

INSERT INTO public.users (id, email, full_name, role)
VALUES (
  '7de80660-a7d9-44a7-a046-3048bb110879',
  'mgoles@megawide.com.ph',
  'mgoles',
  'super_admin'
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  deleted_at = NULL,
  updated_at = now();

-- Verify IDs match
SELECT
  id AS profile_id,
  email,
  role,
  id = '7de80660-a7d9-44a7-a046-3048bb110879'::uuid AS matches_auth_user_id
FROM public.users
WHERE email = 'mgoles@megawide.com.ph'
  AND deleted_at IS NULL;
