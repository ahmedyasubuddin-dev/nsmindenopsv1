-- Allow users to create their own profile if it doesn't exist
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);









