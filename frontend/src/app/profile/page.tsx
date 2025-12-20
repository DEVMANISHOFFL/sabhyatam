"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { 
  User, 
  Package, 
  MapPin, 
  LogOut, 
  Loader2
} from "lucide-react";

// Import Components
import ProfileInfo from "@/components/profile/ProfileInfo";
import AddressBook from "@/components/profile/AddressBook";
import OrderHistory from "@/components/profile/OrderHistory";

type Tab = "overview" | "orders" | "addresses";

export default function ProfilePage() {
  const { user, token, isLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // 1. Protect Route
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // --- SUB-COMPONENTS ---

  const SidebarItem = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        activeTab === id
          ? "bg-black text-white shadow-md"
          : "text-gray-600 hover:bg-white hover:text-gray-900"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your orders and personal details.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="space-y-2">
          
          {/* User Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 text-sm truncate">{user.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarItem id="overview" label="Overview" icon={User} />
            <SidebarItem id="orders" label="My Orders" icon={Package} />
            <SidebarItem id="addresses" label="Saved Addresses" icon={MapPin} />
          </nav>

          <div className="pt-6 mt-6 border-t border-gray-200">
            <button 
              onClick={() => { signOut(); router.push("/"); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="min-h-[500px]">
          
          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
              {/* ProfileInfo handles the view/edit mode internally now */}
              <ProfileInfo user={user as any} token={token} />
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === "orders" && (
            <OrderHistory 
              token={token} 
              userId={user.id} // <--- FIX: Added userId prop here
            />
          )}

          {/* TAB: ADDRESSES */}
          {activeTab === "addresses" && <AddressBook token={token} />}

        </div>
      </div>
    </div>
  );
}