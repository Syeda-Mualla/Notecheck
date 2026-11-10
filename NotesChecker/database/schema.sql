-- Run once in Supabase SQL Editor. Server-owned data; no direct browser table access.
create table if not exists public.course_profiles (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 profile_key text not null check(profile_key in ('alex','maya','jordan','ahmad','wiremu','derek')),
 pin_hash text not null,
 data jsonb not null default '{}'::jsonb,
 revision integer not null default 0,
 updated_at timestamptz not null default now(),
 failed_attempts integer not null default 0,
 locked_until timestamptz,
 unique(owner_id,profile_key)
);
alter table public.course_profiles enable row level security;
revoke all on public.course_profiles from anon, authenticated;
grant all on public.course_profiles to service_role;
-- No public policies: only authenticated server routes with explicit owner filters access rows.
