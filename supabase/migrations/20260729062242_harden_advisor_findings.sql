revoke all on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists activity_logs_actor_id_idx
  on public.activity_logs (actor_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists product_related_products_related_product_id_idx
  on public.product_related_products (related_product_id);

create index if not exists products_created_by_idx
  on public.products (created_by);

create index if not exists reviews_customer_id_idx
  on public.reviews (customer_id);
