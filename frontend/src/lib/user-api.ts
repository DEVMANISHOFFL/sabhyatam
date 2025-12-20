import { supabase } from "@/lib/supabase/client";
import { Address, Order, UserProfile } from "./types";

// --- PROFILE (Managed via Supabase Auth) ---

export async function updateProfile(token: string, updates: { full_name?: string; phone?: string }) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.full_name,
      phone: updates.phone,
    },
  });

  if (error) throw error;

  return {
    id: data.user.id,
    email: data.user.email!,
    full_name: data.user.user_metadata.full_name,
    phone: data.user.user_metadata.phone,
  } as UserProfile;
}

// --- ADDRESSES (Managed via Supabase Database) ---

export async function getAddresses(token: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .order("is_default", { ascending: false });

  if (error) throw error;
  return data as Address[];
}

export async function addAddress(token: string, address: Omit<Address, "id" | "user_id">) {
  // 1. Get the current User ID to satisfy RLS
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // 2. If this new address is default, unmark others
  if (address.is_default) {
    await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id) // Ensure we only touch our own rows
      .eq("is_default", true);
  }

  // 3. Insert with user_id explicitly included
  const { data, error } = await supabase
    .from("user_addresses")
    .insert([{ 
      ...address, 
      user_id: user.id // <--- THIS WAS MISSING
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(token: string, id: string) {
  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// --- ORDERS (Managed via Go Backend Service) ---

const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:8082";

// ... imports ...

export async function fetchMyOrders(token: string, userId: string): Promise<Order[]> {
  if (!token || !userId) return [];

  try {
    const res = await fetch(`${ORDER_SERVICE_URL}/v1/orders/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-USER-ID": userId, // <--- ADD THIS HEADER
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch orders: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("FetchMyOrders Error:", error);
    return [];
  }
}