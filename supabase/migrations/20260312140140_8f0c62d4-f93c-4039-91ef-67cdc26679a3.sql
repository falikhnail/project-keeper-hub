
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'viewer');

-- 2. Create user_roles table (workspace-level roles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Project members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, profile_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project admins or workspace admins can add members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Project admins or workspace admins can update members"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Project admins or workspace admins can remove members"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (true);

-- 6. Team invitations table
CREATE TABLE public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invitations"
  ON public.team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invitations"
  ON public.team_invitations FOR UPDATE
  TO authenticated
  USING (true);

-- 7. Function to auto-assign admin role to first user (project creator)
CREATE OR REPLACE FUNCTION public.auto_add_project_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_profile_id UUID;
BEGIN
  SELECT id INTO creator_profile_id FROM public.profiles WHERE user_id = NEW.created_by LIMIT 1;
  IF creator_profile_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, profile_id, role, added_by)
    VALUES (NEW.id, creator_profile_id, 'admin', creator_profile_id)
    ON CONFLICT (project_id, profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created_add_admin
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_project_creator_as_admin();

-- 8. Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  user_profile_id UUID;
BEGIN
  SELECT * INTO inv FROM public.team_invitations
  WHERE token = invitation_token AND status = 'pending' AND expires_at > now();

  IF inv IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  SELECT id INTO user_profile_id FROM public.profiles WHERE user_id = auth.uid();

  IF user_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Add to project members if project-specific
  IF inv.project_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, profile_id, role, added_by)
    VALUES (inv.project_id, user_profile_id, inv.role, inv.invited_by)
    ON CONFLICT (project_id, profile_id) DO UPDATE SET role = inv.role;
  END IF;

  -- Add workspace role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), inv.role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.team_invitations SET status = 'accepted' WHERE id = inv.id;

  RETURN jsonb_build_object('success', true);
END;
$$;
