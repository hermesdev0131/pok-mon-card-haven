-- Add address_number and address_complement columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_complement text;

-- Add seller_response column to disputes
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS seller_response text;
