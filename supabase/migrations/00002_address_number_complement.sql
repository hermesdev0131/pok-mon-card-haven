-- Add address_number and address_complement columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_complement text;
