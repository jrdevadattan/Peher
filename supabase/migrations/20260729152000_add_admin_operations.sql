begin;

alter table public.store_settings
  add column if not exists prices_include_tax boolean not null default true,
  add column if not exists shipping_enabled boolean not null default true;

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  rate numeric(12, 2) not null default 0 check (rate >= 0),
  free_threshold numeric(12, 2) check (free_threshold is null or free_threshold >= 0),
  estimated_days_min integer not null default 3 check (estimated_days_min >= 0),
  estimated_days_max integer not null default 7 check (estimated_days_max >= estimated_days_min),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_settings (
  id text primary key default 'razorpay' check (id = 'razorpay'),
  provider text not null default 'Razorpay',
  is_enabled boolean not null default true,
  test_mode boolean not null default true,
  allow_cards boolean not null default true,
  allow_upi boolean not null default true,
  allow_netbanking boolean not null default true,
  allow_wallets boolean not null default true,
  automatic_capture boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_backups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'Ready' check (status in ('Ready', 'Restored', 'Failed')),
  payload jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  restored_by uuid references auth.users(id) on delete set null,
  restored_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.marketing_campaigns
  add column if not exists error_message text;

delete from public.reviews older
using public.reviews newer
where older.customer_id is not null
  and newer.customer_id = older.customer_id
  and newer.product_id = older.product_id
  and (
    newer.created_at > older.created_at
    or (newer.created_at = older.created_at and newer.id::text > older.id::text)
  );

create unique index if not exists reviews_customer_product_unique
  on public.reviews (customer_id, product_id)
  where customer_id is not null;

create index if not exists shipping_methods_active_sort_idx
  on public.shipping_methods (is_active, sort_order);
create index if not exists application_backups_created_at_idx
  on public.application_backups (created_at desc);

drop trigger if exists shipping_methods_set_updated_at on public.shipping_methods;
create trigger shipping_methods_set_updated_at
  before update on public.shipping_methods
  for each row execute function app_private.set_updated_at();

drop trigger if exists payment_settings_set_updated_at on public.payment_settings;
create trigger payment_settings_set_updated_at
  before update on public.payment_settings
  for each row execute function app_private.set_updated_at();

alter table public.shipping_methods enable row level security;
alter table public.payment_settings enable row level security;
alter table public.application_backups enable row level security;

revoke all on public.shipping_methods, public.payment_settings, public.application_backups
  from public, anon, authenticated;

insert into public.shipping_methods (name, code, rate, free_threshold, estimated_days_min, estimated_days_max)
select
  'Standard insured delivery',
  'standard',
  standard_shipping_rate,
  free_shipping_threshold,
  3,
  7
from public.store_settings
where id = 'default'
on conflict (code) do nothing;

insert into public.payment_settings (id)
values ('razorpay')
on conflict (id) do nothing;

commit;
