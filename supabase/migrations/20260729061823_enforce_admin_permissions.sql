begin;

create or replace function app_private.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
        and is_active = true
        and (
          '*' = any(permissions)
          or permission_name = any(permissions)
        )
    );
$$;

revoke all on function app_private.has_permission(text) from public;
grant execute on function app_private.has_permission(text) to authenticated;

alter policy "Admins manage profiles" on public.profiles
  using ((select app_private.has_permission('customers')))
  with check ((select app_private.has_permission('customers')));

alter policy "Admins manage memberships" on public.admin_users
  using ((select app_private.has_permission('users')))
  with check ((select app_private.has_permission('users')));

alter policy "Admins manage categories" on public.categories
  using ((select app_private.has_permission('products')))
  with check ((select app_private.has_permission('products')));

alter policy "Admins manage products" on public.products
  using ((select app_private.has_permission('products')))
  with check ((select app_private.has_permission('products')));

alter policy "Admins manage variants" on public.product_variants
  using ((select app_private.has_permission('products')))
  with check ((select app_private.has_permission('products')));

alter policy "Admins manage product images" on public.product_images
  using (
    (select app_private.has_permission('products'))
    or (select app_private.has_permission('media'))
  )
  with check (
    (select app_private.has_permission('products'))
    or (select app_private.has_permission('media'))
  );

alter policy "Admins manage related products" on public.product_related_products
  using ((select app_private.has_permission('products')))
  with check ((select app_private.has_permission('products')));

alter policy "Admins manage orders" on public.orders
  using ((select app_private.has_permission('orders')))
  with check ((select app_private.has_permission('orders')));

alter policy "Admins manage order items" on public.order_items
  using ((select app_private.has_permission('orders')))
  with check ((select app_private.has_permission('orders')));

alter policy "Admins manage order timeline" on public.order_timeline
  using ((select app_private.has_permission('orders')))
  with check ((select app_private.has_permission('orders')));

alter policy "Admins manage coupons" on public.coupons
  using ((select app_private.has_permission('coupons')))
  with check ((select app_private.has_permission('coupons')));

alter policy "Admins manage reviews" on public.reviews
  using ((select app_private.has_permission('reviews')))
  with check ((select app_private.has_permission('reviews')));

alter policy "Admins read activity logs" on public.activity_logs
  using ((select app_private.has_permission('activity_logs')));

alter policy "Admins create activity logs" on public.activity_logs
  with check (
    (select app_private.is_admin())
    and ((select auth.uid()) = actor_id or actor_id is null)
  );

alter policy "Admins list product media" on storage.objects
  using (
    bucket_id = 'product-media'
    and (select app_private.has_permission('media'))
  );

alter policy "Admins upload product media" on storage.objects
  with check (
    bucket_id = 'product-media'
    and (select app_private.has_permission('media'))
  );

alter policy "Admins update product media" on storage.objects
  using (
    bucket_id = 'product-media'
    and (select app_private.has_permission('media'))
  )
  with check (
    bucket_id = 'product-media'
    and (select app_private.has_permission('media'))
  );

alter policy "Admins delete product media" on storage.objects
  using (
    bucket_id = 'product-media'
    and (select app_private.has_permission('media'))
  );

commit;
