"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAdminOrders, type AdminOrder } from "@/lib/admin-api"
import { formatPrice } from "@/lib/utils"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  Search,
  Filter
} from "lucide-react"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadOrders()
  }, [statusFilter, page])

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await getAdminOrders({ page, limit: 15, status: statusFilter })
      setOrders(data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helper for Status Badges
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-gray-100 text-gray-700",
      paid: "bg-blue-50 text-blue-700 border-blue-200",
      processing: "bg-yellow-50 text-yellow-700 border-yellow-200",
      shipped: "bg-purple-50 text-purple-700 border-purple-200",
      delivered: "bg-green-50 text-green-700 border-green-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    }

    const icons: Record<string, any> = {
      pending: Clock,
      paid: CheckCircle,
      shipped: Truck,
      delivered: Package,
      cancelled: XCircle,
    }
    
    const Icon = icons[status] || Clock

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status] || styles.pending}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-serif font-bold text-gray-900">Order Management</h1>
           <p className="text-sm text-gray-500">View and manage customer orders</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer hover:border-gray-300 transition"
             >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
             </select>
           </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                       Loading orders...
                    </td>
                 </tr>
              ) : orders.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                       No orders found matching your filters.
                    </td>
                 </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500">
                       #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                       {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-bold text-gray-900">{order.customer_name || "Guest User"}</div>
                       <div className="text-xs text-gray-400">{order.customer_email || order.user_id}</div>
                    </td>
                    <td className="px-6 py-4">
                       {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                       {formatPrice(order.total_amount_cents / 100)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link 
                         href={`/admin/orders/${order.id}`}
                         className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                       >
                          <Eye className="w-4 h-4" />
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
           <button 
             disabled={page === 1}
             onClick={() => setPage(p => p - 1)}
             className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 border border-gray-300 rounded hover:bg-white disabled:opacity-50 transition"
           >
             Previous
           </button>
           <span className="text-xs font-medium text-gray-500">Page {page}</span>
           <button 
             onClick={() => setPage(p => p + 1)}
             disabled={orders.length < 15}
             className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
           >
             Next
           </button>
        </div>
      </div>
    </div>
  )
}