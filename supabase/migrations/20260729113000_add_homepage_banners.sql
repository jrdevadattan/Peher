begin;

create table public.homepage_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  subtitle text not null default '' check (char_length(subtitle) <= 240),
  cta_label text not null default 'Shop Now' check (char_length(cta_label) between 1 and 40),
  cta_url text not null default '/shop'
    check (
      char_length(cta_url) between 1 and 500
      and (cta_url like '/%' or cta_url ~* '^https?://')
    ),
  image_path text not null check (char_length(image_path) between 1 and 500),
  image_alt text not null default '' check (char_length(image_alt) <= 180),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homepage_banners_storefront_idx
  on public.homepage_banners (is_active, sort_order, created_at);

create trigger homepage_banners_set_updated_at
  before update on public.homepage_banners
  for each row execute function app_private.set_updated_at();

alter table public.homepage_banners enable row level security;

create policy "Public read active homepage banners"
  on public.homepage_banners for select
  to anon, authenticated
  using (
    is_active
    or (select app_private.has_permission('settings'))
    or (select app_private.has_permission('marketing'))
  );

create policy "Admins create homepage banners"
  on public.homepage_banners for insert
  to authenticated
  with check (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('marketing'))
  );

create policy "Admins update homepage banners"
  on public.homepage_banners for update
  to authenticated
  using (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('marketing'))
  )
  with check (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('marketing'))
  );

create policy "Admins delete homepage banners"
  on public.homepage_banners for delete
  to authenticated
  using (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('marketing'))
  );

revoke all on public.homepage_banners from public;
grant select on public.homepage_banners to anon;
grant select, insert, update, delete on public.homepage_banners to authenticated;
grant all on public.homepage_banners to service_role;

insert into public.homepage_banners (
  title,
  subtitle,
  cta_label,
  cta_url,
  image_path,
  image_alt,
  sort_order
)
values
  (
    'summer stacks.',
    'Layered chains. Sun-warm gold. A little extra, always.',
    'Shop Now',
    '/shop',
    'catalog/homepage-banners/hero.jpg',
    'Layered gold jewellery styled for summer',
    0
  ),
  (
    'quiet luxe.',
    'Hand-shaped in wax. Cast in 18k. Loved for a lifetime.',
    'Shop Now',
    '/shop',
    'catalog/homepage-banners/editorial1.jpg',
    'Handcrafted fine jewellery from Peher',
    1
  ),
  (
    '70% off.',
    'Icons at a whisper. While the atelier lasts.',
    'Shop Now',
    '/shop',
    'catalog/homepage-banners/craft.jpg',
    'Peher jewellery pieces from the atelier sale',
    2
  );

commit;
