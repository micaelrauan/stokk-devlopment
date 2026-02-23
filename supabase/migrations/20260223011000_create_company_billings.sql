create table if not exists public.company_billings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.profiles(id) on delete cascade,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'quarterly', 'semiannual', 'annual')),
  plan_name text,
  amount numeric(12,2) not null default 0,
  due_day smallint not null default 10 check (due_day between 1 and 31),
  next_due_date date,
  last_payment_date date,
  last_payment_amount numeric(12,2),
  payment_method text,
  status text not null default 'active' check (status in ('active', 'overdue', 'paused', 'cancelled', 'trial')),
  grace_days smallint not null default 0 check (grace_days >= 0),
  auto_renew boolean not null default true,
  custom_description text,
  notes text,
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

create index if not exists idx_company_billings_status on public.company_billings(status);
create index if not exists idx_company_billings_next_due_date on public.company_billings(next_due_date);

create or replace function public.set_company_billings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_company_billings_updated_at on public.company_billings;
create trigger trg_set_company_billings_updated_at
before update on public.company_billings
for each row execute function public.set_company_billings_updated_at();

alter table public.company_billings enable row level security;

drop policy if exists "Admins can manage company billings" on public.company_billings;
create policy "Admins can manage company billings"
on public.company_billings
for all
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
);

drop policy if exists "Users can view own billing" on public.company_billings;
create policy "Users can view own billing"
on public.company_billings
for select
using (company_id = auth.uid());
