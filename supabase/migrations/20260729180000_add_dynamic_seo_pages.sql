begin;

create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique
    check (
      path = ''
      or (
        path ~ '^/[a-z0-9][a-z0-9/_-]*$'
        and path !~ '//'
        and path !~ '/$'
      )
    ),
  title text not null check (char_length(title) between 2 and 120),
  description text not null default ''
    check (char_length(description) <= 500),
  include_in_sitemap boolean not null default true,
  include_in_llms boolean not null default true,
  is_indexable boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_pages_sitemap_order_idx
  on public.seo_pages (sort_order, path)
  where include_in_sitemap = true and is_indexable = true;

create index if not exists seo_pages_llms_order_idx
  on public.seo_pages (sort_order, path)
  where include_in_llms = true and is_indexable = true;

drop trigger if exists seo_pages_set_updated_at on public.seo_pages;
create trigger seo_pages_set_updated_at
  before update on public.seo_pages
  for each row execute function app_private.set_updated_at();

alter table public.seo_pages enable row level security;

-- Sitemap data is served only by the backend secret key. Browser roles have no table access.
revoke all on public.seo_pages from public, anon, authenticated;
grant select, insert, update, delete on public.seo_pages to service_role;

insert into public.seo_pages (
  path,
  title,
  description,
  include_in_sitemap,
  include_in_llms,
  is_indexable,
  sort_order
)
values
  ('', 'PEHER Handcrafted Jewellery', 'Discover handcrafted rings, necklaces, bracelets, and earrings from the PEHER atelier.', true, true, true, 0),
  ('/shop', 'Shop All Jewellery', 'Browse the complete PEHER jewellery collection.', true, true, true, 10),
  ('/new-arrivals', 'New Arrivals', 'Explore the newest handcrafted pieces from PEHER.', true, true, true, 20),
  ('/collections', 'Jewellery Collections', 'Browse PEHER jewellery by collection and category.', true, true, true, 30),
  ('/about', 'About PEHER', 'Learn about the PEHER atelier, its craftsmanship, and design philosophy.', true, true, true, 40),
  ('/journal', 'PEHER Journal', 'Read stories about jewellery, craft, materials, and care.', true, true, true, 50),
  ('/contact', 'Contact PEHER', 'Contact the PEHER team for product and order assistance.', true, true, true, 60),
  ('/shipping', 'Shipping Information', 'Review PEHER shipping coverage, costs, and delivery timelines.', true, true, true, 70),
  ('/returns', 'Returns and Damage Support', 'Review the PEHER returns, replacement, and damage-support policy.', true, true, true, 80),
  ('/size-guide', 'Jewellery Size Guide', 'Find guidance for selecting the correct PEHER jewellery size.', true, true, true, 90)
on conflict (path) do update
set
  title = excluded.title,
  description = excluded.description,
  include_in_sitemap = excluded.include_in_sitemap,
  include_in_llms = excluded.include_in_llms,
  is_indexable = excluded.is_indexable,
  sort_order = excluded.sort_order;

commit;
