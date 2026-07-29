import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/lib/admin-auth-context";
import {
  getAdminOrders,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotification,
} from "@/lib/admin-api";
import { getAdminProducts } from "@/lib/catalog-api";
import { useAdminNotifications } from "@/lib/use-admin-notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewView } from "./views/OverviewView";
import { ProductsView } from "./views/ProductsView";
import { CategoriesView } from "./views/CategoriesView";
import { OrdersView } from "./views/OrdersView";
import { CustomersView } from "./views/CustomersView";
import { AnalyticsView } from "./views/AnalyticsView";
import { InventoryView } from "./views/InventoryView";
import { CouponsView } from "./views/CouponsView";
import { ReviewsView } from "./views/ReviewsView";
import { MarketingView } from "./views/MarketingView";
import { SettingsView } from "./views/SettingsView";
import { UsersRolesView } from "./views/UsersRolesView";
import { ActivityLogsView } from "./views/ActivityLogsView";
import { MediaLibraryView } from "./views/MediaLibraryView";
import { SeoView } from "./views/SeoView";
import { BackupView } from "./views/BackupView";
import { NotificationsView } from "./views/NotificationsView";
import { SalesReportsView } from "./views/SalesReportsView";
import { ShippingView } from "./views/ShippingView";
import { PaymentsView } from "./views/PaymentsView";
import { TaxesView } from "./views/TaxesView";
import { PeherLogo } from "@/components/PeherLogo";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Tag,
  Warehouse,
  Star,
  BarChart3,
  FileSpreadsheet,
  Megaphone,
  Bell,
  Settings,
  Truck,
  CreditCard,
  Percent,
  ShieldCheck,
  History,
  Image as ImageIcon,
  Globe,
  Database,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Plus,
  X,
  Sparkles,
  Command,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "orders"
  | "products"
  | "categories"
  | "customers"
  | "coupons"
  | "inventory"
  | "reviews"
  | "analytics"
  | "sales-reports"
  | "marketing"
  | "notifications"
  | "settings"
  | "shipping"
  | "payments"
  | "taxes"
  | "users-roles"
  | "activity-logs"
  | "media"
  | "seo"
  | "backup"
  | "system";

const sidebarMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "*" },
  { id: "orders", label: "Orders", icon: ShoppingBag, permission: "orders" },
  { id: "products", label: "Products", icon: Package, permission: "products" },
  { id: "categories", label: "Categories", icon: Layers, permission: "categories" },
  { id: "customers", label: "Customers", icon: Users, permission: "customers" },
  { id: "coupons", label: "Coupons", icon: Tag, permission: "coupons" },
  { id: "inventory", label: "Inventory", icon: Warehouse, permission: "inventory" },
  { id: "reviews", label: "Reviews", icon: Star, permission: "reviews" },
  { id: "analytics", label: "Analytics", icon: BarChart3, permission: "analytics" },
  { id: "sales-reports", label: "Sales Reports", icon: FileSpreadsheet, permission: "analytics" },
  { id: "marketing", label: "Marketing", icon: Megaphone, permission: "marketing" },
  { id: "notifications", label: "Notifications", icon: Bell, permission: "orders" },
  { id: "settings", label: "Website Settings", icon: Settings, permission: "settings" },
  { id: "shipping", label: "Shipping", icon: Truck, permission: "shipping" },
  { id: "payments", label: "Payments", icon: CreditCard, permission: "payments" },
  { id: "taxes", label: "Taxes", icon: Percent, permission: "taxes" },
  { id: "users-roles", label: "Users & Roles", icon: ShieldCheck, permission: "settings" },
  { id: "activity-logs", label: "Activity Logs", icon: History, permission: "settings" },
  { id: "media", label: "Media Library", icon: ImageIcon, permission: "media" },
  { id: "seo", label: "SEO", icon: Globe, permission: "seo" },
  { id: "backup", label: "Backup & Restore", icon: Database, permission: "settings" },
];

export function AdminLayout() {
  const queryClient = useQueryClient();
  const { adminUser, logout, hasPermission } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: liveOrders = [] } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: getAdminOrders,
    enabled: hasPermission("orders"),
  });
  const { data: liveProducts = [] } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: getAdminProducts,
    enabled: hasPermission("products") || hasPermission("inventory"),
  });
  const notificationCenter = useAdminNotifications(hasPermission("orders"));
  const pendingOrderCount = liveOrders.filter((order) =>
    ["Pending", "Confirmed"].includes(order.deliveryStatus),
  ).length;
  const lowStockCount = liveProducts.filter(
    (product) => product.stock <= 10,
  ).length;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = normalizedSearch
    ? [
        ...liveProducts
          .filter((product) =>
            [product.name, product.sku, product.category]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch),
          )
          .slice(0, 5)
          .map((product) => ({
            id: `product-${product.databaseId || product.id}`,
            label: product.name,
            detail: `Product · ${product.sku}`,
            tab: "products" as AdminTab,
          })),
        ...liveOrders
          .filter((order) =>
            [order.orderNumber, order.customerName, order.customerEmail]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch),
          )
          .slice(0, 5)
          .map((order) => ({
            id: `order-${order.id}`,
            label: order.orderNumber,
            detail: `Order · ${order.customerName}`,
            tab: "orders" as AdminTab,
          })),
      ]
    : [];

  const handleNotificationOpen = async (notification: AdminNotification) => {
    if (!notification.isRead) {
      await markAdminNotificationRead(notification.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    }
    setNotificationsOpen(false);
    if (notification.orderId) setActiveTab("orders");
  };

  const handleMarkAllNotificationsRead = async () => {
    const unreadIds = notificationCenter.notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);
    await markAllAdminNotificationsRead(unreadIds);
    await queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
  };

  // Toggle Dark Mode Class on Document root
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("peher-admin-theme");
    const savedSidebar = window.localStorage.getItem("peher-admin-sidebar");
    if (savedTheme === "dark") setDarkMode(true);
    if (savedSidebar === "collapsed") setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem("peher-admin-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    window.localStorage.setItem(
      "peher-admin-sidebar",
      sidebarCollapsed ? "collapsed" : "expanded",
    );
  }, [sidebarCollapsed]);

  // Global Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <OverviewView onNavigate={(t) => setActiveTab(t as AdminTab)} />;
      case "notifications":
        return (
          <NotificationsView
            notifications={notificationCenter.notifications}
            isLoading={notificationCenter.isLoading}
            error={notificationCenter.error}
            connectionState={notificationCenter.connectionState}
            onOpen={handleNotificationOpen}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onRetry={notificationCenter.retry}
          />
        );
      case "products":
        return <ProductsView />;
      case "categories":
        return <CategoriesView />;
      case "orders":
        return <OrdersView />;
      case "customers":
        return <CustomersView />;
      case "analytics":
        return <AnalyticsView />;
      case "sales-reports":
        return <SalesReportsView />;
      case "inventory":
        return <InventoryView />;
      case "coupons":
        return <CouponsView />;
      case "reviews":
        return <ReviewsView />;
      case "marketing":
        return <MarketingView />;
      case "settings":
        return <SettingsView />;
      case "shipping":
        return <ShippingView />;
      case "payments":
        return <PaymentsView />;
      case "taxes":
        return <TaxesView />;
      case "system":
        return <SettingsView />;
      case "users-roles":
        return <UsersRolesView />;
      case "activity-logs":
        return <ActivityLogsView />;
      case "media":
        return <MediaLibraryView />;
      case "seo":
        return <SeoView />;
      case "backup":
        return <BackupView />;
      default:
        return <OverviewView onNavigate={(t) => setActiveTab(t as AdminTab)} />;
    }
  };

  return (
    <div className={`min-h-screen bg-background text-foreground flex transition-colors duration-300 font-sans ${darkMode ? "dark" : ""}`}>
      {/* LEFT COLLAPSIBLE SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-40 bg-card border-r border-border flex flex-col justify-between transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Section */}
        <div>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? "justify-center w-full" : ""}`}>
              <div className="h-9 w-9 shrink-0 rounded-lg bg-neutral-900 p-1">
                <PeherLogo variant="mark" tone="light" className="h-full w-full" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h2 className="font-serif text-xl tracking-[0.2em] font-bold leading-tight">PEHER</h2>
                  <p className="text-[9px] tracking-[0.24em] text-muted-foreground uppercase">ATELIER ADMIN</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {sidebarMenuItems.filter((item) => item.permission === "*" || hasPermission(item.permission)).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badge =
                item.id === "orders"
                  ? pendingOrderCount
                  : item.id === "notifications"
                    ? notificationCenter.unreadCount
                  : item.id === "inventory"
                    ? lowStockCount
                    : 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black shadow-xs"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && badge > 0 && (
                    <span className="ml-auto bg-[#D8E7D2] text-black text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Section */}
        <div className="p-3 border-t border-border bg-muted/20">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
            {adminUser?.avatar ? (
              <img src={adminUser.avatar} alt={adminUser.name} className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-900 p-1"><PeherLogo variant="mark" tone="light" className="h-full w-full" /></div>
            )}
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{adminUser?.name}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{adminUser?.role}</p>
              </div>
            )}
            <button onClick={logout} title="Logout" className="p-2 text-muted-foreground hover:text-red-600 rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground bg-muted/30 hover:bg-muted transition w-48 md:w-80"
            >
              <Search className="w-4 h-4" />
              <span>Search products, orders, customers...</span>
              <kbd className="ml-auto text-[9px] uppercase font-mono bg-border px-1.5 py-0.5 rounded">Ctrl K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Actions Dropdown */}
            <button
              onClick={() => setActiveTab("products")}
              className="hidden sm:inline-flex items-center gap-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-border hover:bg-muted text-foreground transition"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Icon */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg border border-border hover:bg-muted relative text-foreground transition"
                aria-label={`Notifications, ${notificationCenter.unreadCount} unread`}
              >
                <Bell className="w-4 h-4" />
                {notificationCenter.unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[8px] font-bold text-white">
                    {notificationCenter.unreadCount > 99
                      ? "99+"
                      : notificationCenter.unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 space-y-3 fade-up">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                      <p className="font-serif text-lg font-bold">Order Notifications</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        {notificationCenter.connectionState === "live"
                          ? "Realtime connected"
                          : "Polling and retry active"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void handleMarkAllNotificationsRead()}
                        disabled={notificationCenter.unreadCount === 0}
                        title="Mark all read"
                        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => void notificationCenter.retry()}
                        title="Retry notification sync"
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            notificationCenter.connectionState === "retrying"
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      </button>
                      <button onClick={() => setNotificationsOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {notificationCenter.isLoading &&
                      Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} className="h-14 w-full" />
                      ))}
                    {!notificationCenter.isLoading &&
                      notificationCenter.notifications.slice(0, 5).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => void handleNotificationOpen(notification)}
                        className={`w-full rounded-lg p-2.5 text-left transition hover:bg-muted ${
                          notification.isRead ? "bg-muted/30" : "bg-[#D8E7D2]/25"
                        }`}
                      >
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {notification.message} ·{" "}
                          {new Date(notification.createdAt).toLocaleString("en-IN")}
                        </p>
                      </button>
                    ))}
                    {!notificationCenter.isLoading &&
                      notificationCenter.notifications.length === 0 && (
                      <p className="py-5 text-center text-muted-foreground">
                        No order notifications yet.
                      </p>
                    )}
                    {notificationCenter.notifications.length > 5 && (
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          setActiveTab("notifications");
                        }}
                        className="w-full pt-2 text-center text-[10px] font-semibold uppercase tracking-wider underline underline-offset-4"
                      >
                        View all notifications
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* VIEW AREA */}
        <main className="p-6 md:p-8 flex-1">{renderContent()}</main>
      </div>

      {/* GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search products, orders, customers, coupons..."
                className="w-full text-sm outline-none bg-transparent"
              />
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!normalizedSearch && <p className="py-4 text-center text-xs text-muted-foreground">Start typing to search live products and orders.</p>}
              {normalizedSearch && !searchResults.length && <p className="py-4 text-center text-xs text-muted-foreground">No matching products or orders.</p>}
              {searchResults.map((result) => (
                <button key={result.id} onClick={() => { setActiveTab(result.tab); setSearchOpen(false); setSearchQuery(""); }} className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted">
                  <span className="text-sm font-semibold">{result.label}</span>
                  <span className="text-[10px] text-muted-foreground">{result.detail}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
