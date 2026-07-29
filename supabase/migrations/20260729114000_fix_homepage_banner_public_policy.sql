begin;

drop policy if exists "Public read active homepage banners"
  on public.homepage_banners;

create policy "Public read active homepage banners"
  on public.homepage_banners for select
  to anon, authenticated
  using (is_active);

create policy "Admins read all homepage banners"
  on public.homepage_banners for select
  to authenticated
  using (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('marketing'))
  );

commit;
