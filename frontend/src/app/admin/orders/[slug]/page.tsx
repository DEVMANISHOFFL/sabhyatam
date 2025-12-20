"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getAdminOrderDetail, updateOrderStatus, type AdminOrder } from "@/lib/admin-api"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, Box, Truck, MapPin, Mail, Phone, Calendar, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) load()
  }, [id])

  async function load() {
    try {
      const data = await getAdminOrderDetail(id as string)
      setOrder(data)
    } catch (e) {
      alert("Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Mark order as ${newStatus}?`)) return
    setUpdating(true)
    try {
      await updateOrderStatus(id as string, newStatus)
      await load() // Reload to confirm
    } catch (e) {
      alert("Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Loading details...</div>
  if (!order) return <div className="p-12 text-center">Order not found</div>

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link href="/admin/orders" className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
           <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 flex items-center gap-3">
                 Order #{order.id.slice(0, 8)}
                 <span className="text-sm font-sans font-bold px-3 py-1 bg-gray-200 rounded-full text-gray-700 uppercase tracking-wider">
                    {order.status}
                 </span>
              </h1>
              <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
                 <Calendar className="w-4 h-4" /> 
                 Placed on {new Date(order.created_at).toLocaleString()}
              </p>
           </div>
           
           {/* Workflow Actions */}
           <div className="flex gap-3">
              {order.status === "paid" && (
                 <button 
                   onClick={() => handleStatusChange("shipped")}
                   disabled={updating}
                   className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 transition"
                 >
                    <Truck className="w-4 h-4" /> Mark Shipped
                 </button>
              )}
              {order.status === "shipped" && (
                 <button 
                   onClick={() => handleStatusChange("delivered")}
                   disabled={updating}
                   className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 flex items-center gap-2 transition"
                 >
                    <CheckCircle className="w-4 h-4" /> Mark Delivered
                 </button>
              )}
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        
        {/* Left Column: Order Items */}
        <div className="md:col-span-2 space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 font-bold text-gray-900 flex items-center gap-2">
                 <Box className="w-4 h-4" /> Items ({order.items.length})
              </div>
              <div className="divide-y divide-gray-100">
                 {order.items.map((item, idx) => (
                    <div key={idx} className="p-6 flex gap-4">
                       <div className="w-16 h-20 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
                          {/* Placeholder if image missing */}
                          <img 
                            src={item.product_image || "/placeholder.svg"} 
                            className="w-full h-full object-cover" 
                          />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.product_title || "Product Name"}</h4>
                          <p className="text-sm text-gray-500">ID: {item.product_id}</p>
                          <div className="mt-2 text-sm">
                             <span className="font-bold">{item.quantity}</span> x {formatPrice(item.price_cents / 100)}
                          </div>
                       </div>
                       <div className="font-bold text-gray-900">
                          {formatPrice((item.price_cents * item.quantity) / 100)}
                       </div>
                    </div>
                 ))}
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                 <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.total_amount_cents / 100)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                 </div>
                 <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount_cents / 100)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Customer Info */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-gray-400" /> Shipping Details
              </h3>
              
              <div className="space-y-4 text-sm">
                 <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Customer</p>
                    <p className="font-medium">{order.customer_name || "Guest"}</p>
                 </div>
                 
                 <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Contact</p>
                    <div className="flex items-center gap-2 text-gray-700">
                       <Mail className="w-3 h-3" /> {order.customer_email || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 mt-1">
                       <Phone className="w-3 h-3" /> {order.customer_phone || "N/A"}
                    </div>
                 </div>

                 <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Address</p>
                    {order.shipping_address ? (
                       <div className="text-gray-700 leading-relaxed">
                          <p>{order.shipping_address.line1}</p>
                          <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                          <p>{order.shipping_address.postal_code}</p>
                       </div>
                    ) : (
                       <p className="text-gray-400 italic">No address provided</p>
                    )}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}