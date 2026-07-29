const supabase = require("../lib/supabase");

const ROLE_PERMISSIONS = {
  Owner: ["*"],
  Admin: ["*"],
  Manager: [
    "products",
    "orders",
    "customers",
    "coupons",
    "inventory",
    "reviews",
    "analytics",
    "marketing",
    "shipping",
    "payments",
    "taxes",
    "media",
    "seo",
    "settings",
    "categories",
  ],
  "Inventory Manager": ["products", "inventory", "media", "categories"],
  "Order Manager": ["orders", "customers", "shipping", "payments"],
  "Customer Support": ["orders", "customers", "reviews"],
  Marketing: ["coupons", "analytics", "marketing", "media", "seo"],
  Editor: ["products", "categories", "media", "seo"],
};

function requirePermission(permission) {
  return async (req, res, next) => {
    const { data: membership, error } = await supabase
      .from("admin_users")
      .select("display_name, email, role, permissions, is_active")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: "Could not verify admin permissions" });
    }
    if (!membership?.is_active) {
      return res.status(403).json({ error: "Admin access is not active" });
    }

    const permissions = membership.permissions?.length
      ? membership.permissions
      : ROLE_PERMISSIONS[membership.role] || [];
    if (!permissions.includes("*") && !permissions.includes(permission)) {
      return res.status(403).json({ error: "You do not have permission for this action" });
    }

    req.admin = membership;
    next();
  };
}

module.exports = requirePermission;
