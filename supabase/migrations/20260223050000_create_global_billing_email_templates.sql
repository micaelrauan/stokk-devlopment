create table if not exists public.billing_email_templates_global (
  template_key text primary key check (template_key in ('reminder_3d', 'due_day')),
  subject text,
  body_html text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_billing_email_templates_global_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_billing_email_templates_global_updated_at on public.billing_email_templates_global;
create trigger trg_set_billing_email_templates_global_updated_at
before update on public.billing_email_templates_global
for each row execute function public.set_billing_email_templates_global_updated_at();

alter table public.billing_email_templates_global enable row level security;

drop policy if exists "Admins can manage billing global templates" on public.billing_email_templates_global;
create policy "Admins can manage billing global templates"
on public.billing_email_templates_global
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
