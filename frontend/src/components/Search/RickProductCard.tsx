"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Loader2 } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { emitCartUpdated } from "@/lib/cart-events";
import { fetchRatingSummary, RatingSummary } from "@/lib/api-reviews";

// Helper for currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
};

export default function RichProductCard({ item }: { item: any }) {
  const [ratingStats, setRatingStats] = useState<RatingSummary>({ average: 0, count: 0 });
  const [adding, setAdding] = useState(false);

  // 1. Fetch Real Ratings on Mount
  useEffect(() => {
    if (item.id) {
      fetchRatingSummary(item.id).then(setRatingStats);
    }
  }, [item.id]);

  // 2. Handle Quick Add
  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    setAdding(true);
    try {
      await addToCart({ product_id: item.id, quantity: 1 });
      emitCartUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  // --- FIXED DISCOUNT LOGIC (Matches PDP Reference) ---
  const price = Number(item.price) || 0;
  const mrp = Number(item.mrp) || 0;
  
  // Only calculate discount if MRP is strictly greater than Price
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Link href={`/product/${item.slug}`} className="group block h-full flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-lg mb-4">
        
        {/* IMAGE */}
        {item.image_url || item.image ? (
          <img
            src={item.image_url || item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-300">
            <ShoppingBag className="w-8 h-8 opacity-20" />
          </div>
        )}

        {/* BADGES: Only show if discount > 0 */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded-sm shadow-sm">
            {discount}% OFF
          </span>
        )}

        {/* ACTION OVERLAYS */}
        <button className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full text-gray-600 hover:text-rose-600 hover:bg-white transition shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 z-10">
          <Heart className="w-4 h-4" />
        </button>

        {/* QUICK ADD (Desktop) */}
        <div className="absolute inset-x-3 bottom-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
          <button 
            onClick={handleQuickAdd}
            disabled={adding}
            className="w-full bg-white text-gray-900 font-bold text-xs uppercase py-3 rounded shadow-lg hover:bg-gray-900 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
          >
            {adding ? <Loader2 className="w-3 h-3 animate-spin"/> : <ShoppingBag className="w-3 h-3" />} 
            {adding ? "Adding..." : "Quick Add"}
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="flex-1 flex flex-col">
        {/* Real Rating Display */}
        <div className="flex items-center gap-1 mb-1 h-4">
          {ratingStats.count > 0 ? (
            <>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] text-gray-500 font-medium">
                {ratingStats.average.toFixed(1)} ({ratingStats.count})
              </span>
            </>
          ) : (
             <span className="text-[10px] text-gray-300">No reviews</span>
          )}
        </div>

        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-rose-700 transition leading-snug mb-1">
          {item.title}
        </h3>
        
        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
        
        <div className="mt-auto flex items-baseline gap-2">
          {/* SELLING PRICE */}
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(price)}
          </span>

          {/* MRP (Strikethrough) - Only if discount exists */}
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(mrp)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}