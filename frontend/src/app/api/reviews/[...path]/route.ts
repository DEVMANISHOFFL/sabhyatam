import { NextRequest, NextResponse } from "next/server";

const GO_SERVICE_URL = process.env.REVIEWS_SERVICE_URL || "http://localhost:8085";

// ✅ Fix: Define the Params type as a Promise for Next.js 15 support
type Props = {
  params: Promise<{ path: string[] }>;
};

async function proxyRequest(req: NextRequest, props: Props) {
  try {
    // ✅ Fix: Await the params before using them
    const params = await props.params;
    
    // Construct the Go Service URL
    const path = params.path.join("/");
    const url = `${GO_SERVICE_URL}/${path}${req.nextUrl.search}`;

    console.log(`[Proxy] Forwarding ${req.method} to: ${url}`);

    // Prepare headers (forward auth)
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const adminKey = req.headers.get("x-admin-key");
    if (adminKey) {
      headers["X-ADMIN-KEY"] = adminKey;
    }

    // Forward the Body (for POST/PUT)
    const body = req.method !== "GET" ? await req.text() : undefined;

    // Call the Go Backend
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    // ✅ VALID CHANGE: Handle Text vs JSON responses
    // Go returns text for errors (http.Error) and JSON for success data.
    const text = await res.text();

    // If it's JSON, return it as JSON content-type
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      // If parsing fails, it's a plain text error (like "review already exists")
      // Return it as a standard Response so frontend res.text() can read it
      return new NextResponse(text, { status: res.status });
    }

  } catch (error) {
    console.error("[Proxy] Fatal Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Review Service" }, 
      { status: 502 }
    );
  }
}

export { proxyRequest as GET, proxyRequest as POST };