-- Run in Supabase SQL Editor before deploying Update 10.
-- Preserves all existing rows, notes, owner isolation, and access policies.
begin;
alter table public.course_profiles drop constraint if exists course_profiles_profile_key_check;
alter table public.course_profiles add constraint course_profiles_profile_key_check
 check (profile_key in ('alex','maya','jordan','ahmad','wiremu','derek'));
commit;
