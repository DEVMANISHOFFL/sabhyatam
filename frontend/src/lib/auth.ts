// lib/auth.ts
const AUTH_URL = "http://localhost:8083/v1";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "customer" | "admin";
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function register(data: { email: string; password: string; full_name: string; phone: string }) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}