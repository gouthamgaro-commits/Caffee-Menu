-- Applied to the Supabase project "quan-menu" (qnoxxirebbkiqtqpurvh) on 2026-11-24.
-- One document table for all restaurant data, a staff list, and a private setup secret.
-- Guests (anon) may read the menu/settings and live orders, and add or update orders,
-- waiter calls, payments and game scores, and add feedback. Only staff (emails in
-- restaurant_staff, signed in) can read sales, activity and feedback, change settings
-- or the menu, or delete anything.

create table public.restaurant_docs (
  coll text not null check (coll in ('orders','tables','payments','scores','config','photos','history','events','feedback')),
  id text not null check (char_length(id) between 1 and 120),
  data jsonb not null check (pg_column_size(data) < 32000),
  updated_at timestamptz not null default now(),
  primary key (coll, id)
);
alter table public.restaurant_docs enable row level security;

create table public.restaurant_staff (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);
alter table public.restaurant_staff enable row level security;

create table public.restaurant_secrets (name text primary key, value text not null);
alter table public.restaurant_secrets enable row level security;

create or replace function public.restaurant_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.restaurant_staff s where s.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.restaurant_claim_owner(setup_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or em = '' then return false; end if;
  if exists (select 1 from public.restaurant_staff) then return public.restaurant_is_staff(); end if;
  if not exists (select 1 from public.restaurant_secrets where name = 'setup_code' and value = setup_code) then return false; end if;
  insert into public.restaurant_staff(email) values (em);
  delete from public.restaurant_secrets where name = 'setup_code';
  return true;
end $$;

revoke all on function public.restaurant_claim_owner(text) from public, anon;
grant execute on function public.restaurant_claim_owner(text) to authenticated;
revoke all on function public.restaurant_is_staff() from public;
grant execute on function public.restaurant_is_staff() to anon, authenticated;

create or replace function public.restaurant_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger restaurant_docs_touch before update on public.restaurant_docs for each row execute function public.restaurant_touch();

create policy "read public collections or staff" on public.restaurant_docs for select to anon, authenticated
  using (coll in ('orders','tables','payments','scores','config','photos') or public.restaurant_is_staff());
create policy "guests add orders, calls, payments, scores, feedback" on public.restaurant_docs for insert to anon, authenticated
  with check (coll in ('orders','tables','payments','scores','feedback') or public.restaurant_is_staff());
create policy "guests update orders, calls, payments, scores" on public.restaurant_docs for update to anon, authenticated
  using (coll in ('orders','tables','payments','scores') or public.restaurant_is_staff())
  with check (coll in ('orders','tables','payments','scores') or public.restaurant_is_staff());
create policy "only staff delete" on public.restaurant_docs for delete to authenticated
  using (public.restaurant_is_staff());

create policy "staff read staff list" on public.restaurant_staff for select to authenticated using (public.restaurant_is_staff());
create policy "staff add staff" on public.restaurant_staff for insert to authenticated with check (public.restaurant_is_staff());
create policy "staff remove staff" on public.restaurant_staff for delete to authenticated using (public.restaurant_is_staff());

create index restaurant_docs_coll_idx on public.restaurant_docs (coll);
alter publication supabase_realtime add table public.restaurant_docs;

-- The one-time owner setup code is inserted separately (not stored in git):
-- insert into public.restaurant_secrets(name, value) values ('setup_code', '<code>');
