import { useState } from "react";
import { Store, CreditCard, Truck, Percent, Lock, Save, Globe } from "lucide-react";

export function SettingsView() {
  const [storeName, setStoreName] = useState("PEHER");
  const [tagline, setTagline] = useState("Extra is our love language.");
  const [contactEmail, setContactEmail] = useState("hello@peher.studio");
  const [currency, setCurrency] = useState("INR (₹)");
  const [gstPercentage, setGstPercentage] = useState(3);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1500);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">System & Store Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure branding, tax compliance rules, shipping thresholds, and payment options.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Brand & Store Info */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
          <h3 className="font-serif text-2xl flex items-center gap-2">
            <Store className="w-5 h-5" /> Brand Identity & Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-border rounded-lg p-2.5 outline-none font-serif text-sm font-semibold bg-transparent"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full border border-border rounded-lg p-2.5 outline-none bg-transparent"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-border rounded-lg p-2.5 outline-none bg-transparent"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Currency</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full border border-border rounded-lg p-2.5 outline-none bg-muted/40 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Taxes & Shipping */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
          <h3 className="font-serif text-2xl flex items-center gap-2">
            <Truck className="w-5 h-5" /> Tax & Shipping Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">GST Rate (%)</label>
              <input
                type="number"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(Number(e.target.value))}
                className="w-full border border-border rounded-lg p-2.5 outline-none font-bold bg-transparent"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Free Shipping Order Minimum (₹)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full border border-border rounded-lg p-2.5 outline-none font-bold bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl">Store Maintenance Mode</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Temporarily display a coming soon banner on the customer storefront.</p>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              maintenanceMode ? "bg-amber-600 text-white" : "border border-border hover:bg-neutral-100"
            }`}
          >
            {maintenanceMode ? "Maintenance Active" : "Store Online"}
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded-lg font-semibold">
            ✓ Store settings updated successfully.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
