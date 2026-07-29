begin;

alter policy "Admins manage store settings" on public.store_settings
  using (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('seo'))
  )
  with check (
    (select app_private.has_permission('settings'))
    or (select app_private.has_permission('seo'))
  );

create policy "Marketing admins read subscriber consent"
  on public.profiles for select to authenticated
  using ((select app_private.has_permission('marketing')));

commit;
