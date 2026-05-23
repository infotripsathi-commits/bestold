-- Allow authenticated users to create new locations
CREATE POLICY "Authenticated users can create locations"
ON locations
FOR INSERT
TO authenticated
WITH CHECK (true);