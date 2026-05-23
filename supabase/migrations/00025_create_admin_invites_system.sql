-- Create admin invites table
CREATE TABLE IF NOT EXISTS admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'admin',
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  used_by uuid REFERENCES profiles(id),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid REFERENCES profiles(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token) WHERE used_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_invites_created_by ON admin_invites(created_by);

-- RLS policies for admin_invites
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- Admins can view all invites
CREATE POLICY "Admins can view all invites"
  ON admin_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can create invites
CREATE POLICY "Admins can create invites"
  ON admin_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update invites (revoke)
CREATE POLICY "Admins can update invites"
  ON admin_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to generate admin invite
CREATE OR REPLACE FUNCTION generate_admin_invite(
  p_email text DEFAULT NULL,
  p_role text DEFAULT 'admin',
  p_expires_in_hours integer DEFAULT 168 -- 7 days default
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_token text;
  v_invite_id uuid;
  v_expires_at timestamp with time zone;
BEGIN
  -- Verify caller is admin
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can generate invites';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'seller', 'buyer') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin, seller, or buyer';
  END IF;

  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  
  -- Calculate expiration
  v_expires_at := now() + (p_expires_in_hours || ' hours')::interval;

  -- Insert invite
  INSERT INTO admin_invites (token, email, role, expires_at, created_by)
  VALUES (v_token, p_email, p_role, v_expires_at, v_admin_id)
  RETURNING id INTO v_invite_id;

  -- Return invite details
  RETURN json_build_object(
    'id', v_invite_id,
    'token', v_token,
    'email', p_email,
    'role', p_role,
    'expires_at', v_expires_at,
    'invite_url', '/register?invite=' || v_token
  );
END;
$$;

-- Function to validate and use invite
CREATE OR REPLACE FUNCTION validate_admin_invite(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite admin_invites;
BEGIN
  -- Get invite
  SELECT * INTO v_invite
  FROM admin_invites
  WHERE token = p_token
    AND used_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid, expired, or already used invite'
    );
  END IF;

  -- Return invite details
  RETURN json_build_object(
    'valid', true,
    'email', v_invite.email,
    'role', v_invite.role,
    'expires_at', v_invite.expires_at
  );
END;
$$;

-- Function to mark invite as used
CREATE OR REPLACE FUNCTION mark_invite_used(p_token text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_invites
  SET used_at = now(), used_by = p_user_id
  WHERE token = p_token
    AND used_at IS NULL
    AND revoked_at IS NULL;
END;
$$;

-- Function to revoke invite
CREATE OR REPLACE FUNCTION revoke_admin_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Verify caller is admin
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can revoke invites';
  END IF;

  -- Revoke invite
  UPDATE admin_invites
  SET revoked_at = now(), revoked_by = v_admin_id
  WHERE id = p_invite_id
    AND used_at IS NULL
    AND revoked_at IS NULL;
END;
$$;