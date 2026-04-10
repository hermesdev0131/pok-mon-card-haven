-- 00004: Add nickname change cooldown tracking
-- Users can only change their nickname once every 90 days.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname_changed_at timestamptz;

-- Backfill existing users: treat their signup date as the last nickname change.
-- This locks recent signups for the remainder of the 90-day window and unlocks
-- any account older than 90 days. Only backfill users who have a nickname set
-- and don't already have a nickname_changed_at value.
UPDATE profiles
SET nickname_changed_at = created_at
WHERE nickname IS NOT NULL AND nickname_changed_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, avatar_url, nickname, cpf_hash, rg, date_of_birth,
    account_type, cnpj, razao_social,
    phone, address_zip, address_line, address_number, address_complement,
    address_city, address_state, nickname_changed_at
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'cpf_hash',
    new.raw_user_meta_data->>'rg',
    nullif(new.raw_user_meta_data->>'date_of_birth', '')::date,
    coalesce(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'razao_social',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address_zip',
    new.raw_user_meta_data->>'address_line',
    new.raw_user_meta_data->>'address_number',
    new.raw_user_meta_data->>'address_complement',
    new.raw_user_meta_data->>'address_city',
    new.raw_user_meta_data->>'address_state',
    case when new.raw_user_meta_data->>'nickname' is not null then now() else null end
  );
  RETURN new;
END;
$$;
