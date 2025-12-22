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
  LogOut,
  Smartphone,
  HelpCircle,
  Package
} from "lucide-react";

import { useCartCount } from "@/lib/use-cart-count";
import SearchOverlay from "@/components/SearchOverlay";
import { useAuth } from "@/app/context/auth-context";

export default function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const cartCount = useCartCount();
  
  const { user, signOut } = useAuth();

  const isAdmin = 
    user?.app_metadata?.role === "admin" || 
    user?.user_metadata?.role === "admin" || 
    user?.email === "admin@sabhyatam.com";

  return (
    <>
      {/* 1. Top Utility Bar - Sleek & Dark */}
      <div className="bg-slate-950 text-slate-300 text-[10px] md:text-xs font-medium tracking-wide border-b border-slate-800">
        <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <Link href="/download" className="group flex items-center gap-1.5 hover:text-white transition-colors">
              <Smartphone className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300" /> 
              <span className="hidden sm:inline">Get App</span>
            </Link>
            <div className="hidden sm:block h-3 w-px bg-slate-700"></div>
            <div className="hidden sm:flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors group">
              <MapPin className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-300" />
              <span>Delivering to <span className="text-white font-semibold group-hover:underline decoration-rose-400/50 underline-offset-2">492013</span></span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/track" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Package className="w-3.5 h-3.5" /> Track Order
            </Link>
            <Link href="/help" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> Help
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Header - Glassmorphism & Modern */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            
            {/* LEFT: Menu & Branding */}
            <div className="flex items-center gap-4">
              <button className="p-2 -ml-2 rounded-full hover:bg-gray-100 md:hidden transition-colors" aria-label="Open menu">
                <Menu className="h-6 w-6 text-gray-900" />
              </button>

              <Link href="/" className="group flex flex-col justify-center">
                {/* Modern "Cursive-like" Logo using Serif Italic */}
                <h1 className="text-3xl md:text-4xl font-serif italic font-bold text-gray-900 tracking-tight leading-none group-hover:text-rose-700 transition-colors">
                  Sabhyatam
                </h1>
                <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-medium pl-1 group-hover:text-rose-900/60 transition-colors">
                  The Saree Store
                </span>
              </Link>
            </div>

            {/* CENTER: Refined Search Bar */}
            <div className="hidden flex-1 max-w-lg lg:max-w-xl md:block">
              <div 
                onClick={() => setShowSearch(true)} 
                className="group relative w-full cursor-text"
              >
                <div className="flex items-center gap-3 w-full bg-gray-50 border border-gray-200 hover:border-rose-200 hover:bg-white rounded-full py-2.5 px-5 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Search className="h-4 w-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
                  <span className="text-sm text-gray-400 group-hover:text-gray-600 truncate font-medium">
                    Search for Kanjivaram, Banarasi, Cotton...
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Modern Icon Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              
              {/* Mobile Search */}
              <button 
                className="p-2.5 rounded-full text-gray-700 hover:bg-gray-100 hover:text-rose-600 md:hidden transition-all" 
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <button className="hidden md:flex items-center justify-center p-2.5 rounded-full text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Wishlist">
                <Heart className="h-5 w-5" />
              </button>

              {/* User Account Dropdown */}
              <div className="flex items-center">
                {user ? (
                  <div className="group relative">
                    <button className="flex items-center justify-center p-2.5 rounded-full text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-all">
                       <User className="h-5 w-5" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                        <div className="bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden py-1">
                           {isAdmin && (
                              <Link href="/admin/products" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600">
                                <LayoutDashboard className="h-4 w-4" /> Admin Panel
                              </Link>
                           )}
                           <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600">
                              <User className="h-4 w-4" /> Profile
                           </Link>
                           <button onClick={() => signOut()} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                              <LogOut className="h-4 w-4" /> Logout
                           </button>
                        </div>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-900 hover:text-rose-700 transition-colors">
                    Login
                  </Link>
                )}
              </div>

              {/* Cart Button - Pill Style */}
              <Link href="/cart" className="ml-2">
                <button className="group relative flex items-center gap-2.5 bg-gray-900 hover:bg-rose-700 text-white pl-4 pr-5 py-2.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <ShoppingCart className="h-4 w-4 text-gray-200 group-hover:text-white" />
                  <span className="hidden md:inline text-sm font-bold tracking-wide">Cart</span>
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white text-gray-900 text-[10px] font-bold px-1 group-hover:text-rose-700 transition-colors">
                    {cartCount}
                  </span>
                </button>
              </Link>

            </div>
          </div>
        </div>
      </header>
      
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}