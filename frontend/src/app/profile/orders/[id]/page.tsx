"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { Order } from "@/lib/types";
import { ArrowLeft, MapPin, Package, Calendar, Loader2, AlertCircle } from "lucide-react";
import { fetchMyOrders } from "@/lib/user-api"; 

export default function OrderDetailPage() {
  // useParams can return string | string[], force it to string
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    // Redirect if not logged in
    if (!token || !user) {
      router.push("/login");
      return;
    }

    if (!id) return;

    // MVP Approach: Fetch all orders and filter locally
    // (Ideally backend should have GET /v1/orders/{id} with ownership check)
    fetchMyOrders(token, user.id)
      .then((orders) => {
        // Ensure orders is an array before searching
        const list = Array.isArray(orders) ? orders : [];
        const found = list.find((o) => o.id === id);
        if (found) setOrder(found);
      })
      .catch((err) => console.error("Error fetching order details:", err))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, id, router]);

  // --- Loading State ---
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // --- Not Found State ---
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900">Order not found</h1>
        <button onClick={() => router.back()} className="text-pink-600 font-bold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  // --- Data Normalization ---
  // Handle casing differences between potential Type definitions and Backend JSON
  const totalAmount = order.total_amount || (order as any).total_amount || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-serif font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  getStatusColor(order.status)
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <Calendar size={14} /> 
                Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{(totalAmount / 100).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={20} /> Items
          </h2>
          <div className="space-y-6">
            {order.items?.map((item, idx) => {
              // Calculate prices (assuming price_cents is per unit)
              const unitPrice = item.unit_price || (item as any).unit_price || 0;
              const lineTotal = unitPrice * item.quantity;
              
              return (
                <div key={idx} className="flex gap-4 border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                  {/* Image Placeholder or Actual Image */}
                  <div className="w-20 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                     {item.product_image ? (
                       <img src={item.product_image} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <Package className="text-gray-300" />
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {item.product_title || `Product ID: ${item.product_id}`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>Qty: <span className="font-bold text-gray-900">{item.quantity}</span></span>
                      <span>Rate: ₹{(unitPrice / 100).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{(lineTotal / 100).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Address Section */}
        {/* Only render if address exists (Currently backend might not be returning this join) */}
        {order.shipping_address ? (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} /> Delivery Address
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="font-bold text-gray-900 mb-1">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.line1}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
              <p className="mt-2 font-medium text-gray-900">Phone: {order.shipping_address.phone}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm opacity-60">
             <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <MapPin size={20} /> Delivery Address
            </h2>
            <p className="text-sm text-gray-500 italic">Address details not available for this order.</p>
          </div>
        )}

      </div>
    </div>
  );
}

// Helper for status colors
function getStatusColor(status: string) {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-purple-100 text-purple-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'paid': return 'bg-blue-100 text-blue-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}