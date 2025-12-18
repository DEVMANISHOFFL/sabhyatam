"use client"

import { useCartCount } from "@/lib/use-cart-count"
import { Search, ShoppingCart, User, Menu, Heart, MapPin, UserCog, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const cartCount = useCartCount()

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
      
      {/* 1. Top Utility Bar - Premium Dark Theme */}
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
              <Link href="/offers" className="hover:text-pink-400 transition-colors hidden md:block">
                Offers
              </Link>
              <Link href="/track" className="hover:text-pink-400 transition-colors hidden md:block">
                Track Order
              </Link>
              <Link href="/help" className="hover:text-pink-400 transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Header */}
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-3 md:gap-6">
            <button className="rounded p-2 hover:bg-gray-50 md:hidden" aria-label="Open menu">
              <Menu className="h-6 w-6 text-gray-800" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl md:text-3xl font-serif font-bold text-gray-900 tracking-tight group-hover:text-pink-700 transition-colors">
                Sabhyatam
              </span>
            </Link>
            
             {/* Categories - Desktop */}
             <div className="hidden lg:block ml-2">
                <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-pink-700 transition uppercase tracking-wide">
                  <Menu className="h-4 w-4" />
                  Categories
                </button>
             </div>
          </div>

          {/* Center: Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-xl md:block">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search for sarees, weaves, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            
            {/* Mobile Search Toggle */}
            <button 
              className="rounded-full p-2 text-gray-700 hover:bg-gray-100 md:hidden" 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            {/* Admin (Staff Only) */}
            <Link href="/admin/products" className="hidden md:block">
              <button className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
                <UserCog className="h-5 w-5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Admin</span>
              </button>
            </Link>

            {/* Profile */}
            <button className="hidden md:flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Profile</span>
            </button>

            {/* Wishlist */}
            <button className="hidden md:flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50 hover:text-pink-700 transition">
              <Heart className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Wishlist</span>
            </button>

            {/* Cart */}
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

        {/* Search Bar - Mobile Slide Down */}
        {isMobileSearchOpen && (
           <div className="mt-3 md:hidden animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}