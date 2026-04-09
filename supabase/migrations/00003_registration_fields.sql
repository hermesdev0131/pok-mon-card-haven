-- 00003: Add registration fields (PF/PJ support)

-- New columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual' CHECK (account_type IN ('individual', 'business'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS razao_social text;

-- Unique indexes (allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_nickname ON profiles(nickname) WHERE nickname IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_cpf_hash ON profiles(cpf_hash) WHERE cpf_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_cnpj ON profiles(cnpj) WHERE cnpj IS NOT NULL;

-- Update trigger to extract all metadata fields on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (
    id, full_name, avatar_url, nickname, cpf_hash, rg, date_of_birth,
    account_type, cnpj, razao_social,
    phone, address_zip, address_line, address_number, address_complement,
    address_city, address_state
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'cpf_hash',
    new.raw_user_meta_data->>'rg',
    (new.raw_user_meta_data->>'date_of_birth')::date,
    coalesce(new.raw_user_meta_data->>'account_type', 'individual'),
    new.raw_user_meta_data->>'cnpj',
    new.raw_user_meta_data->>'razao_social',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address_zip',
    new.raw_user_meta_data->>'address_line',
    new.raw_user_meta_data->>'address_number',
    new.raw_user_meta_data->>'address_complement',
    new.raw_user_meta_data->>'address_city',
    new.raw_user_meta_data->>'address_state'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
