"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Search, 
  ShoppingCart, 
  User, 
  LayoutDashboard,
  Menu, 
  Heart, 
  MapPin, 
  LogOut 
} from "lucide-react";

import { useCartCount } from "@/lib/use-cart-count";
import SearchOverlay from "@/components/SearchOverlay";
import { useAuth } from "@/app/context/auth-context";

export default function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const cartCount = useCartCount();
  
  // Access auth state
  const { user, signOut } = useAuth();

  // Determine if user is admin (matches logic in AdminLayout)
  const isAdmin = 
    user?.app_metadata?.role === "admin" || 
    user?.user_metadata?.role === "admin" || 
    user?.email === "admin@sabhyatam.com";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        
        {/* 1. Top Utility Bar */}
        <div className="bg-[#0f172a] text-white transition-colors">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2 text-[11px] md:text-xs tracking-wide font-medium">
              <div className="flex items-center gap-4">
                <Link href="/download" className="hover:text-pink-400 transition-colors flex items-center gap-1">
                  <span>📱</span> <span className="hidden sm:inline">Download App</span>
                </Link>
                <span className="text-gray-600">|</span>
                <div className="flex items-center gap-1 cursor-pointer hover:text-pink-400 transition-colors">
                  <MapPin className="w-3 h-3" />
                  <span>Deliver to: <span className="font-bold text-gray-200">492013</span></span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/offers" className="hover:text-pink-400 transition-colors hidden md:block">Offers</Link>
                <Link href="/track" className="hover:text-pink-400 transition-colors hidden md:block">Track Order</Link>
                <Link href="/help" className="hover:text-pink-400 transition-colors">Help</Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Header */}
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            
            {/* Left: Logo + Menu */}
            <div className="flex items-center gap-3 md:gap-6">
              <button className="rounded p-2 hover:bg-gray-50 md:hidden" aria-label="Open menu">
                <Menu className="h-6 w-6 text-gray-800" />
              </button>

              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight group-hover:text-pink-700 transition-colors">
                  Sabhyatam
                </span>
              </Link>
            </div>

            {/* Center: Search Bar (Desktop Trigger) */}
            <div className="hidden flex-1 max-w-xl md:block">
              <div 
                onClick={() => setShowSearch(true)} 
                className="relative group cursor-text"
              >
                <div className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-500 hover:border-pink-300 transition-colors">
                  Search for sarees, weaves, brands...
                </div>
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              
              {/* Mobile Search Trigger */}
              <button 
                className="rounded-full p-2 text-gray-700 hover:bg-gray-100 md:hidden" 
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* DYNAMIC: Show Admin only if authorized */}
              {isAdmin && (
                <Link href="/admin/products" className="hidden md:block">
                  <button className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Admin</span>
                  </button>
                </Link>
              )}

              {/* DYNAMIC: Profile & Logout vs Login */}
              {user ? (
                <>
                  {/* Profile Link */}
                  <Link href="/profile" className="hidden md:block">
                    <button className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
                      <User className="h-5 w-5" />
                      <span className="text-[10px] font-medium uppercase tracking-wide">Profile</span>
                    </button>
                  </Link>

                  {/* Logout Button */}
                  <button 
                    onClick={() => signOut()} 
                    className="hidden md:flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Logout</span>
                  </button>
                </>
              ) : (
                /* Login Link */
                <Link href="/login">
                  <button className="hidden md:flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
                    <User className="h-5 w-5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Login</span>
                  </button>
                </Link>
              )}

              <button className="hidden md:flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
                <Heart className="h-5 w-5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Wishlist</span>
              </button>

              <Link href="/cart" className="relative group ml-1 md:ml-2">
                <button className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-white hover:bg-pink-700 transition-all shadow-md">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden md:inline text-sm font-bold">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 md:relative md:top-auto md:right-auto md:ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 md:bg-white md:text-pink-700 text-[10px] font-bold text-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Search Overlay */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}