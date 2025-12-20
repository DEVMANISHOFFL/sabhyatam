"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client"; // Shared client
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      alert("Registration successful! Please check your email for a verification link.");
      router.push("/login"); 
    }
  };

  return (
    // Reduced padding on the container
    <div className="min-h-[calc(98vh-100px)] bg-gray-50 flex items-center justify-center p-4 font-sans">
      
      {/* Reduced max-width and min-height to fit content better */}
      <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row shadow-gray-200/50">
        
        {/* LEFT SIDE: Visuals */}
        <div className="hidden lg:block w-5/12 relative bg-pink-50">
           <img 
            src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1974&auto=format&fit=crop" 
            alt="Royal Saree Texture" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
            <h2 className="text-2xl font-serif font-bold mb-2">Join the Legacy.</h2>
            <p className="text-xs opacity-90 leading-relaxed">Curate your collection and receive exclusive offers.</p>
          </div>
        </div>

        {/* RIGHT SIDE: Register Form */}
        <div className="w-full lg:w-7/12 p-6 md:p-8 lg:p-10 flex flex-col justify-center relative">
          
          <div className="max-w-sm w-full mx-auto">
            {/* Compact Header */}
            <div className="mb-5 text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">
                Create Account
              </h1>
              <p className="text-gray-500 text-xs">
                Enter your details to begin your journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-pink-600 focus:bg-white focus:ring-1 focus:ring-pink-600 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-pink-600 focus:bg-white focus:ring-1 focus:ring-pink-600 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-pink-600 focus:bg-white focus:ring-1 focus:ring-pink-600 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg py-2.5 pl-10 pr-10 outline-none focus:border-pink-600 focus:bg-white focus:ring-1 focus:ring-pink-600 transition-all text-sm"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-pink-700 text-white py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Sign Up <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-xs">
                Already have an account?{" "}
                <Link href="/login" className="text-pink-600 font-bold hover:text-pink-700 hover:underline">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}