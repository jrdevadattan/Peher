import { useState } from "react";
import { AdminStore, type AdminProduct } from "@/lib/admin-store";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

export function ProductsView() {
  const [products, setProducts] = useState<AdminProduct[]>(AdminStore.products);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<AdminProduct | null>(null);

  // Filtered List
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.material.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filtered.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filtered.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      AdminStore.products = updated;
    }
  };

  const handleDuplicateProduct = (p: AdminProduct) => {
    const dup: AdminProduct = {
      ...p,
      id: `p-${Date.now()}`,
      sku: `${p.sku}-COPY`,
      name: `${p.name} (Copy)`,
      status: "Draft",
    };
    const updated = [dup, ...products];
    setProducts(updated);
    AdminStore.products = updated;
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedProductIds.length} selected product(s)?`)) {
      const updated = products.filter((p) => !selectedProductIds.includes(p.id));
      setProducts(updated);
      AdminStore.products = updated;
      setSelectedProductIds([]);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (isCreating) {
      const updated = [editingProduct, ...products];
      setProducts(updated);
      AdminStore.products = updated;
    } else {
      const updated = products.map((p) => (p.id === editingProduct.id ? editingProduct : p));
      setProducts(updated);
      AdminStore.products = updated;
    }

    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleExportCSV = () => {
    const headers = "SKU,Name,Category,Price,CostPrice,Stock,Status\n";
    const rows = filtered.map((p) => `${p.sku},"${p.name}",${p.category},${p.price},${p.costPrice},${p.stock},${p.status}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peher-products-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Product Catalogue</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage inventory items, pricing, SKU variants, and rich media galleries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 border border-border px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => {
              setEditingProduct({
                id: `prod-${Date.now()}`,
                name: "",
                sku: `PEHER-${Math.floor(1000 + Math.random() * 9000)}`,
                brand: "PEHER Atelier",
                category: "Rings",
                subcategory: "High Jewelry",
                price: 2500,
                costPrice: 1100,
                originalPrice: 3200,
                material: "18k Gold Vermeil",
                stock: 20,
                weight: "12g",
                dimensions: "2.0 x 2.0 cm",
                tags: ["Luxe"],
                description: "",
                shortDescription: "",
                seoTitle: "",
                seoDescription: "",
                urlSlug: "",
                status: "Published",
                isFeatured: false,
                isTrending: false,
                isBestseller: false,
                tax: 3,
                shippingClass: "Standard",
                variants: [],
                barcode: "8900000000",
                supplier: "Atelier Guild",
                relatedProducts: [],
                image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
              });
              setIsCreating(true);
            }}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by SKU, product name, or material..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-xs outline-none focus:border-black bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" /> Category:
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-xs outline-none bg-transparent"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            Status:
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-xs outline-none bg-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {selectedProductIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition"
            >
              Delete Selected ({selectedProductIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === filtered.length && filtered.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-border cursor-pointer"
                  />
                </th>
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => handleToggleSelect(p.id)}
                        className="rounded border-border cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-12 object-cover rounded bg-muted" />
                        <div>
                          <p className="font-semibold text-sm text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.material}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] font-medium text-foreground/80">{p.sku}</td>
                    <td className="p-4 font-medium">{p.category}</td>
                    <td className="p-4">
                      <span className="font-serif text-sm font-semibold">₹{p.price.toLocaleString("en-IN")}</span>
                      {p.originalPrice && (
                        <span className="ml-2 text-[10px] text-muted-foreground line-through">
                          ₹{p.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          p.stock > 10
                            ? "bg-emerald-100 text-emerald-800"
                            : p.stock > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.stock > 0 ? `${p.stock} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`uppercase tracking-wider font-semibold text-[9px] px-2.5 py-1 rounded-full ${
                          p.status === "Published"
                            ? "bg-[#D8E7D2] text-black"
                            : p.status === "Draft"
                            ? "bg-neutral-200 text-neutral-800"
                            : "bg-neutral-800 text-white"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewProduct(p)}
                          title="Preview"
                          className="p-1.5 hover:bg-neutral-200 rounded text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsCreating(false);
                          }}
                          title="Edit"
                          className="p-1.5 hover:bg-neutral-200 rounded text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateProduct(p)}
                          title="Duplicate"
                          className="p-1.5 hover:bg-neutral-200 rounded text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          title="Delete"
                          className="p-1.5 hover:bg-red-100 text-muted-foreground hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Product Modal Drawer */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end overflow-y-auto">
          <div className="bg-card w-full max-w-2xl min-h-screen p-6 md:p-8 space-y-6 shadow-2xl border-l border-border overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Product Editor</p>
                <h2 className="font-serif text-2xl mt-0.5">
                  {isCreating ? "Add New Atelier Piece" : `Edit ${editingProduct.name}`}
                </h2>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Product Basic Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent"
                  >
                    <option value="Rings">Rings</option>
                    <option value="Necklaces">Necklaces</option>
                    <option value="Bracelets">Bracelets</option>
                    <option value="Earrings">Earrings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Product Image Upload Section */}
              <div className="border border-dashed border-border rounded-xl p-6 text-center space-y-3 bg-muted/20">
                <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold">Drag & Drop Product Images</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Supports PNG, JPG, WebP up to 10MB</p>
                </div>
                <div className="flex justify-center gap-3">
                  <img src={editingProduct.image} alt="" className="w-16 h-20 object-cover rounded border border-border" />
                  {editingProduct.imageHover && (
                    <img src={editingProduct.imageHover} alt="" className="w-16 h-20 object-cover rounded border border-border" />
                  )}
                </div>
              </div>

              {/* Material & Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Material & Finish</label>
                <input
                  type="text"
                  value={editingProduct.material}
                  onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                  className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full border border-border rounded-lg p-2.5 text-xs outline-none focus:border-black bg-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 border border-border rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-xs uppercase tracking-wider font-semibold hover:bg-[#D8E7D2] hover:text-black transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setPreviewProduct(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-4 items-start">
              <img src={previewProduct.image} alt={previewProduct.name} className="w-28 h-36 object-cover rounded-lg border border-border" />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{previewProduct.category}</span>
                <h3 className="font-serif text-2xl mt-1">{previewProduct.name}</h3>
                <p className="font-serif text-xl mt-2 font-semibold">₹{previewProduct.price.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-2">{previewProduct.material}</p>
                <p className="text-xs font-mono mt-1">SKU: {previewProduct.sku}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-foreground/80 pt-2 border-t border-border">{previewProduct.description || "Handcrafted luxury jewelry piece by PEHER."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
