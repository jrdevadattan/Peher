import { getProductMediaUrl } from "@/lib/supabase";
import type { AdminRole } from "@/lib/admin-auth-context";
import { uploadProductImage, type HomepageBanner } from "@/lib/catalog-api";
import { serverApi } from "@/lib/server-api";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: {
    productId: string;
    name: string;
    price: number;
    qty: number;
    size?: string;
    image: string;
  }[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending" | "Refunded" | "Failed";
  deliveryStatus:
    "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
  trackingNumber?: string;
  courierName?: string;
  customerNotes?: string;
  adminNotes?: string;
  timeline: { title: string; timestamp: string; note?: string }[];
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  registrationDate: string;
  lastLogin: string;
  status: "Active" | "Blocked";
  tags: string[];
};

export type AdminCoupon = {
  id: string;
  code: string;
  type: "Percentage" | "Flat" | "FreeShipping";
  value: number;
  minPurchase: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  maxRedemptionsPerCustomer: number;
  maxDiscountAmount: number;
  status: "Active" | "Expired" | "Disabled";
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
};

export type AdminReview = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
  verifiedPurchase: boolean;
  reply?: string;
};

export type ActivityLog = {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
};

export type AdminNotification = {
  id: string;
  type: "order_created" | "system";
  severity: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  currency: string;
  createdAt: string;
  isRead: boolean;
};

export type AdminMembership = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "Active" | "Inactive";
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  contactEmail: string;
  currencyCode: string;
  gstPercentage: number;
  freeShippingThreshold: number;
  standardShippingRate: number;
  pricesIncludeTax: boolean;
  shippingEnabled: boolean;
  maintenanceMode: boolean;
  metaTitle: string;
  metaDescription: string;
  publicSiteUrl: string;
};

export type AdminSeoPage = {
  id: string;
  path: string;
  title: string;
  description: string;
  includeInSitemap: boolean;
  includeInLlms: boolean;
  isIndexable: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type IndexNowResult = {
  accepted: boolean;
  statusCode: number;
  submitted: number;
  keyLocation: string;
};

type HomepageBannerRow = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_url: string;
  image_path: string;
  image_alt: string;
  is_active: boolean;
  sort_order: number;
};

export type MarketingCampaign = {
  id: string;
  subject: string;
  content: string;
  status: "Draft" | "Queued" | "Sent" | "Cancelled";
  audienceCount: number;
  createdAt: string;
  errorMessage?: string;
};

export type AnalyticsReport = {
  range: { from: string; to: string };
  summary: {
    grossRevenue: number;
    netRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    customerCount: number;
    refundCount: number;
  };
  series: { period: string; revenue: number; orders: number }[];
  regions: { region: string; sales: number }[];
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  orders: Record<string, any>[];
};

export type ShippingMethod = {
  id: string;
  name: string;
  code: string;
  rate: number;
  freeThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  sortOrder: number;
};

export type PaymentSettings = {
  isEnabled: boolean;
  testMode: boolean;
  allowCards: boolean;
  allowUpi: boolean;
  allowNetbanking: boolean;
  allowWallets: boolean;
  automaticCapture: boolean;
  credentialsConfigured: boolean;
  modeMatchesCredentials: boolean;
  keyHint: string | null;
};

export type ApplicationBackup = {
  id: string;
  name: string;
  description: string;
  status: "Ready" | "Restored" | "Failed";
  restoredAt: string | null;
  createdAt: string;
};

export async function getAdminOrders() {
  const data = await serverApi<Record<string, any>[]>("/admin/orders", { auth: true });
  return data.map((order): AdminOrder => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone ?? "",
    shippingAddress: order.shipping_address,
    items: (order.items ?? []).map((item: Record<string, any>) => ({
      productId: item.product_id ?? "",
      name: item.product_name,
      price: Number(item.unit_price),
      qty: item.quantity,
      size: item.size ?? undefined,
      image: getProductMediaUrl(item.image_path),
    })),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shipping_cost),
    taxAmount: Number(order.tax_amount),
    discountAmount: Number(order.discount_amount),
    total: Number(order.total),
    orderDate: order.created_at,
    paymentMethod: order.payment_method ?? "",
    paymentStatus: order.payment_status,
    deliveryStatus: order.delivery_status,
    trackingNumber: order.tracking_number ?? undefined,
    courierName: order.courier_name ?? undefined,
    customerNotes: order.customer_notes ?? undefined,
    adminNotes: order.admin_notes ?? undefined,
    timeline: (order.timeline ?? [])
      .sort(
        (a: Record<string, any>, b: Record<string, any>) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((entry: Record<string, any>) => ({
        title: entry.title,
        timestamp: entry.created_at,
        note: entry.note ?? undefined,
      })),
  }));
}

export async function getCustomerOrders() {
  const data = await serverApi<Record<string, any>[]>("/orders/my", { auth: true });
  return data.map((order): AdminOrder => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone ?? "",
    shippingAddress: order.shipping_address,
    items: (order.items ?? []).map((item: Record<string, any>) => ({
      productId: item.product_id ?? "",
      name: item.product_name,
      price: Number(item.unit_price),
      qty: item.quantity,
      size: item.size ?? undefined,
      image: getProductMediaUrl(item.image_path),
    })),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shipping_cost),
    taxAmount: Number(order.tax_amount),
    discountAmount: Number(order.discount_amount),
    total: Number(order.total),
    orderDate: order.created_at,
    paymentMethod: order.payment_method ?? "",
    paymentStatus: order.payment_status,
    deliveryStatus: order.delivery_status,
    trackingNumber: order.tracking_number ?? undefined,
    courierName: order.courier_name ?? undefined,
    customerNotes: order.customer_notes ?? undefined,
    adminNotes: order.admin_notes ?? undefined,
    timeline: (order.timeline ?? [])
      .sort(
        (a: Record<string, any>, b: Record<string, any>) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((entry: Record<string, any>) => ({
        title: entry.title,
        timestamp: entry.created_at,
        note: entry.note ?? undefined,
      })),
  }));
}

export async function updateOrderStatus(
  order: AdminOrder,
  deliveryStatus: AdminOrder["deliveryStatus"],
) {
  await serverApi(`/admin/orders/${order.id}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ deliveryStatus }),
  });
}

export async function getAdminCustomers() {
  const data = await serverApi<{
    profiles: Record<string, any>[];
    orders: Record<string, any>[];
  }>("/admin/customers", { auth: true });
  return data.profiles.map((profile): AdminCustomer => {
    const customerOrders = data.orders.filter((order) => order.customer_id === profile.id);
    return {
      id: profile.id,
      name: profile.full_name || "Customer",
      email: profile.email || customerOrders[0]?.customer_email || "",
      phone: profile.phone ?? "",
      address: customerOrders[0]?.shipping_address ?? "",
      totalOrders: customerOrders.length,
      totalSpent: customerOrders.reduce((sum, order) => sum + Number(order.total), 0),
      registrationDate: profile.created_at,
      lastLogin: profile.last_login_at ?? profile.created_at,
      status: profile.status,
      tags: profile.tags ?? [],
    };
  });
}

export async function updateCustomerStatus(
  customer: AdminCustomer,
  status: AdminCustomer["status"],
) {
  await serverApi(`/admin/customers/${customer.id}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function getAdminCoupons() {
  const data = await serverApi<Record<string, any>[]>("/admin/coupons", { auth: true });
  return data.map((coupon): AdminCoupon => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minPurchase: Number(coupon.min_purchase),
    expiryDate: coupon.expires_at?.slice(0, 10) ?? "",
    usageLimit: coupon.usage_limit ?? 0,
    usageCount: coupon.usage_count,
    maxRedemptionsPerCustomer: coupon.max_redemptions_per_customer ?? 1,
    maxDiscountAmount: Number(coupon.max_discount_amount ?? 0),
    status: coupon.status,
  }));
}

export async function saveCoupon(coupon: AdminCoupon) {
  const payload = {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minPurchase: coupon.minPurchase,
    expiryDate: coupon.expiryDate,
    usageLimit: coupon.usageLimit,
    maxRedemptionsPerCustomer: coupon.maxRedemptionsPerCustomer,
    maxDiscountAmount: coupon.maxDiscountAmount,
    status: coupon.status,
  };
  await serverApi(`/admin/coupons${coupon.id ? `/${coupon.id}` : ""}`, {
    method: coupon.id ? "PATCH" : "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function deleteCoupon(coupon: AdminCoupon) {
  await serverApi(`/admin/coupons/${coupon.id}`, { method: "DELETE", auth: true });
}

export async function getAdminCategories() {
  const data = await serverApi<Record<string, any>[]>("/admin/categories", { auth: true });
  return data.map((category): AdminCategory => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imagePath: category.image_path ?? "",
    imageUrl: getProductMediaUrl(category.image_path),
    isActive: category.is_active,
    sortOrder: category.sort_order,
    productCount: category.product_count ?? 0,
  }));
}

export async function saveAdminCategory(category: AdminCategory) {
  return serverApi(`/admin/categories${category.id ? `/${category.id}` : ""}`, {
    method: category.id ? "PATCH" : "POST",
    auth: true,
    body: JSON.stringify(category),
  });
}

export async function deleteAdminCategory(category: AdminCategory) {
  await serverApi(`/admin/categories/${category.id}`, { method: "DELETE", auth: true });
}

export async function uploadCategoryImage(file: File) {
  const body = new FormData();
  body.append("image", file);
  const uploaded = await serverApi<{ path: string }>("/admin/categories/image", {
    method: "POST",
    auth: true,
    body,
  });
  return { ...uploaded, url: getProductMediaUrl(uploaded.path) };
}

export async function getAdminReviews() {
  const data = await serverApi<Record<string, any>[]>("/admin/reviews", { auth: true });
  return data.map((review): AdminReview => ({
    id: review.id,
    productId: review.product_id,
    productName: Array.isArray(review.product)
      ? review.product[0]?.name
      : (review.product?.name ?? "Deleted product"),
    customerName: review.customer_name,
    customerEmail: review.customer_email,
    rating: review.rating,
    title: review.title ?? "",
    comment: review.comment,
    date: review.created_at,
    status: review.status,
    verifiedPurchase: review.is_verified_purchase,
    reply: review.reply ?? undefined,
  }));
}

export async function updateReview(
  review: AdminReview,
  changes: Partial<Pick<AdminReview, "status" | "reply">>,
) {
  await serverApi(`/admin/reviews/${review.id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(changes),
  });
}

export async function getActivityLogs() {
  const data = await serverApi<Record<string, any>[]>("/admin/activity", { auth: true });
  return data.map((entry): ActivityLog => ({
    id: entry.id,
    timestamp: entry.created_at,
    userName: entry.actor_name,
    userRole: entry.actor_role,
    action: entry.action,
    details: entry.details,
    ipAddress: entry.ip_address ?? "—",
  }));
}

export async function getAdminNotifications() {
  const data = await serverApi<Record<string, any>[]>("/admin/notifications", { auth: true });
  return data.map((notification): AdminNotification => ({
    id: notification.id,
    type: notification.type,
    severity: notification.severity,
    title: notification.title,
    message: notification.message,
    orderId: notification.order_id ?? undefined,
    orderNumber: notification.metadata?.order_number ?? undefined,
    total: notification.metadata?.total == null ? undefined : Number(notification.metadata.total),
    currency: notification.metadata?.currency ?? "INR",
    createdAt: notification.created_at,
    isRead: notification.is_read,
  }));
}

export async function markAdminNotificationRead(notificationId: string) {
  await serverApi("/admin/notifications/read", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ notificationIds: [notificationId] }),
  });
}

export async function markAllAdminNotificationsRead(notificationIds: string[]) {
  if (!notificationIds.length) return;
  await serverApi("/admin/notifications/read", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ notificationIds }),
  });
}

export async function retryOrderNotifications() {
  const data = await serverApi<{ recovered: number }>("/admin/notifications/retry", {
    method: "POST",
    auth: true,
  });
  return data.recovered;
}

export async function getAdminMemberships() {
  const data = await serverApi<Record<string, any>[]>("/admin/memberships", { auth: true });
  return data.map((membership): AdminMembership => ({
    id: membership.user_id,
    name: membership.display_name,
    email: membership.email,
    role: membership.role,
    status: membership.is_active ? "Active" : "Inactive",
  }));
}

export async function getStoreSettings() {
  const data = await serverApi<Record<string, any>>("/admin/settings", { auth: true });
  return {
    storeName: data.store_name,
    tagline: data.tagline,
    contactEmail: data.contact_email,
    currencyCode: data.currency_code,
    gstPercentage: Number(data.gst_percentage),
    freeShippingThreshold: Number(data.free_shipping_threshold),
    standardShippingRate: Number(data.standard_shipping_rate),
    pricesIncludeTax: Boolean(data.prices_include_tax),
    shippingEnabled: Boolean(data.shipping_enabled),
    maintenanceMode: data.maintenance_mode,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    publicSiteUrl: data.public_site_url,
  } satisfies StoreSettings;
}

export async function saveStoreSettings(settings: StoreSettings) {
  await serverApi("/admin/settings", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(settings),
  });
}

function mapAdminSeoPage(data: Record<string, any>): AdminSeoPage {
  return {
    id: data.id,
    path: data.path,
    title: data.title,
    description: data.description ?? "",
    includeInSitemap: Boolean(data.include_in_sitemap),
    includeInLlms: Boolean(data.include_in_llms),
    isIndexable: Boolean(data.is_indexable),
    sortOrder: Number(data.sort_order ?? 0),
    updatedAt: data.updated_at,
  };
}

export async function getAdminSeoPages() {
  const data = await serverApi<Record<string, any>[]>("/admin/seo/pages", { auth: true });
  return data.map(mapAdminSeoPage);
}

export async function saveAdminSeoPage(page: AdminSeoPage) {
  const data = await serverApi<Record<string, any>>(
    `/admin/seo/pages${page.id ? `/${page.id}` : ""}`,
    {
      method: page.id ? "PATCH" : "POST",
      auth: true,
      body: JSON.stringify(page),
    },
  );
  return mapAdminSeoPage(data);
}

export async function deleteAdminSeoPage(id: string) {
  await serverApi(`/admin/seo/pages/${id}`, { method: "DELETE", auth: true });
}

export async function submitAllUrlsToIndexNow() {
  return serverApi<IndexNowResult>("/admin/seo/indexnow", {
    method: "POST",
    auth: true,
  });
}

function mapHomepageBanner(row: HomepageBannerRow): HomepageBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    imagePath: row.image_path,
    imageUrl: getProductMediaUrl(row.image_path),
    imageAlt: row.image_alt,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function getAdminHomepageBanners() {
  const data = await serverApi<HomepageBannerRow[]>("/admin/banners", { auth: true });
  return data.map(mapHomepageBanner);
}

export async function saveHomepageBanner(banner: HomepageBanner) {
  const data = await serverApi<HomepageBannerRow>(
    `/admin/banners${banner.id ? `/${banner.id}` : ""}`,
    {
      method: banner.id ? "PATCH" : "POST",
      auth: true,
      body: JSON.stringify(banner),
    },
  );
  return mapHomepageBanner(data);
}

export async function deleteHomepageBanner(banner: HomepageBanner) {
  await serverApi(`/admin/banners/${banner.id}`, { method: "DELETE", auth: true });
}

export async function uploadHomepageBannerImage(file: File) {
  return uploadProductImage(file, "homepage-banners");
}

export async function getMarketingDashboard() {
  const data = await serverApi<{
    subscriber_count: number;
    delivery_configured: boolean;
    campaigns: Record<string, any>[];
  }>("/admin/marketing", { auth: true });
  return {
    subscriberCount: data.subscriber_count,
    deliveryConfigured: data.delivery_configured,
    campaigns: data.campaigns.map((campaign): MarketingCampaign => ({
      id: campaign.id,
      subject: campaign.subject,
      content: campaign.content,
      status: campaign.status,
      audienceCount: campaign.audience_count,
      createdAt: campaign.created_at,
      errorMessage: campaign.error_message ?? undefined,
    })),
  };
}

export async function queueMarketingCampaign(subject: string, content: string) {
  const data = await serverApi<{ audienceCount: number }>("/admin/marketing", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ subject, content }),
  });
  return data.audienceCount;
}

export async function updateMarketingCampaign(campaignId: string, status: "Queued" | "Cancelled") {
  await serverApi(`/admin/marketing/${campaignId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export async function getAnalyticsReport(filters: {
  from: string;
  to: string;
  deliveryStatus?: string;
  paymentStatus?: string;
}) {
  const params = new URLSearchParams(filters);
  return serverApi<AnalyticsReport>(`/admin/analytics?${params}`, { auth: true });
}

function mapShippingMethod(row: Record<string, any>): ShippingMethod {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    rate: Number(row.rate),
    freeThreshold: row.free_threshold == null ? null : Number(row.free_threshold),
    estimatedDaysMin: row.estimated_days_min,
    estimatedDaysMax: row.estimated_days_max,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function getShippingMethods() {
  const data = await serverApi<Record<string, any>[]>("/admin/shipping", { auth: true });
  return data.map(mapShippingMethod);
}

export async function saveShippingMethod(method: ShippingMethod) {
  const data = await serverApi<Record<string, any>>(
    `/admin/shipping${method.id ? `/${method.id}` : ""}`,
    {
      method: method.id ? "PATCH" : "POST",
      auth: true,
      body: JSON.stringify(method),
    },
  );
  return mapShippingMethod(data);
}

export async function deleteShippingMethod(id: string) {
  await serverApi(`/admin/shipping/${id}`, { method: "DELETE", auth: true });
}

export async function getPaymentSettings() {
  const data = await serverApi<Record<string, any>>("/admin/payments", { auth: true });
  return {
    isEnabled: data.is_enabled,
    testMode: data.test_mode,
    allowCards: data.allow_cards,
    allowUpi: data.allow_upi,
    allowNetbanking: data.allow_netbanking,
    allowWallets: data.allow_wallets,
    automaticCapture: data.automatic_capture,
    credentialsConfigured: data.credentials_configured,
    modeMatchesCredentials: data.mode_matches_credentials,
    keyHint: data.key_hint,
  } satisfies PaymentSettings;
}

export async function savePaymentSettings(settings: PaymentSettings) {
  await serverApi("/admin/payments", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(settings),
  });
}

export async function updateAdminMembership(id: string, role: AdminRole, isActive: boolean) {
  await serverApi(`/admin/memberships/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ role, isActive }),
  });
}

export async function inviteAdminMembership(name: string, email: string, role: AdminRole) {
  await serverApi("/admin/memberships/invite", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ name, email, role }),
  });
}

export async function getApplicationBackups() {
  const data = await serverApi<Record<string, any>[]>("/admin/backups", { auth: true });
  return data.map((backup): ApplicationBackup => ({
    id: backup.id,
    name: backup.name,
    description: backup.description,
    status: backup.status,
    restoredAt: backup.restored_at,
    createdAt: backup.created_at,
  }));
}

export async function createApplicationBackup(name: string, description: string) {
  return serverApi<ApplicationBackup>("/admin/backups", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ name, description }),
  });
}

export async function exportApplicationBackup(id: string) {
  return serverApi<Record<string, unknown>>(`/admin/backups/${id}/export`, { auth: true });
}

export async function restoreApplicationBackup(id: string, confirmation: string) {
  await serverApi(`/admin/backups/${id}/restore`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ confirmation }),
  });
}
