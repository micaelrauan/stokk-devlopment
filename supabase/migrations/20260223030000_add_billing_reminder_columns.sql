alter table public.company_billings
  add column if not exists reminder_3d_sent_at timestamptz,
  add column if not exists due_day_sent_at timestamptz;

create index if not exists idx_company_billings_reminder_3d_sent_at
  on public.company_billings(reminder_3d_sent_at);

create index if not exists idx_company_billings_due_day_sent_at
  on public.company_billings(due_day_sent_at);
