"use client"

import { useCartCount } from "@/lib/use-cart-count"

import { Search, ShoppingCart, User, Menu, Heart,MapPin,UserCog } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const cartCount = useCartCount()


  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
         <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2 text-xs">
              <div className="flex items-center gap-4">
                <Link href="/download" className="hover:underline flex items-center gap-1">
                  📱 Download App
                </Link>
                <span className="hidden md:block">|</span>
                <div className="hidden md:flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Deliver to 492013</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/offers" className="hover:underline hidden md:block">
                  Offers
                </Link>
                <Link href="/track" className="hover:underline hidden md:block">
                  Track Order
                </Link>
                <Link href="/help" className="hover:underline">
                  Help
                </Link>
              </div>
            </div>
          </div>
        </div>
      {/* Top Bar */}
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Categories */}
          <div className="flex items-center gap-4">
            {/* Menu Button - Mobile Only */}
            <button className="rounded p-2 hover:bg-gray-100 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5 text-gray-700" />
            </button>

            {/* Logo */}
            <a href="/" className="flex items-center">
              <span className="text-xl font-bold text-purple-600 md:text-2xl">Sabhyatam</span>
            </a>

            {/* Categories Dropdown - Desktop Only */}
            <div className="relative hidden md:block">
              <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Menu className="h-4 w-4" />
                Categories
              </button>
            </div>
          </div>

          {/* Center: Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-2xl md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Icon - Mobile Only */}
            <button className="rounded p-2 hover:bg-gray-100 md:hidden" aria-label="Search">
              <Search className="h-5 w-5 text-gray-700" />
            </button>

            {/* Wishlist - Desktop Only */}
            <button className="hidden items-center gap-2 rounded p-2 hover:bg-gray-100 md:flex" aria-label="Wishlist">
              <Heart className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Wishlist</span>
            </button>
 <Link
                href="/cart"
                className="flex flex-col items-center text-gray-700 hover:text-[#2874f0] transition relative"
              >

            {/* Cart */}
            <button className="relative rounded p-2 hover:bg-gray-100" aria-label="Cart">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
             {cartCount > 0 && (
                 <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
    {cartCount}
  </span>
)}

            </button>
</Link>

            {/* Profile */}
            <button className="flex items-center gap-2 rounded p-2 hover:bg-gray-100" aria-label="Profile">
              <User className="h-5 w-5 text-gray-700" />
              <span className="hidden text-sm font-medium text-gray-700 md:inline">Profile</span>
            </button>
            <Link href="/admin/products">
              <button className="flex items-center gap-2 rounded p-2 hover:bg-gray-100" aria-label="Admin">
              <UserCog className="h-5 w-5 text-gray-700" />
              <span className="hidden text-sm font-medium text-gray-700 md:inline">Admin</span>
            </button>
            </Link>
          </div>
        </div>

        {/* Search Bar - Mobile Only */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
