"use client";

import { useState, useEffect } from "react";
import { Address } from "@/lib/types"; //
import { getAddresses, deleteAddress, addAddress } from "@/lib/user-api"; // Uses the new hybrid API
import { Plus, Trash2, MapPin, Loader2 } from "lucide-react";

export default function AddressBook({ token }: { token: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    getAddresses(token)
      .then(setAddresses)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    await deleteAddress(token, id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newAddr = {
      full_name: formData.get("full_name") as string,
      phone: formData.get("phone") as string,
      line1: formData.get("line1") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      is_default: false, // Default to false for MVP
    };

    try {
      const created = await addAddress(token, newAddr);
      setAddresses([...addresses, created]);
      setIsAdding(false);
    } catch (err) {
      alert("Failed to add address");
    }
  }

  if (loading) return <div className="py-10 text-center text-gray-400">Loading addresses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Saved Addresses</h3>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-sm font-bold text-pink-600 flex items-center gap-1 hover:underline"
          >
            <Plus size={16} /> Add New
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
          <input name="full_name" placeholder="Full Name" className="p-2 border rounded" required />
          <input name="phone" placeholder="Phone" className="p-2 border rounded" required />
          <input name="line1" placeholder="Address Line 1" className="p-2 border rounded md:col-span-2" required />
          <input name="city" placeholder="City" className="p-2 border rounded" required />
          <input name="state" placeholder="State" className="p-2 border rounded" required />
          <input name="pincode" placeholder="Pincode" className="p-2 border rounded" required />
          
          <div className="md:col-span-2 flex gap-3 pt-2">
            <button className="bg-black text-white px-4 py-2 rounded text-sm font-bold">Save Address</button>
            <button type="button" onClick={() => setIsAdding(false)} className="text-sm text-gray-500 hover:text-black">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !isAdding && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <MapPin className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500 text-sm">No addresses saved yet.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="border border-gray-200 p-5 rounded-xl relative group hover:border-black transition-colors bg-white">
            {addr.is_default && (
              <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded absolute top-4 right-4 font-bold">DEFAULT</span>
            )}
            <p className="font-bold text-sm text-gray-900">{addr.full_name}</p>
            <p className="text-sm text-gray-600 mt-1">{addr.line1}</p>
            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
            <p className="text-xs text-gray-500 mt-3 font-medium">Phone: {addr.phone}</p>
            
            <button 
              onClick={() => handleDelete(addr.id)}
              className="absolute bottom-4 right-4 text-gray-300 hover:text-red-600 transition-colors p-1"
              title="Delete Address"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}