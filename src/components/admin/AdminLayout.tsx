import { useState, useEffect } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { OverviewView } from "./views/OverviewView";
import { ProductsView } from "./views/ProductsView";
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
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag, badge: "3" },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "customers", label: "Customers", icon: Users },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "inventory", label: "Inventory", icon: Warehouse, badge: "2" },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "sales-reports", label: "Sales Reports", icon: FileSpreadsheet },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Website Settings", icon: Settings },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "taxes", label: "Taxes", icon: Percent },
  { id: "users-roles", label: "Users & Roles", icon: ShieldCheck },
  { id: "activity-logs", label: "Activity Logs", icon: History },
  { id: "media", label: "Media Library", icon: ImageIcon },
  { id: "seo", label: "SEO", icon: Globe },
  { id: "backup", label: "Backup & Restore", icon: Database },
];

export function AdminLayout() {
  const { adminUser, logout, hasPermission } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Toggle Dark Mode Class on Document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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
      case "notifications":
        return <OverviewView onNavigate={(t) => setActiveTab(t as AdminTab)} />;
      case "products":
      case "categories":
        return <ProductsView />;
      case "orders":
        return <OrdersView />;
      case "customers":
        return <CustomersView />;
      case "analytics":
      case "sales-reports":
        return <AnalyticsView />;
      case "inventory":
        return <InventoryView />;
      case "coupons":
        return <CouponsView />;
      case "reviews":
        return <ReviewsView />;
      case "marketing":
        return <MarketingView />;
      case "settings":
      case "shipping":
      case "payments":
      case "taxes":
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
              <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-serif text-lg font-bold shrink-0">
                P
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
            {sidebarMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
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
                  {!sidebarCollapsed && item.badge && (
                    <span className="ml-auto bg-[#D8E7D2] text-black text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
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
            <img
              src={adminUser?.avatar}
              alt={adminUser?.name}
              className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
            />
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
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 space-y-3 fade-up">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <p className="font-serif text-lg font-bold">Notifications</p>
                    <button onClick={() => setNotificationsOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40">
                      <p className="font-semibold text-foreground">New Order Received (#PH-9043)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">₹6,324 by Vikramaditya Roy · 10m ago</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-900 dark:text-amber-300">
                      <p className="font-semibold">Low Stock Warning: Tide Emerald Ring</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Only 4 units remaining in stock.</p>
                    </div>
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
            <div className="text-xs text-muted-foreground py-4 text-center">
              {searchQuery.trim() ? (
                <p>Showing instant matches for "{searchQuery}" across products and orders.</p>
              ) : (
                <p>Start typing to instantly query the atelier database.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
