-- ============================================================
-- GradedBR — Seed Data
-- ============================================================
-- Run in Supabase Dashboard → SQL Editor
-- Prerequisite: run 00001_initial_schema.sql first
--
-- Prices: stored as INTEGER in centavos (R$2.850,00 = 285000)
-- UUIDs: deterministic pattern for easy debugging
--
-- UUID MAPPING:
--   Admin:             ad000000-0000-0000-0000-000000000001
--   Sellers:           a0000000-0000-0000-0000-00000000000X
--   Buyers:            b0000000-0000-0000-0000-00000000000X
--   Card bases (INT):  c0000000-0000-0000-0000-0000000000XX
--   Card bases (JP):   c0000000-0000-0000-0000-0000000001XX
--   Active listings:   d0000000-0000-0000-0000-0000000000XX
--   Sold listings:     d1000000-0000-0000-0000-0000000000XX
--   Order listings:    d3000000-0000-0000-0000-00000000000X
--   Active orders:     e0000000-0000-0000-0000-00000000000X
--   Completed orders:  e1000000-0000-0000-0000-0000000000XX
--   Confirmed sales:   f0000000-0000-0000-0000-0000000000XX
--   Questions:         aa000000-0000-0000-0000-00000000000X
--   Reviews:           bb000000-0000-0000-0000-00000000000X
-- ============================================================

begin;

-- =========================
-- 0. CLEANUP — remove previous seed data so the script is re-runnable
-- =========================
-- Delete in reverse dependency order to avoid FK violations.
-- Only deletes rows with the deterministic seed UUIDs.

-- Temporarily disable immutability trigger on confirmed_sales
alter table confirmed_sales disable trigger guard_confirmed_sales_delete;

delete from reviews         where id::text like 'bb000000-%';
delete from questions       where id::text like 'aa000000-%';
delete from confirmed_sales where id::text like 'f0000000-%';
delete from orders          where id::text like 'e0000000-%' or id::text like 'e1000000-%';
delete from listings        where id::text like 'd0000000-%' or id::text like 'd1000000-%' or id::text like 'd3000000-%';
delete from card_bases      where id::text like 'c0000000-%';
delete from seller_profiles where id::text like 'a0000000-%';
delete from profiles        where id::text like 'a0000000-%' or id::text like 'b0000000-%' or id::text like 'ad000000-%';
delete from auth.identities where user_id::text like 'a0000000-%' or user_id::text like 'b0000000-%' or user_id::text like 'ad000000-%';
delete from auth.users      where id::text      like 'a0000000-%' or id::text      like 'b0000000-%' or id::text      like 'ad000000-%';

-- Re-enable immutability trigger
alter table confirmed_sales enable trigger guard_confirmed_sales_delete;

-- =========================
-- 1. AUTH USERS
-- =========================
-- Creates entries in auth.users. The handle_new_user() trigger
-- auto-creates a row in profiles for each user.
-- Password for all seed users: Seed123!@#

-- 1.1 Admin
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user)
values
  ('00000000-0000-0000-0000-000000000000', 'ad000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin GradedBR"}', now(), now(), '', '', '', '', false);

-- 1.2 Sellers
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'seller1@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"CardMaster BR"}',       '2022-03-15', now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'seller2@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"PokéCollector SP"}',    '2022-08-20', now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'seller3@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"TCG Premium"}',         '2024-11-01', now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'seller4@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Graded Cards BR"}',     '2021-06-10', now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'seller5@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"PokéRaro"}',            '2023-02-14', now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'seller6@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"MasterGrade TCG"}',     '2024-12-01', now(), '', '', '', '', false);

-- 1.3 Buyers
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user)
values
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'buyer1@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"João M."}',      now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'buyer2@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pedro S."}',     now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'buyer3@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana L."}',       now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'buyer4@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lucas R."}',     now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'buyer5@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mariana F."}',   now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'buyer6@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos T."}',    now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'buyer7@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fernanda R."}',  now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'buyer8@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bruno M."}',     now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'buyer9@seed.gradedbr.com',  crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Camila T."}',    now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'buyer10@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rafael S."}',    now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'buyer11@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ricardo L."}',   now(), now(), '', '', '', '', false),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'buyer12@seed.gradedbr.com', crypt('Seed123!@#', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fernanda M."}',  now(), now(), '', '', '', '', false);

-- 1.4 Auth identities (required for login in Supabase v2+)
-- identity_data must include email_verified and phone_verified for GoTrue compatibility
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  -- Admin
  ('ad000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', jsonb_build_object('sub', 'ad000000-0000-0000-0000-000000000001', 'email', 'admin@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'ad000000-0000-0000-0000-000000000001', now(), now(), now()),
  -- Sellers
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'seller1@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'a0000000-0000-0000-0000-000000000001', now(), '2022-03-15', now()),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000002', 'email', 'seller2@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'a0000000-0000-0000-0000-000000000002', now(), '2022-08-20', now()),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000003', 'email', 'seller3@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'a0000000-0000-0000-0000-000000000003', now(), '2024-11-01', now()),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000004', 'email', 'seller4@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'a0000000-0000-0000-0000-000000000004', now(), '2021-06-10', now()),
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000005', 'email', 'seller5@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'a0000000-0000-0000-0000-000000000005', now(), '2023-02-14', now()),
  ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000006', 'email', 'seller6@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'a0000000-0000-0000-0000-000000000006', now(), '2024-12-01', now()),
  -- Buyers
  ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000001', 'email', 'buyer1@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000001', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000002', 'email', 'buyer2@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000002', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000003', 'email', 'buyer3@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000003', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000004', 'email', 'buyer4@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000004', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000005', 'email', 'buyer5@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000005', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000006', 'email', 'buyer6@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000006', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000007', 'email', 'buyer7@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000007', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000008', 'email', 'buyer8@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000008', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000009', 'email', 'buyer9@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false),  'email', 'b0000000-0000-0000-0000-000000000009', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000010', 'email', 'buyer10@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'b0000000-0000-0000-0000-000000000010', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000011', 'email', 'buyer11@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'b0000000-0000-0000-0000-000000000011', now(), now(), now()),
  ('b0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000012', jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000012', 'email', 'buyer12@seed.gradedbr.com', 'email_verified', true, 'phone_verified', false), 'email', 'b0000000-0000-0000-0000-000000000012', now(), now(), now());


-- =========================
-- 2. PROFILES — update roles for sellers
-- =========================
-- The handle_new_user() trigger already created profiles.
-- Now set seller role.

update profiles set role = 'admin'
where id = 'ad000000-0000-0000-0000-000000000001';

update profiles set role = 'seller'
where id in (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006'
);


-- =========================
-- 3. SELLER PROFILES
-- =========================
-- total_sales and rating will be overridden at the end after triggers fire.

insert into seller_profiles (id, store_name, description, verified, total_sales, rating, rating_count, created_at)
values
  ('a0000000-0000-0000-0000-000000000001', 'CardMaster BR',     'Especialista em cartas graduadas PSA e CGC. Envio seguro e rápido.',            true,  0, 0, 0, '2022-03-15'),
  ('a0000000-0000-0000-0000-000000000002', 'PokéCollector SP',  'Colecionador de São Paulo. Cartas modernas e vintage.',                         true,  0, 0, 0, '2022-08-20'),
  ('a0000000-0000-0000-0000-000000000003', 'TCG Premium',       'Novo no mercado, focado em cartas premium alt art.',                            false, 0, 0, 0, '2024-11-01'),
  ('a0000000-0000-0000-0000-000000000004', 'Graded Cards BR',   'Maior vendedor de cartas graduadas do Brasil. +400 vendas com excelência.',     true,  0, 0, 0, '2021-06-10'),
  ('a0000000-0000-0000-0000-000000000005', 'PokéRaro',          'Cartas raras e difíceis de encontrar. Atendimento personalizado.',              true,  0, 0, 0, '2023-02-14'),
  ('a0000000-0000-0000-0000-000000000006', 'MasterGrade TCG',   'Iniciante apaixonado por Pokémon TCG. Preços justos.',                         false, 0, 0, 0, '2024-12-01');


-- =========================
-- 4. CARD BASES
-- =========================

insert into card_bases (id, name, set_name, set_code, number, type, rarity, image_url, language_group)
values
  -- International (EN/PT)
  ('c0000000-0000-0000-0000-000000000001', 'Charizard VMAX',          'Darkness Ablaze',  'DAA',  '020/189', 'fire',     'VMAX',        '/cards/en/charizard-vmax-swsh3-20.png',   'INT'),
  ('c0000000-0000-0000-0000-000000000002', 'Pikachu VMAX Rainbow',   'Vivid Voltage',    'VV',   '188/185', 'electric', 'Secret Rare', '/cards/en/pikachu-vmax-swsh4-188.png',    'INT'),
  ('c0000000-0000-0000-0000-000000000003', 'Mew VMAX Alt Art',       'Fusion Strike',    'FST',  '268/264', 'psychic',  'Alt Art',     '/cards/en/mew-vmax-swsh8-268.png',        'INT'),
  ('c0000000-0000-0000-0000-000000000004', 'Umbreon VMAX Alt Art',   'Evolving Skies',   'EVS',  '215/203', 'dark',     'Alt Art',     '/cards/en/umbreon-vmax-swsh7-215.png',    'INT'),
  ('c0000000-0000-0000-0000-000000000005', 'Rayquaza VMAX Alt Art',  'Evolving Skies',   'EVS',  '218/203', 'dragon',   'Alt Art',     '/cards/en/rayquaza-vmax-swsh7-218.png',   'INT'),
  ('c0000000-0000-0000-0000-000000000006', 'Giratina VSTAR Alt Art', 'Lost Origin',      'LOR',  '131/196', 'ghost',    'Alt Art',     '/cards/en/giratina-vstar-swsh11-131.png', 'INT'),
  ('c0000000-0000-0000-0000-000000000007', 'Lugia VSTAR Alt Art',    'Silver Tempest',   'SIT',  '186/195', 'flying',   'Alt Art',     '/cards/en/lugia-vstar-swsh12-186.png',    'INT'),
  ('c0000000-0000-0000-0000-000000000008', 'Charizard ex SAR',       'Pokémon 151',      '151',  '199/165', 'fire',     'SAR',         '/cards/en/charizard-ex-sv3pt5-199.png',   'INT'),
  ('c0000000-0000-0000-0000-000000000009', 'Charizard Base Set',     'Base Set',         'BS',   '4/102',   'fire',     'Holo Rare',   '/cards/en/charizard-base-4.png',          'INT'),
  ('c0000000-0000-0000-0000-000000000010', 'Blastoise Base Set',     'Base Set',         'BS',   '2/102',   'water',    'Holo Rare',   '/cards/en/blastoise-base-2.png',          'INT'),
  ('c0000000-0000-0000-0000-000000000011', 'Venusaur Base Set',      'Base Set',         'BS',   '15/102',  'grass',    'Holo Rare',   '/cards/en/venusaur-base-15.png',          'INT'),
  ('c0000000-0000-0000-0000-000000000012', 'Gengar VMAX Alt Art',    'Fusion Strike',    'FST',  '271/264', 'ghost',    'Alt Art',     '/cards/en/gengar-vmax-swsh8-271.png',     'INT'),
  -- Japanese
  ('c0000000-0000-0000-0000-000000000101', 'Charizard VMAX',         'Starter Set VMAX Charizard', 'sA',   '002/021', 'fire',    'VMAX',    '/cards/en/charizard-vmax-swsh3-20.png',   'JP'),
  ('c0000000-0000-0000-0000-000000000103', 'Mew VMAX Alt Art',       'Fusion Arts',                's8',   '114/100', 'psychic', 'Alt Art', '/cards/jp/mew-vmax-s12a-054.png',         'JP'),
  ('c0000000-0000-0000-0000-000000000104', 'Umbreon VMAX Alt Art',   'Eevee Heroes',               's6a',  '095/069', 'dark',    'Alt Art', '/cards/en/umbreon-vmax-swsh7-215.png',    'JP'),
  ('c0000000-0000-0000-0000-000000000107', 'Lugia VSTAR Alt Art',    'Paradigm Trigger',            's12',  '118/098', 'flying',  'Alt Art', '/cards/jp/lugia-vstar-s12-118.png',       'JP'),
  ('c0000000-0000-0000-0000-000000000108', 'Charizard ex SAR',       'Pokémon Card 151',            'sv2a', '185/165', 'fire',    'SAR',     '/cards/jp/charizard-ex-sv2a-185.png',     'JP');


-- =========================
-- 5. ACTIVE LISTINGS (28)
-- =========================
-- These are visible in the marketplace. Prices in centavos.

insert into listings (id, seller_id, card_base_id, grade, grade_company, pristine, price, free_shipping, language, tags, images, status, created_at)
values
  -- cb1 — Charizard VMAX (4 listings)
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 10,  'PSA',     false, 285000,  false, 'PT', '{graduada}',              ARRAY['/cards/en/charizard-vmax-swsh3-20.png','/cards/en/charizard-vmax-swsh3-20.png'], 'active', '2024-12-01'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 9,   'PSA',     false, 180000,  true,  'EN', '{graduada}',              ARRAY['/cards/en/charizard-vmax-swsh3-20.png'],                                        'active', '2024-12-08'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 10,  'CGC',     true,  340000,  false, 'PT', '{graduada}',              '{}', 'active', '2024-12-10'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000101', 9,   'TAG',     false, 150000,  false, 'JP', '{graduada}',              '{}', 'active', '2024-12-12'),
  -- cb2 — Pikachu VMAX Rainbow (2)
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 10,  'PSA',     false, 120000,  false, 'EN', '{graduada}',              '{}', 'active', '2024-12-05'),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 9.5, 'Beckett', false, 105000,  true,  'PT', '{graduada}',              '{}', 'active', '2024-12-09'),
  -- cb3 — Mew VMAX Alt Art (2)
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000103', 9.5, 'Beckett', false, 350000,  true,  'JP', '{alt-art,graduada}',      '{}', 'active', '2024-11-28'),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 10,  'PSA',     false, 420000,  false, 'EN', '{alt-art,graduada}',      '{}', 'active', '2024-12-03'),
  -- cb4 — Umbreon VMAX Alt Art (5)
  ('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 9,   'PSA',     false, 890000,  false, 'PT', '{alt-art,graduada}',      '{}', 'active', '2024-11-15'),
  ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 10,  'PSA',     false, 1350000, true,  'EN', '{alt-art,graduada}',      ARRAY['/cards/en/umbreon-vmax-swsh7-215.png','/cards/en/umbreon-vmax-swsh7-215.png','/cards/en/umbreon-vmax-swsh7-215.png','/cards/en/umbreon-vmax-swsh7-215.png'], 'active', '2024-12-01'),
  ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 9,   'Beckett', false, 860000,  false, 'PT', '{alt-art,graduada}',      '{}', 'active', '2024-12-05'),
  ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000104', 10,  'CGC',     true,  1850000, true,  'JP', '{alt-art,graduada}',      '{}', 'active', '2024-12-08'),
  ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 8,   'TAG',     false, 620000,  false, 'PT', '{alt-art,graduada}',      '{}', 'active', '2024-12-10'),
  -- cb5 — Rayquaza VMAX Alt Art (2)
  ('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 9.5, 'CGC',     false, 420000,  false, 'EN', '{alt-art,graduada}',      '{}', 'active', '2024-12-10'),
  ('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 10,  'PSA',     false, 580000,  true,  'PT', '{alt-art,graduada}',      '{}', 'active', '2024-12-12'),
  -- cb6 — Giratina VSTAR Alt Art (2)
  ('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', 10,  'PSA',     false, 210000,  false, 'PT', '{alt-art,graduada}',      '{}', 'active', '2024-12-08'),
  ('d0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 9,   'PSA',     false, 165000,  false, 'EN', '{alt-art,graduada}',      '{}', 'active', '2024-12-11'),
  -- cb7 — Lugia VSTAR Alt Art (3)
  ('d0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000007', 10,  'PSA',     false, 560000,  true,  'EN', '{alt-art,graduada}',      '{}', 'active', '2024-11-20'),
  ('d0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000007', 9,   'Beckett', false, 410000,  false, 'PT', '{alt-art,graduada}',      '{}', 'active', '2024-12-02'),
  ('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000107', 9.5, 'CGC',     false, 480000,  false, 'JP', '{alt-art,graduada}',      '{}', 'active', '2024-12-06'),
  -- cb8 — Charizard ex SAR (2)
  ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000108', 10,  'PSA',     false, 320000,  false, 'JP', '{graduada}',              '{}', 'active', '2024-12-12'),
  ('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000008', 9,   'PSA',     false, 240000,  false, 'PT', '{graduada}',              '{}', 'active', '2024-12-14'),
  -- cb9 — Charizard Base Set (1)
  ('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000009', 8,   'PSA',     false, 1500000, true,  'EN', '{vintage,graduada}',      ARRAY['/cards/en/charizard-base-4.png','/cards/en/charizard-base-4.png','/cards/en/charizard-base-4.png'], 'active', '2024-12-02'),
  -- cb10 — Blastoise Base Set (2)
  ('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', 9,   'PSA',     false, 650000,  false, 'EN', '{vintage,graduada}',      '{}', 'active', '2024-11-25'),
  ('d0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000010', 7,   'Beckett', false, 320000,  false, 'EN', '{vintage,graduada}',      '{}', 'active', '2024-12-04'),
  -- cb11 — Venusaur Base Set (1)
  ('d0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011', 7,   'Beckett', false, 380000,  false, 'EN', '{vintage,graduada}',      '{}', 'active', '2024-12-03'),
  -- cb12 — Gengar VMAX Alt Art (2)
  ('d0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000012', 10,  'PSA',     false, 480000,  true,  'EN', '{alt-art,graduada}',      '{}', 'active', '2024-11-10'),
  ('d0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000012', 9,   'CGC',     false, 320000,  false, 'PT', '{alt-art,graduada}',      '{}', 'active', '2024-12-05');


-- =========================
-- 6. SOLD LISTINGS (for historical sales + mock orders)
-- =========================
-- Each completed sale or active order needs its own listing.
-- "sold" status = order completed. "reserved" = order in progress.

insert into listings (id, seller_id, card_base_id, grade, grade_company, pristine, price, free_shipping, language, tags, images, status, created_at)
values
  -- Historical sales from salesHistory (11 records)
  -- cb1 sales
  ('d1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 10,  'PSA', false, 270000,  false, 'PT', '{graduada}', '{}', 'sold', '2024-11-10'),
  ('d1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 10,  'PSA', false, 265000,  false, 'PT', '{graduada}', '{}', 'sold', '2024-10-15'),
  ('d1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 9,   'PSA', false, 250000,  false, 'EN', '{graduada}', '{}', 'sold', '2024-09-05'),
  ('d1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 10,  'PSA', false, 280000,  false, 'EN', '{graduada}', '{}', 'sold', '2024-08-01'),
  ('d1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 9,   'PSA', false, 180000,  false, 'PT', '{graduada}', '{}', 'sold', '2024-07-10'),
  -- cb4 sales
  ('d1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 10,  'CGC', true,  1780000, false, 'PT', '{alt-art,graduada}', '{}', 'sold', '2024-12-01'),
  ('d1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 9,   'PSA', false, 850000,  false, 'PT', '{alt-art,graduada}', '{}', 'sold', '2024-10-25'),
  ('d1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 9,   'PSA', false, 820000,  false, 'EN', '{alt-art,graduada}', '{}', 'sold', '2024-09-10'),
  ('d1000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 10,  'PSA', false, 910000,  false, 'PT', '{alt-art,graduada}', '{}', 'sold', '2024-08-15'),
  -- cb8 sales
  ('d1000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000008', 10,  'PSA', false, 290000,  false, 'PT', '{graduada}', '{}', 'sold', '2024-11-05'),
  -- cb8-jp sales
  ('d1000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000108', 10,  'PSA', false, 310000,  false, 'JP', '{graduada}', '{}', 'sold', '2024-11-25'),

  -- Extra sold listings for reviews that need their own orders
  ('d1000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 10,  'PSA', false, 110000,  false, 'PT', '{graduada}', '{}', 'sold', '2024-10-10'),
  ('d1000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', 9,   'PSA', false, 180000,  false, 'EN', '{graduada}', '{}', 'sold', '2024-11-20'),
  ('d1000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 9,   'PSA', false, 400000,  false, 'PT', '{graduada}', '{}', 'sold', '2024-10-01'),

  -- Listings for mock active orders (o1-o5)
  ('d3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 10,  'PSA', false, 270000,  false, 'PT', '{graduada}', '{}', 'sold',     '2024-11-10'),
  ('d3000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 10,  'PSA', false, 120000,  false, 'EN', '{graduada}', '{}', 'sold',     '2024-11-28'),
  ('d3000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 9,   'PSA', false, 890000,  false, 'PT', '{graduada}', '{}', 'reserved', '2024-12-05'),
  ('d3000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', 10,  'PSA', false, 210000,  false, 'PT', '{graduada}', '{}', 'reserved', '2024-12-12'),
  ('d3000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 9.5, 'CGC', false, 420000,  false, 'EN', '{graduada}', '{}', 'reserved', '2024-11-20');


-- =========================
-- 7. COMPLETED ORDERS (for historical sales)
-- =========================
-- commission_rate = 10%, platform_fee = price * 0.10, seller_payout = price * 0.90

insert into orders (id, listing_id, buyer_id, seller_id, status, price, shipping_cost, platform_fee, seller_payout, paid_at, shipped_at, delivered_at, completed_at, created_at)
values
  -- cb1 historical sales
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'completed', 270000,  0, 27000,  243000,  '2024-11-11', '2024-11-12', '2024-11-14', '2024-11-15', '2024-11-10'),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'completed', 265000,  0, 26500,  238500,  '2024-10-17', '2024-10-18', '2024-10-21', '2024-10-22', '2024-10-15'),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'completed', 250000,  0, 25000,  225000,  '2024-09-06', '2024-09-07', '2024-09-09', '2024-09-10', '2024-09-05'),
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'completed', 280000,  0, 28000,  252000,  '2024-08-02', '2024-08-03', '2024-08-04', '2024-08-05', '2024-08-01'),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'completed', 180000,  0, 18000,  162000,  '2024-07-13', '2024-07-14', '2024-07-17', '2024-07-18', '2024-07-10'),
  -- cb4 historical sales
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004', 'completed', 1780000, 0, 178000, 1602000, '2024-12-02', '2024-12-03', '2024-12-04', '2024-12-05', '2024-12-01'),
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'completed', 850000,  0, 85000,  765000,  '2024-10-27', '2024-10-28', '2024-10-31', '2024-11-01', '2024-10-25'),
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'completed', 820000,  0, 82000,  738000,  '2024-09-11', '2024-09-12', '2024-09-14', '2024-09-15', '2024-09-10'),
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'completed', 910000,  0, 91000,  819000,  '2024-08-16', '2024-08-17', '2024-08-19', '2024-08-20', '2024-08-15'),
  -- cb8 historical sales
  ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 'completed', 290000,  0, 29000,  261000,  '2024-11-06', '2024-11-07', '2024-11-09', '2024-11-10', '2024-11-05'),
  -- cb8-jp historical sales
  ('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'completed', 310000,  0, 31000,  279000,  '2024-11-26', '2024-11-27', '2024-11-30', '2024-12-01', '2024-11-25'),

  -- Extra completed orders for reviews
  ('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'completed', 110000,  0, 11000,  99000,   '2024-10-11', '2024-10-12', '2024-10-14', '2024-10-15', '2024-10-10'),
  ('e1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'completed', 180000,  0, 18000,  162000,  '2024-11-21', '2024-11-22', '2024-11-24', '2024-11-25', '2024-11-20'),
  ('e1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'completed', 400000,  0, 40000,  360000,  '2024-10-03', '2024-10-04', '2024-10-07', '2024-10-08', '2024-10-01');


-- =========================
-- 8. ACTIVE ORDERS (from mock — o1 through o5)
-- =========================

insert into orders (id, listing_id, buyer_id, seller_id, status, price, shipping_cost, platform_fee, seller_payout, paid_at, shipped_at, delivered_at, created_at)
values
  -- o1: entregue → delivered
  ('e0000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'delivered',         270000, 0, 27000, 243000, '2024-11-11', '2024-11-12', '2024-11-14', '2024-11-15'),
  -- o2: enviado → shipped
  ('e0000000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'shipped',           120000, 0, 12000, 108000, '2024-12-02', '2024-12-03', null,         '2024-12-01'),
  -- o3: pago → payment_confirmed
  ('e0000000-0000-0000-0000-000000000003', 'd3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'payment_confirmed', 890000, 0, 89000, 801000, '2024-12-10', null,         null,         '2024-12-10'),
  -- o4: aguardando_pagamento → awaiting_payment
  ('e0000000-0000-0000-0000-000000000004', 'd3000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'awaiting_payment',  210000, 0, 21000, 189000, null,         null,         null,         '2024-12-15'),
  -- o5: disputa → disputed
  ('e0000000-0000-0000-0000-000000000005', 'd3000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'disputed',          420000, 0, 42000, 378000, '2024-11-22', '2024-11-23', null,         '2024-11-28');


-- =========================
-- 9. CONFIRMED SALES
-- =========================
-- Immutable records for price history. Trigger increments seller total_sales.

insert into confirmed_sales (id, card_base_id, order_id, buyer_id, seller_id, grade, grade_company, pristine, language, sale_price, sold_at)
values
  -- cb1 — Charizard VMAX
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 10, 'PSA', false, 'PT', 270000,  '2024-11-15'),
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 10, 'PSA', false, 'PT', 265000,  '2024-10-22'),
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 9,  'PSA', false, 'EN', 250000,  '2024-09-10'),
  ('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 10, 'PSA', false, 'EN', 280000,  '2024-08-05'),
  ('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 9,  'PSA', false, 'PT', 180000,  '2024-07-18'),
  -- cb4 — Umbreon VMAX Alt Art
  ('f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000004', 10, 'CGC', true,  'PT', 1780000, '2024-12-05'),
  ('f0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 9,  'PSA', false, 'PT', 850000,  '2024-11-01'),
  ('f0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 9,  'PSA', false, 'EN', 820000,  '2024-09-15'),
  ('f0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 10, 'PSA', false, 'PT', 910000,  '2024-08-20'),
  -- cb8 — Charizard ex SAR
  ('f0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 10, 'PSA', false, 'PT', 290000,  '2024-11-10'),
  -- cb8-jp — Charizard ex SAR (JP)
  ('f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000108', 'e1000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 10, 'PSA', false, 'JP', 310000,  '2024-12-01'),
  -- Extra confirmed sales for review orders
  ('f0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 10, 'PSA', false, 'PT', 110000,  '2024-10-15'),
  ('f0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 9,  'PSA', false, 'EN', 180000,  '2024-11-25'),
  ('f0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 9,  'PSA', false, 'PT', 400000,  '2024-10-08');


-- =========================
-- 10. QUESTIONS
-- =========================

insert into questions (id, listing_id, user_id, question, answer, answered_at, created_at)
values
  ('aa000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'A carta tem algum defeito visível no case?',                        'Não, o case está em perfeito estado, sem riscos ou marcas.',                                             '2024-12-05', '2024-12-05'),
  ('aa000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Aceita troca por outra PSA 10?',                                     'No momento estou aceitando apenas venda direta.',                                                        '2024-12-09', '2024-12-08'),
  ('aa000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Qual o prazo de envio após o pagamento?',                            null,                                                                                                     null,         '2024-12-12'),
  ('aa000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000006', 'Essa é a versão alt art com o Umbreon no fundo noturno?',            'Sim, é a versão alt art 215/203, considerada uma das mais bonitas do set.',                              '2024-11-20', '2024-11-20'),
  ('aa000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000012', 'O subgrade de centralização está acima de 8?',                       'Sim, o subgrade de centering é 8.5.',                                                                    '2024-12-02', '2024-12-01');


-- =========================
-- 11. REVIEWS
-- =========================
-- Trigger recalculate_seller_rating fires after each insert.

insert into reviews (id, order_id, seller_id, buyer_id, rating, comment, created_at)
values
  ('bb000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 5, 'Carta chegou em perfeito estado, embalagem impecável! Super recomendo.',          '2024-11-20'),
  ('bb000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 5, 'Vendedor super atencioso, envio rápido. Voltarei a comprar!',                     '2024-10-15'),
  ('bb000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 4, 'Carta conforme anunciado, mas demorou um pouco para enviar.',                     '2024-11-25'),
  ('bb000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 5, 'Excelente experiência! Carta linda e envio super cuidadoso.',                     '2024-12-01'),
  ('bb000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000008', 5, 'Melhor vendedor de cartas graduadas do Brasil. Sério mesmo.',                     '2024-10-08');


-- =========================
-- 12. FINAL OVERRIDES — fix seller stats to match mock values
-- =========================
-- The triggers set total_sales and rating based on seed data only.
-- Override to match the mock values representing full history.

update seller_profiles set total_sales = 287, rating = 4.90, rating_count = 95  where id = 'a0000000-0000-0000-0000-000000000001'; -- CardMaster BR
update seller_profiles set total_sales = 156, rating = 4.70, rating_count = 52  where id = 'a0000000-0000-0000-0000-000000000002'; -- PokéCollector SP
update seller_profiles set total_sales = 12,  rating = 5.00, rating_count = 5   where id = 'a0000000-0000-0000-0000-000000000003'; -- TCG Premium
update seller_profiles set total_sales = 421, rating = 4.80, rating_count = 140 where id = 'a0000000-0000-0000-0000-000000000004'; -- Graded Cards BR
update seller_profiles set total_sales = 89,  rating = 4.60, rating_count = 30  where id = 'a0000000-0000-0000-0000-000000000005'; -- PokéRaro
update seller_profiles set total_sales = 7,   rating = 4.50, rating_count = 3   where id = 'a0000000-0000-0000-0000-000000000006'; -- MasterGrade TCG


commit;

-- ============================================================
-- DONE! Verify with:
--   select count(*) from card_bases;          -- 17
--   select count(*) from listings;            -- 47 (28 active + 19 sold/reserved)
--   select count(*) from orders;              -- 19 (5 active + 14 completed)
--   select count(*) from confirmed_sales;     -- 14
--   select count(*) from questions;           -- 5
--   select count(*) from reviews;             -- 5
--   select count(*) from profiles;            -- 19 (1 admin + 6 sellers + 12 buyers)
--   select count(*) from seller_profiles;     -- 6
-- ============================================================
