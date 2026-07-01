-- ════════════════════════════════════════════════════════════════════════
--  MoneyBox · Supabase schema
--  Run this entire file in the Supabase SQL Editor (Project → SQL → New query).
--  It creates every table, enables Row Level Security, and wires up the
--  trigger that gives each new auth user a financial profile.
-- ════════════════════════════════════════════════════════════════════════

-- ── Helper: keep updated_at fresh ───────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1. PROFILES  ·  one row per user. Holds salary + current cash balance.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  salary       numeric(14,2) not null default 0,   -- fixed monthly income
  salary_day   int           not null default 5,   -- day salary lands (≈5th)
  balance      numeric(14,2) not null default 0,   -- "saldo": cash on hand
  currency     text          not null default 'BRL',
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- 2. INVOICES  ·  "faturas". One open invoice per month aggregates every
--    credit-card charge. Carries interest forward when not paid in full.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  reference_month date not null,                       -- always day 01 of month
  total_amount    numeric(14,2) not null default 0,    -- charges this cycle
  carried_amount  numeric(14,2) not null default 0,    -- debt rolled in from past
  paid_amount     numeric(14,2) not null default 0,
  interest_rate   numeric(6,4)  not null default 0.12, -- monthly % if not paid
  status          text not null default 'open'
                  check (status in ('open','paid','finalized')),
  due_day         int  not null default 5,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, reference_month)
);
create trigger trg_invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 3. MOVEMENTS  ·  "movimentações". Income or expense, paid in cash or credit.
--    A credit expense is linked to the month's invoice.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.movements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('income','expense')),
  method      text not null default 'cash'
              check (method in ('cash','credit')),
  amount      numeric(14,2) not null check (amount > 0),
  category    text,
  description text,
  invoice_id  uuid references public.invoices(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- 4. FIXED BILLS  ·  "contas fixas" (e.g. gym). No end date.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.fixed_bills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  amount     numeric(14,2) not null check (amount > 0),
  due_day    int not null default 10,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- track which months a fixed bill was already paid (avoid double charge)
create table if not exists public.fixed_bill_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  fixed_bill_id   uuid not null references public.fixed_bills(id) on delete cascade,
  reference_month date not null,
  paid_via        text not null default 'cash' check (paid_via in ('cash','credit')),
  paid_at         timestamptz not null default now(),
  unique (fixed_bill_id, reference_month)
);

-- ════════════════════════════════════════════════════════════════════════
-- 5. INSTALLMENTS  ·  "parcelas". Finite: paid_count advances to total_count.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.installments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  installment_amount numeric(14,2) not null check (installment_amount > 0),
  total_count       int not null check (total_count > 0),
  paid_count        int not null default 0,
  due_day           int not null default 10,
  start_date        date not null default current_date,
  created_at        timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- 6. GOALS  ·  "metas" — the Nubank-style boxes (caixinhas).
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  target_amount  numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0,
  color          text not null default 'currency',
  deadline       date,
  created_at     timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- 7. MONTHLY SNAPSHOTS  ·  feeds the balance / salary charts on the dashboard.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.monthly_snapshots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  reference_month date not null,
  balance_end     numeric(14,2) not null default 0,
  salary          numeric(14,2) not null default 0,
  invoice_total   numeric(14,2) not null default 0,
  cumulative_salary numeric(14,2) not null default 0,
  created_at      timestamptz not null default now(),
  unique (user_id, reference_month)
);

-- ════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY  ·  every table: a user only ever touches their rows.
-- ════════════════════════════════════════════════════════════════════════
alter table public.profiles            enable row level security;
alter table public.invoices            enable row level security;
alter table public.movements           enable row level security;
alter table public.fixed_bills         enable row level security;
alter table public.fixed_bill_payments enable row level security;
alter table public.installments        enable row level security;
alter table public.goals               enable row level security;
alter table public.monthly_snapshots   enable row level security;

-- profiles: id IS the user id
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile write"  on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- generic owner policies for the user_id tables
do $$
declare t text;
begin
  foreach t in array array[
    'invoices','movements','fixed_bills','fixed_bill_payments',
    'installments','goals','monthly_snapshots'
  ] loop
    execute format($f$
      create policy "owner all %1$s" on public.%1$s
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════════
--  AUTO-PROFILE  ·  create a profile the moment a user signs up.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════
--  GET-OR-CREATE the open invoice for a given month (used by the app).
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.get_or_create_invoice(p_month date)
returns public.invoices language plpgsql security definer set search_path = public as $$
declare inv public.invoices;
begin
  select * into inv from public.invoices
   where user_id = auth.uid() and reference_month = date_trunc('month', p_month)::date;
  if not found then
    insert into public.invoices (user_id, reference_month)
    values (auth.uid(), date_trunc('month', p_month)::date)
    returning * into inv;
  end if;
  return inv;
end; $$;

grant execute on function public.get_or_create_invoice(date) to authenticated;
