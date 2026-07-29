begin;

revoke select on public.homepage_banners from anon, authenticated;

grant select (
  id,
  title,
  subtitle,
  cta_label,
  cta_url,
  image_path,
  image_alt,
  is_active,
  sort_order,
  created_at
) on public.homepage_banners to anon, authenticated;

commit;
