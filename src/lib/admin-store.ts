import { products as initialProducts } from "@/data/products";
import type { Product } from "@/components/ProductCard";

export type AdminProduct = Product & {
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  shortDescription: string;
  costPrice: number;
  stock: number;
  weight: string;
  dimensions: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  urlSlug: string;
  status: "Published" | "Draft" | "Archived" | "Hidden";
  isFeatured: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  tax: number; // percentage
  shippingClass: string;
  variants: { size?: string; color?: string; price: number; stock: number; sku: string }[];
  barcode: string;
  supplier: string;
  relatedProducts: string[];
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: { productId: string; name: string; price: number; qty: number; size?: string; image: string }[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending" | "Refunded" | "Failed";
  deliveryStatus: "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
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
  status: "Active" | "Expired" | "Disabled";
};

export type AdminReview = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
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

export type MediaFile = {
  id: string;
  name: string;
  url: string;
  size: string;
  dimensions: string;
  uploadDate: string;
  folder: string;
};

// Default Sample Data
const SAMPLE_ADMIN_PRODUCTS: AdminProduct[] = initialProducts.map((p, idx) => ({
  ...p,
  sku: `PEHER-${1000 + idx}`,
  brand: "PEHER Atelier",
  category: idx % 2 === 0 ? "Rings" : idx % 3 === 0 ? "Necklaces" : "Earrings",
  subcategory: "Luxe Heritage",
  description: "Hand-finished piece formed with quiet precision. Designed for everyday statement and stacking.",
  shortDescription: "Handcrafted 18k Gold & Vermeil luxury jewelry.",
  costPrice: Math.round(p.price * 0.45),
  stock: p.outOfStock ? 0 : 25 + (idx * 7) % 30,
  weight: "14g",
  dimensions: "2.5 x 2.5 x 1.0 cm",
  tags: ["Luxe", "Handcrafted", "Gold", "Bestseller"],
  seoTitle: `${p.name} — PEHER Luxury Jewellery`,
  seoDescription: `Shop the ${p.name} handcrafted by Vasudha Tiwari. Premium Indian luxury jewelry.`,
  urlSlug: p.id,
  status: p.outOfStock ? "Draft" : "Published",
  isFeatured: idx < 3,
  isTrending: idx % 2 === 0,
  isBestseller: p.badge === "Bestseller",
  tax: 3, // 3% GST on gold/jewelry
  shippingClass: "Standard Complimentary",
  variants: [
    { size: "6", price: p.price, stock: 10, sku: `PEHER-${1000 + idx}-S6` },
    { size: "7", price: p.price, stock: 15, sku: `PEHER-${1000 + idx}-S7` },
    { size: "8", price: p.price, stock: 8, sku: `PEHER-${1000 + idx}-S8` },
  ],
  barcode: `89012345${1000 + idx}`,
  supplier: "Mehrauli Artisan Guild",
  relatedProducts: ["tide-emerald", "pearl-embrace"],
}));

const SAMPLE_ORDERS: AdminOrder[] = [
  {
    id: "ord-9041",
    orderNumber: "#PH-9041",
    customerName: "Ananya Sharma",
    customerEmail: "ananya.sharma@example.com",
    customerPhone: "+91 98765 43210",
    shippingAddress: "Flat 402, Lotus Apartments, Indiranagar, Bengaluru, 560038",
    items: [
      { productId: "tide-emerald", name: "Tide Emerald Ring", price: 2400, qty: 1, size: "7", image: initialProducts[0].image },
      { productId: "linen-chain", name: "Linen Chain Bracelet", price: 1600, qty: 1, image: initialProducts[2].image },
    ],
    subtotal: 4000,
    shippingCost: 0,
    taxAmount: 120,
    discountAmount: 400,
    total: 3720,
    orderDate: "2026-07-27T14:32:00Z",
    paymentMethod: "Razorpay (UPI)",
    paymentStatus: "Paid",
    deliveryStatus: "Shipped",
    trackingNumber: "BLRD-99214-IN",
    courierName: "BlueDart Express",
    timeline: [
      { title: "Order Placed", timestamp: "2026-07-27T14:32:00Z" },
      { title: "Payment Verified via Razorpay", timestamp: "2026-07-27T14:33:15Z" },
      { title: "Order Packed at Mehrauli Atelier", timestamp: "2026-07-27T17:10:00Z" },
      { title: "Handed over to BlueDart", timestamp: "2026-07-28T09:00:00Z" },
    ],
  },
  {
    id: "ord-9042",
    orderNumber: "#PH-9042",
    customerName: "Rhea Malhotra",
    customerEmail: "rhea.m@example.com",
    customerPhone: "+91 99887 66554",
    shippingAddress: "B-12, Panchsheel Enclave, New Delhi, 110017",
    items: [{ productId: "sable-ring", name: "Sable Signet Ring", price: 2900, qty: 1, size: "8", image: initialProducts[4].image }],
    subtotal: 2900,
    shippingCost: 0,
    taxAmount: 87,
    discountAmount: 0,
    total: 2987,
    orderDate: "2026-07-27T19:15:00Z",
    paymentMethod: "Credit Card (HDFC)",
    paymentStatus: "Paid",
    deliveryStatus: "Packed",
    timeline: [
      { title: "Order Placed", timestamp: "2026-07-27T19:15:00Z" },
      { title: "Payment Verified", timestamp: "2026-07-27T19:16:05Z" },
      { title: "Quality Check & Packing Complete", timestamp: "2026-07-28T08:30:00Z" },
    ],
  },
  {
    id: "ord-9043",
    orderNumber: "#PH-9043",
    customerName: "Vikramaditya Roy",
    customerEmail: "v.roy@example.com",
    customerPhone: "+91 97112 33445",
    shippingAddress: "Villa 14, Jubilee Hills, Hyderabad, 500033",
    items: [{ productId: "mira-cuff", name: "Mira Cuff", price: 3400, qty: 2, image: initialProducts[6].image }],
    subtotal: 6800,
    shippingCost: 0,
    taxAmount: 204,
    discountAmount: 680,
    total: 6324,
    orderDate: "2026-07-26T11:05:00Z",
    paymentMethod: "Razorpay (Netbanking)",
    paymentStatus: "Paid",
    deliveryStatus: "Delivered",
    trackingNumber: "HYD-88123-IN",
    courierName: "Delhivery Premium",
    timeline: [
      { title: "Order Placed", timestamp: "2026-07-26T11:05:00Z" },
      { title: "Shipped", timestamp: "2026-07-26T16:00:00Z" },
      { title: "Delivered", timestamp: "2026-07-27T16:45:00Z" },
    ],
  },
];

const SAMPLE_CUSTOMERS: AdminCustomer[] = [
  {
    id: "cust-101",
    name: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    phone: "+91 98765 43210",
    address: "Bengaluru, Karnataka",
    totalOrders: 4,
    totalSpent: 18400,
    registrationDate: "2026-01-15",
    lastLogin: "2026-07-27",
    status: "Active",
    tags: ["VIP", "Repeat Buyer"],
  },
  {
    id: "cust-102",
    name: "Rhea Malhotra",
    email: "rhea.m@example.com",
    phone: "+91 99887 66554",
    address: "New Delhi, Delhi",
    totalOrders: 2,
    totalSpent: 7800,
    registrationDate: "2026-03-02",
    lastLogin: "2026-07-27",
    status: "Active",
    tags: ["Jewelry Collector"],
  },
  {
    id: "cust-103",
    name: "Ishita Kulkarni",
    email: "ishita.k@example.com",
    phone: "+91 96543 21098",
    address: "Mumbai, Maharashtra",
    totalOrders: 5,
    totalSpent: 24500,
    registrationDate: "2025-11-20",
    lastLogin: "2026-07-25",
    status: "Active",
    tags: ["VIP", "High Spender"],
  },
];

const SAMPLE_COUPONS: AdminCoupon[] = [
  { id: "c-1", code: "PEHER10", type: "Percentage", value: 10, minPurchase: 2000, expiryDate: "2026-12-31", usageLimit: 500, usageCount: 142, status: "Active" },
  { id: "c-2", code: "EXTRAFLAT500", type: "Flat", value: 500, minPurchase: 3500, expiryDate: "2026-09-30", usageLimit: 200, usageCount: 89, status: "Active" },
  { id: "c-3", code: "FREESHIP", type: "FreeShipping", value: 0, minPurchase: 1000, expiryDate: "2026-12-31", usageLimit: 1000, usageCount: 654, status: "Active" },
];

const SAMPLE_REVIEWS: AdminReview[] = [
  { id: "r-1", productId: "tide-emerald", productName: "Tide Emerald Ring", customerName: "Ananya S.", customerEmail: "ananya.sharma@example.com", rating: 5, comment: "Even more beautiful in person. Feels like a keepsake.", date: "2026-07-20", status: "Approved" },
  { id: "r-2", productId: "linen-chain", productName: "Linen Chain Bracelet", customerName: "Rhea M.", customerEmail: "rhea.m@example.com", rating: 5, comment: "The finish is quiet and considered. I wear it every day.", date: "2026-07-22", status: "Approved", reply: "Thank you Rhea! We are delighted that it complements your daily stack." },
  { id: "r-3", productId: "sable-ring", productName: "Sable Signet Ring", customerName: "Ishita K.", customerEmail: "ishita.k@example.com", rating: 5, comment: "A gift for myself I never take off.", date: "2026-07-24", status: "Approved" },
];

const SAMPLE_LOGS: ActivityLog[] = [
  { id: "log-1", timestamp: "2026-07-28 00:15:22", userName: "Vasudha Tiwari", userRole: "Owner", action: "Product Published", details: "Published 'Tide Emerald Ring' with stock 25", ipAddress: "103.22.45.12" },
  { id: "log-2", timestamp: "2026-07-27 19:16:05", userName: "System Automation", userRole: "System", action: "Order Processed", details: "Payment confirmed for Order #PH-9042", ipAddress: "127.0.0.1" },
  { id: "log-3", timestamp: "2026-07-27 17:10:00", userName: "Inventory Admin", userRole: "Manager", action: "Stock Adjusted", details: "Reduced stock for Linen Chain Bracelet (-1)", ipAddress: "103.22.45.14" },
];

export class AdminStore {
  static products: AdminProduct[] = SAMPLE_ADMIN_PRODUCTS;
  static orders: AdminOrder[] = SAMPLE_ORDERS;
  static customers: AdminCustomer[] = SAMPLE_CUSTOMERS;
  static coupons: AdminCoupon[] = SAMPLE_COUPONS;
  static reviews: AdminReview[] = SAMPLE_REVIEWS;
  static logs: ActivityLog[] = SAMPLE_LOGS;

  static logAction(userName: string, role: string, action: string, details: string) {
    this.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName,
      userRole: role,
      action,
      details,
      ipAddress: "103.24.11.88",
    });
  }
}
