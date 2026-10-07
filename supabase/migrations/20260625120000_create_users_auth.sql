-- Quantix V1: users profile table and RLS for authentication (Sprint 1)

CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'admin',
  'estimator',
  'quantity_surveyor',
  'viewer'
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX users_email_active_unique
  ON public.users (email)
  WHERE deleted_at IS NULL;

CREATE INDEX users_role_idx ON public.users (role) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS helper: current user's role (SECURITY DEFINER for use in policies)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'admin');
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own active profile
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL);

-- Admins can read all active user profiles (User Management — future UI)
CREATE POLICY users_select_admin
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.is_admin_or_above()
  );

-- Super Admin can insert profiles (provisioning)
CREATE POLICY users_insert_super_admin
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() = 'super_admin'
    OR NOT EXISTS (SELECT 1 FROM public.users LIMIT 1)
  );

-- Admins can insert non–super-admin profiles
CREATE POLICY users_insert_admin
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    AND role <> 'super_admin'
  );

-- Super Admin can update any profile
CREATE POLICY users_update_super_admin
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

-- Admin can update non–super-admin profiles
CREATE POLICY users_update_admin
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'admin'
    AND role <> 'super_admin'
  )
  WITH CHECK (
    public.current_user_role() = 'admin'
    AND role <> 'super_admin'
  );

COMMENT ON TABLE public.users IS 'Application user profiles linked to auth.users';
