-- Private paid-athlete roster. Apply in the owner-controlled Supabase project
-- AFTER reviewing existing fs-register data and BEFORE switching the public form.
-- This migration never exposes athlete or guardian records to anonymous site visitors.

create table if not exists public.fsa_roster_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

create or replace function public.fsa_is_roster_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.fsa_roster_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.fsa_is_roster_admin() from public;
grant execute on function public.fsa_is_roster_admin() to authenticated, service_role;

create table if not exists public.fsa_athlete_roster (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique,
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  guardian_name text not null check (char_length(guardian_name) between 1 and 100),
  guardian_email text not null check (char_length(guardian_email) between 3 and 150),
  guardian_phone text not null check (char_length(guardian_phone) between 1 and 40),
  program text not null,
  season integer not null default 2027,
  total_due_cents integer not null default 27500 check (total_due_cents >= 0),
  consent_recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists fsa_athlete_roster_season_created_idx
 on public.fsa_athlete_roster (season, created_at desc);

create table if not exists public.fsa_roster_payments (
  checkout_session_id text primary key,
  registration_id uuid references public.fsa_athlete_roster(id) on delete set null,
  stripe_payment_intent_id text,
  stripe_payment_link_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  amount_refunded_cents integer not null default 0 check (amount_refunded_cents >= 0),
  payment_status text not null check (payment_status in ('paid','partially_refunded','refunded')),
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  stripe_event_id text not null
);

create index if not exists fsa_roster_payments_registration_idx
 on public.fsa_roster_payments (registration_id);
create index if not exists fsa_roster_payments_intent_idx
 on public.fsa_roster_payments (stripe_payment_intent_id);

alter table public.fsa_roster_admins enable row level security;
alter table public.fsa_athlete_roster enable row level security;
alter table public.fsa_roster_payments enable row level security;

revoke all on public.fsa_roster_admins from anon, authenticated;
revoke all on public.fsa_athlete_roster from anon, authenticated;
revoke all on public.fsa_roster_payments from anon, authenticated;
grant select on public.fsa_roster_admins to authenticated;
grant select on public.fsa_athlete_roster to authenticated;
grant select on public.fsa_roster_payments to authenticated;

drop policy if exists "Staff can see own admin approval" on public.fsa_roster_admins;
create policy "Staff can see own admin approval" on public.fsa_roster_admins
 for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Approved staff can read athlete roster" on public.fsa_athlete_roster;
create policy "Approved staff can read athlete roster" on public.fsa_athlete_roster
 for select to authenticated using ((select public.fsa_is_roster_admin()));

drop policy if exists "Approved staff can read paid sessions" on public.fsa_roster_payments;
create policy "Approved staff can read paid sessions" on public.fsa_roster_payments
 for select to authenticated using ((select public.fsa_is_roster_admin()));

-- Admin provisioning intentionally is NOT public or self-service.
-- Create/verify a staff account in Supabase Auth, then (as database owner):
-- insert into public.fsa_roster_admins (user_id)
-- select id from auth.users where email = 'YOUR_APPROVED_ADMIN_EMAIL'
-- on conflict (user_id) do nothing;
-- Never paste real athlete data, secrets, or passwords into this SQL file.
