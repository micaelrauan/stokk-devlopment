alter table public.company_billings
  add column if not exists reminder_3d_subject text,
  add column if not exists reminder_3d_body_html text,
  add column if not exists due_day_subject text,
  add column if not exists due_day_body_html text;
