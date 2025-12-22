"use client";

import { supabase } from "../lib/supabase/client";

export default function DebugToken() {
  const getToken = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session", error);
      return;
    }

    console.log("ACCESS TOKEN:", data.session?.access_token);
    console.log("USER ID (sub):", data.session?.user.id);
  };

  return (
    <button onClick={getToken}>
      Log Supabase Access Token
    </button>
  );
}
