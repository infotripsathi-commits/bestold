-- Add policy for admins to manage (UPDATE/DELETE) phone submissions
CREATE POLICY "Admin can manage phone submissions"
  ON phone_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );