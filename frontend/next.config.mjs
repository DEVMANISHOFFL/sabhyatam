/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // When the frontend calls /api/v1/..., send it to the Go backend
        source: "/api/:path*",
        // Assuming your Go server runs on port 8080
        destination: "http://localhost:8080/:path*", 
      },
    ];
  },
};

export default nextConfig;