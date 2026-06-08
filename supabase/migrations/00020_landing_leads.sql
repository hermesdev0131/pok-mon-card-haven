-- ============================================
-- Pre-launch landing page leads.
--
-- Captures sign-ups from the temporary landing site at graduada.com.br while
-- the marketplace itself is kept private until the official launch. Public
-- visitors submit name/email/phone via a form on the static HTML page, which
-- POSTs directly to PostgREST using the anon key. Reads are blocked at the
-- RLS layer; leads are reviewed through the Supabase dashboard (which uses
-- proper admin auth) instead of an in-page admin panel.
-- ============================================

create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  email          text not null,
  telefone       text,
  consentimento  boolean not null default false,
  criado_em      timestamptz not null default now()
);

create index if not exists idx_leads_criado_em on leads(criado_em desc);
create index if not exists idx_leads_email on leads(email);

alter table leads enable row level security;

-- Anonymous visitors can submit a lead (the only thing the landing page needs
-- to do). No SELECT/UPDATE/DELETE policy is granted, so the table is read-only
-- via the Supabase dashboard / service role.
create policy "Anyone can submit a lead"
  on leads for insert
  to anon
  with check (
    nome is not null and length(nome) > 0
    and email is not null and length(email) > 0
    and consentimento = true
  );
