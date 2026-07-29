begin;

alter table public.store_settings
  alter column gst_percentage set default 0,
  alter column standard_shipping_rate set default 99,
  alter column free_shipping_threshold set default 1500;

update public.store_settings
set
  gst_percentage = 0,
  prices_include_tax = true,
  shipping_enabled = true,
  standard_shipping_rate = 99,
  free_shipping_threshold = 1500,
  updated_at = now()
where id = 'default';

update public.products
set tax_rate = 0, updated_at = now()
where tax_rate <> 0;

insert into public.shipping_methods (
  name,
  code,
  rate,
  free_threshold,
  estimated_days_min,
  estimated_days_max,
  is_active,
  sort_order
)
values (
  'Standard insured delivery',
  'standard',
  99,
  1500,
  3,
  7,
  true,
  0
)
on conflict (code) do update
set
  rate = excluded.rate,
  free_threshold = excluded.free_threshold,
  is_active = true,
  updated_at = now();

insert into public.payment_settings (
  id,
  is_enabled,
  test_mode,
  allow_cards,
  allow_upi,
  allow_netbanking,
  allow_wallets,
  automatic_capture
)
values ('razorpay', true, true, true, true, true, true, true)
on conflict (id) do update
set
  is_enabled = true,
  allow_cards = true,
  allow_upi = true,
  allow_netbanking = true,
  allow_wallets = true,
  automatic_capture = true,
  updated_at = now();

commit;
