-- Placement Survival Kit — initial schema
-- Run once in Supabase → SQL Editor. All timestamps are timestamptz (stored UTC, shown in IST).

-- ─── Enums ───────────────────────────────────────────────────────────────
create type public.company_status as enum
  ('applied', 'shortlisted', 'test', 'interview', 'offer', 'rejected', 'ghosted');
create type public.event_type as enum
  ('ppt', 'test', 'gd', 'interview', 'deadline', 'other');
create type public.checkin_mood as enum
  ('nailed', 'survived', 'dont_ask');

-- ─── Shared trigger: updated_at ─────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── settings (one row per user) ────────────────────────────────────────
create table public.settings (
  user_id          uuid primary key default auth.uid() references auth.users on delete cascade,
  push_enabled     boolean not null default true,
  quiet_start      time,
  quiet_end        time,
  ghost_after_days int  not null default 14 check (ghost_after_days between 1 and 365),
  samosas_per_ppt  int  not null default 2  check (samosas_per_ppt between 0 and 50),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ─── companies ──────────────────────────────────────────────────────────
create table public.companies (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null default auth.uid() references auth.users on delete cascade,
  name                        text not null check (length(trim(name)) > 0),
  nickname                    text,
  emoji                       text,
  role                        text,
  ctc_lpa                     numeric(6,2) check (ctc_lpa >= 0),
  cgpa_cutoff                 numeric(4,2) check (cgpa_cutoff between 0 and 10),
  location                    text,
  notes                       text,
  status                      public.company_status not null default 'applied',
  status_changed_at           timestamptz not null default now(),
  last_contact_at             timestamptz not null default now(),
  ghost_suggest_snoozed_until timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index companies_user_idx on public.companies (user_id, status);

create table public.company_status_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  company_id  uuid not null references public.companies on delete cascade,
  from_status public.company_status,
  to_status   public.company_status not null,
  changed_at  timestamptz not null default now()
);
create index status_history_company_idx on public.company_status_history (company_id, changed_at);
create index status_history_user_idx on public.company_status_history (user_id, changed_at);

create or replace function public.companies_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    new.status_changed_at := now();
    new.last_contact_at := now();
  end if;
  return new;
end $$;
create trigger companies_before_update before update on public.companies
  for each row execute function public.companies_before_update();

-- security definer: the app can't write history directly (read-only policy), the trigger can.
create or replace function public.companies_log_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.company_status_history (user_id, company_id, from_status, to_status, changed_at)
    values (new.user_id, new.id, null, new.status, new.status_changed_at);
  elsif new.status is distinct from old.status then
    insert into public.company_status_history (user_id, company_id, from_status, to_status, changed_at)
    values (new.user_id, new.id, old.status, new.status, new.status_changed_at);
  end if;
  return null;
end $$;
create trigger companies_log_status after insert or update of status on public.companies
  for each row execute function public.companies_log_status();

-- ─── events ─────────────────────────────────────────────────────────────
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  company_id       uuid not null references public.companies on delete cascade,
  type             public.event_type not null,
  title            text not null check (length(trim(title)) > 0),
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  venue            text,
  link             text,
  notes            text,
  reschedule_count int not null default 0,
  link_added_at    timestamptz,
  mood             public.checkin_mood,
  checked_in_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at >= starts_at)
);
create index events_user_start_idx on public.events (user_id, starts_at);
create index events_company_idx on public.events (company_id);

-- Records the raw facts that company nicknames are computed from.
create or replace function public.events_before_write()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(trim(new.link), '') <> '' then new.link_added_at := now(); end if;
    return new;
  end if;
  new.updated_at := now();
  if new.starts_at is distinct from old.starts_at then
    new.reschedule_count := old.reschedule_count + 1;
  end if;
  if coalesce(trim(old.link), '') = '' and coalesce(trim(new.link), '') <> '' then
    new.link_added_at := now();
  end if;
  if new.mood is distinct from old.mood and new.mood is not null then
    new.checked_in_at := now();
  end if;
  return new;
end $$;
create trigger events_before_write before insert or update on public.events
  for each row execute function public.events_before_write();

-- A new event counts as "contact" from the company.
create or replace function public.events_bump_contact()
returns trigger language plpgsql as $$
begin
  update public.companies set last_contact_at = now() where id = new.company_id;
  return null;
end $$;
create trigger events_bump_contact after insert on public.events
  for each row execute function public.events_bump_contact();

-- ─── ppt_ratings ────────────────────────────────────────────────────────
create table public.ppt_ratings (
  event_id       uuid primary key references public.events on delete cascade,
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  snacks_rating  smallint check (snacks_rating between 1 and 5),   -- 🥟
  length_rating  smallint check (length_rating between 1 and 5),   -- 🥱
  could_be_email boolean,
  ran_over       boolean,
  created_at     timestamptz not null default now()
);

-- ─── formals_log ────────────────────────────────────────────────────────
create table public.formals_log (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  day        date not null,            -- IST calendar date
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ─── badges_earned ──────────────────────────────────────────────────────
create table public.badges_earned (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  badge_key  text not null,
  company_id uuid references public.companies on delete set null,
  earned_at  timestamptz not null default now(),
  unique (user_id, badge_key)
);

-- ─── push_subscriptions ─────────────────────────────────────────────────
create table public.push_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint        text not null unique,
  p256dh          text not null,
  auth            text not null,
  device_label    text,
  created_at      timestamptz not null default now(),
  last_success_at timestamptz,
  fail_count      int not null default 0
);

-- ─── notifications_sent (idempotency ledger) ────────────────────────────
create table public.notifications_sent (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  kind            text not null check (kind in ('digest', 'headsup', 'nag', 'checkin', 'test')),
  event_id        uuid references public.events on delete cascade,
  dedupe_key      text not null unique,
  title           text,
  body            text,
  url             text,
  ack_token       uuid not null default gen_random_uuid(),
  acknowledged_at timestamptz,
  sent_at         timestamptz not null default now(),
  delivered       int not null default 0,
  error           text
);
create index notifications_event_idx on public.notifications_sent (event_id);
create index notifications_user_idx on public.notifications_sent (user_id, sent_at desc);

-- ─── Row Level Security: every row belongs to its owner ─────────────────
alter table public.settings               enable row level security;
alter table public.companies              enable row level security;
alter table public.company_status_history enable row level security;
alter table public.events                 enable row level security;
alter table public.ppt_ratings            enable row level security;
alter table public.formals_log            enable row level security;
alter table public.badges_earned          enable row level security;
alter table public.push_subscriptions     enable row level security;
alter table public.notifications_sent     enable row level security;

create policy "own rows" on public.settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.companies
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- History is written by trigger only; the app just reads it.
create policy "read own" on public.company_status_history
  for select to authenticated using (user_id = (select auth.uid()));

-- Events may only point at your own companies.
create policy "own rows" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.companies c where c.id = company_id and c.user_id = (select auth.uid()))
  );

create policy "own rows" on public.ppt_ratings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.events e where e.id = event_id and e.user_id = (select auth.uid()))
  );

create policy "own rows" on public.formals_log
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.badges_earned
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own rows" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Notifications are written by the server (service role). The app can read
-- them and mark one acknowledged.
create policy "read own" on public.notifications_sent
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ack own" on public.notifications_sent
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.notifications_sent from authenticated;
grant update (acknowledged_at) on public.notifications_sent to authenticated;

-- The browser never needs the anonymous role to touch these tables.
revoke all on all tables in schema public from anon;

-- ─── New user → settings row ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- In case you already logged in before running this file.
insert into public.settings (user_id) select id from auth.users on conflict do nothing;
