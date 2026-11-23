-- CCL ADMIN / VENDOR ACCOUNT MIGRATION
-- Run in Supabase SQL Editor after the base CCL POS setup.
-- Username sign-in convention: username@login.ccl.local
-- Never put the service_role key in the browser.
alter table public.ccl_profiles
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists point_label text,
  add column if not exists phone text;
create unique index if not exists ccl_profiles_username_unique
  on public.ccl_profiles (lower(username))
  where username is not null;

-- Enforce the separation in the database too: only seller/cashier may open a POS shift.
drop policy if exists ccl_session_open on public.ccl_pos_sessions;
create policy ccl_session_open on public.ccl_pos_sessions
for insert to authenticated
with check (
  company_id = public.ccl_my_company_id()
  and opened_by = auth.uid()
  and status = 'open'
  and exists (
    select 1 from public.ccl_profiles p
    where p.id = auth.uid()
      and p.company_id = public.ccl_pos_sessions.company_id
      and p.is_active = true
      and p.role in ('seller','cashier')
  )
);

-- Close any open sessions belonging to accounts that are not POS sellers/cashiers.
update public.ccl_pos_sessions s
set status = 'closed', closed_at = now()
where s.status = 'open'
  and not exists (
    select 1 from public.ccl_profiles p
    where p.id = s.opened_by
      and p.company_id = s.company_id
      and p.is_active = true
      and p.role in ('seller','cashier')
  );

-- The POS ticket RPC checks that the session belongs to auth.uid().
-- Since only seller/cashier profiles can open a session under the policy above,
-- administrator accounts cannot create a valid sales session.
