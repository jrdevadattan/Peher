begin;

alter table public.store_settings
  add column if not exists meta_title text not null
    default 'PEHER - Handcrafted Luxury Jewellery by Vasudha Tiwari',
  add column if not exists meta_description text not null
    default 'Discover handcrafted gold and silver rings, necklaces, bracelets, and earrings. Shipped across India.',
  add column if not exists public_site_url text not null
    default 'https://peher.studio';

commit;
