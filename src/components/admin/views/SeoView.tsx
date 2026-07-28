import { useState } from "react";
import { Globe, FileText, CheckCircle2 } from "lucide-react";

export function SeoView() {
  const [metaTitle, setMetaTitle] = useState("PEHER — Handcrafted Luxury Jewellery by Vasudha Tiwari");
  const [metaDescription, setMetaDescription] = useState("Discover handcrafted 18k gold & silver rings, necklaces, bracelets, and earrings. Shipped across India.");
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">SEO & Search Engine Indexing</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Open Graph social preview cards, XML sitemap generation, canonical URLs, and meta tags.
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-xl shadow-xs space-y-4">
        <h3 className="font-serif text-2xl">Global Search Engine Meta Tags</h3>
        <div className="space-y-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Global SEO Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full border border-border rounded-lg p-2.5 outline-none font-serif text-sm bg-transparent"
            />
          </div>
          <div>
            <label className="block uppercase tracking-wider font-semibold text-muted-foreground mb-1 text-[10px]">Global Meta Description</label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full border border-border rounded-lg p-2.5 outline-none bg-transparent resize-none"
            />
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Google Search Result Live Preview</p>
            <p className="text-sm font-medium text-blue-700 hover:underline cursor-pointer">{metaTitle}</p>
            <p className="text-[11px] text-emerald-700">https://peher.studio</p>
            <p className="text-xs text-foreground/80">{metaDescription}</p>
          </div>
        </div>

        {saved && <p className="text-xs text-emerald-600 font-semibold">✓ SEO settings saved.</p>}

        <div className="flex justify-end">
          <button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }}
            className="bg-neutral-900 text-white px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition"
          >
            Save Meta Settings
          </button>
        </div>
      </div>
    </div>
  );
}
