"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/types";
import { updateProfile } from "@/lib/user-api";
import { Loader2, Check, Save, Pencil, X } from "lucide-react";

interface Props {
  user: UserProfile | any; // Allow 'any' to handle the raw Supabase user object
  token: string;
}

export default function ProfileInfo({ user: initialUser, token }: Props) {
  // FIX: Initialize state by checking both top-level AND nested metadata
  const [user, setUser] = useState(() => {
    // Safety check for metadata
    const meta = initialUser.user_metadata || initialUser.app_metadata || {};
    
    return {
      ...initialUser,
      // If full_name isn't at the top, grab it from metadata
      full_name: initialUser.full_name || meta.full_name || "",
      // If phone isn't at the top, grab it from metadata
      phone: initialUser.phone || meta.phone || "",
      // Ensure email is always available
      email: initialUser.email || ""
    };
  });

  const [editingField, setEditingField] = useState<"full_name" | "phone" | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingField) return;

    setLoading(true);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    const value = formData.get(editingField) as string;

    const payload = {
      [editingField]: value
    };

    try {
      const updated = await updateProfile(token, payload);
      
      // Update local state with the new value immediately
      setUser((prev: any) => ({
        ...prev,
        ...updated,
        // Ensure we explicitly update the field we just edited
        [editingField]: value
      }));
      
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setEditingField(null);
      }, 1000);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    setEditingField(null);
    setSuccess(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* --- FULL NAME BLOCK --- */}
        <div className={`p-4 rounded-lg border transition-colors ${editingField === 'full_name' ? 'bg-white border-black ring-1 ring-black' : 'bg-gray-50/50 border-gray-100 hover:border-gray-300'}`}>
           
           {editingField === 'full_name' ? (
             <form onSubmit={handleSave} className="space-y-3">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
               <input 
                 name="full_name" 
                 defaultValue={user.full_name}
                 className="w-full p-2 text-sm border-b border-gray-300 focus:border-black outline-none bg-transparent"
                 autoFocus
               />
               <div className="flex items-center gap-2 pt-1">
                 <button 
                   disabled={loading}
                   className="px-3 py-1.5 bg-black text-white rounded text-xs font-bold hover:bg-gray-800 disabled:opacity-70 flex items-center gap-1"
                 >
                   {loading ? <Loader2 size={12} className="animate-spin" /> : success ? <Check size={12} /> : <Save size={12} />}
                   {success ? "Saved" : "Save"}
                 </button>
                 <button type="button" onClick={handleCancel} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded">
                   <X size={14} />
                 </button>
               </div>
             </form>
           ) : (
             <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                  <p className="font-medium text-gray-900">{user.full_name || "-"}</p>
               </div>
               <button onClick={() => setEditingField('full_name')} className="text-gray-400 hover:text-black transition-colors p-1.5 hover:bg-white rounded-md">
                 <Pencil size={14} />
               </button>
             </div>
           )}
        </div>

        {/* --- PHONE BLOCK --- */}
        <div className={`p-4 rounded-lg border transition-colors ${editingField === 'phone' ? 'bg-white border-black ring-1 ring-black' : 'bg-gray-50/50 border-gray-100 hover:border-gray-300'}`}>
           
           {editingField === 'phone' ? (
             <form onSubmit={handleSave} className="space-y-3">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
               <input 
                 name="phone" 
                 defaultValue={user.phone}
                 className="w-full p-2 text-sm border-b border-gray-300 focus:border-black outline-none bg-transparent"
                 autoFocus
               />
               <div className="flex items-center gap-2 pt-1">
                 <button 
                   disabled={loading}
                   className="px-3 py-1.5 bg-black text-white rounded text-xs font-bold hover:bg-gray-800 disabled:opacity-70 flex items-center gap-1"
                 >
                   {loading ? <Loader2 size={12} className="animate-spin" /> : success ? <Check size={12} /> : <Save size={12} />}
                   {success ? "Saved" : "Save"}
                 </button>
                 <button type="button" onClick={handleCancel} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded">
                   <X size={14} />
                 </button>
               </div>
             </form>
           ) : (
             <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900">{user.phone || "-"}</p>
               </div>
               <button onClick={() => setEditingField('phone')} className="text-gray-400 hover:text-black transition-colors p-1.5 hover:bg-white rounded-md">
                 <Pencil size={14} />
               </button>
             </div>
           )}
        </div>

        {/* --- EMAIL BLOCK (Always Read-Only) --- */}
        <div className="md:col-span-2 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                 <p className="font-medium text-gray-900">{user.email}</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}   