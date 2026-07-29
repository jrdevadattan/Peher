begin;

alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default false;

create table public.store_settings (
  id text primary key default 'default' check (id = 'default'),
  store_name text not null default 'PEHER',
  tagline text not null default 'Extra is our love language.',
  contact_email text not null default 'hello@peher.studio',
  currency_code text not null default 'INR',
  gst_percentage numeric(5, 2) not null default 3 check (gst_percentage >= 0),
  free_shipping_threshold numeric(12, 2) not null default 1500
    check (free_shipping_threshold >= 0),
  maintenance_mode boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  content text not null,
  status text not null default 'Draft'
    check (status in ('Draft', 'Queued', 'Sent', 'Cancelled')),
  audience_count integer not null default 0 check (audience_count >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  queued_at timestamptz,
  sent_at timestamptz
);

create index marketing_campaigns_created_by_idx
  on public.marketing_campaigns (created_by);
create index marketing_campaigns_created_at_idx
  on public.marketing_campaigns (created_at desc);
create index profiles_marketing_opt_in_idx
  on public.profiles (marketing_opt_in)
  where marketing_opt_in = true;

create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function app_private.set_updated_at();

alter table public.store_settings enable row level security;
alter table public.marketing_campaigns enable row level security;

create policy "Admins manage store settings"
  on public.store_settings for all to authenticated
  using ((select app_private.has_permission('settings')))
  with check ((select app_private.has_permission('settings')));

create policy "Admins manage marketing campaigns"
  on public.marketing_campaigns for all to authenticated
  using ((select app_private.has_permission('marketing')))
  with check ((select app_private.has_permission('marketing')));

revoke all on public.store_settings, public.marketing_campaigns from public, anon;
grant select, insert, update, delete
  on public.store_settings, public.marketing_campaigns
  to authenticated;

insert into public.store_settings (id)
values ('default')
on conflict (id) do nothing;

update public.categories
set image_path = case slug
  when 'rings' then 'catalog/seed/rings.jpg'
  when 'necklaces' then 'catalog/seed/necklaces.jpg'
  when 'bracelets' then 'catalog/seed/bracelets.jpg'
  when 'earrings' then 'catalog/seed/earrings.jpg'
  else image_path
end
where slug in ('rings', 'necklaces', 'bracelets', 'earrings');

commit;
