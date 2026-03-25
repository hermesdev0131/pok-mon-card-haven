-- Allow admins to update seller profiles (e.g. toggle verified status).
-- Previously only sellers could update their own profile (auth.uid() = id).

CREATE POLICY "Admins can update seller profiles"
  ON seller_profiles FOR UPDATE
  USING (is_admin());
