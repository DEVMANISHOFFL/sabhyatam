"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Order } from "@/lib/types"
import { fetchMyOrders } from "@/lib/user-api" 
import { addToCart } from "@/lib/cart" 
import { ShoppingBag, RefreshCw, Package } from "lucide-react"

export default function OrderHistory({ token, userId }: { token: string, userId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && userId) {
      fetchMyOrders(token, userId)
        .then((data) => {
          // Safety check: ensure data is an array
          setOrders(Array.isArray(data) ? data : [])
        })
        .catch(err => console.error("Failed to load orders:", err))
        .finally(() => setLoading(false))
    }
  }, [token, userId])

  if (loading) {
    return <OrderSkeleton />
  }

  // ✅ Empty State
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500">
        <ShoppingBag className="mx-auto mb-3 opacity-20" size={48} />
        <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
        <p className="text-sm text-gray-500 mb-6">Looks like you haven&apos;t placed any orders yet.</p>
        <Link 
          href="/" 
          className="inline-block bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-lg font-bold text-gray-900">Order History</h3>
         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{orders.length} Orders</span>
      </div>
      
      {orders.map((order) => {
        // Handle database casing (Go usually sends snake_case in JSON if configured, or matching struct fields)
        // We assume your type uses total_amount_cents
        const total = order.total_amount || (order as any).total_amount || 0;
        
        return (
          <div key={order.id} className="border border-gray-200 rounded-xl p-5 hover:border-black transition-colors bg-white group">
            
            {/* Header: ID, Date, Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">#{order.id.slice(0, 8)}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <StatusBadge status={order.status} />
                 <p className="text-sm font-bold text-gray-900">
                   {/* Convert Cents to Rupee */}
                   ₹{(total / 100).toLocaleString("en-IN")}
                 </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {/* Added optional chaining '?' in case items is null */}
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-gray-100 rounded-md shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                         {item.product_image ? (
                           <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <Package className="text-gray-400" size={16} /> 
                         )}
                      </div>
                      <div className="min-w-0">
                         {/* Fallback to 'Product' if title is missing from raw SQL query */}
                         <p className="text-sm font-medium text-gray-900 truncate">
                           {item.product_title || `Product ${item.product_id?.slice(0,6)}...`}
                         </p>
                         <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                   </div>
                   
                   {/* Buy Again Action */}
                   <button 
                      onClick={() => addToCart({ product_id: item.product_id, quantity: 1 })}
                      className="shrink-0 text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 hover:bg-pink-100 px-2 py-1.5 rounded transition"
                   >
                      <RefreshCw size={12} /> Buy Again
                   </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper: Status Badge Styling
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    paid: "bg-blue-100 text-blue-800", // Added 'paid' as it's common in backend
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

// Helper: Skeleton Loader
function OrderSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
      {[1, 2].map((i) => (
        <div key={i} className="h-40 bg-gray-100 rounded-xl border border-gray-200"></div>
      ))}
    </div>
  )
}