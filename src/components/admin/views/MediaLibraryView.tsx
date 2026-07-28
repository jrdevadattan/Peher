import { useState } from "react";
import { products } from "@/data/products";
import { UploadCloud, Image as ImageIcon, Folder, Trash2 } from "lucide-react";

export function MediaLibraryView() {
  const images = products.map((p, idx) => ({
    id: `m-${idx}`,
    name: `${p.id}.jpg`,
    url: p.image,
    size: "1.2 MB",
    dimensions: "1200 x 1500 px",
  }));

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Atelier Media Asset Library</h1>
          <p className="text-xs text-muted-foreground mt-1">
            High-resolution product lookbooks, campaign editorial shots, and hero banners.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition">
          <UploadCloud className="w-4 h-4" /> Upload New Assets
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((img) => (
          <div key={img.id} className="group bg-card border border-border rounded-xl overflow-hidden shadow-xs relative">
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-3 text-[10px] space-y-0.5">
              <p className="font-semibold text-foreground truncate">{img.name}</p>
              <p className="text-muted-foreground">{img.dimensions} · {img.size}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
