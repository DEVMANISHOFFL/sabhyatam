/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/v1/cart/:path*",
        destination: "http://127.0.0.1:8081/v1/cart/:path*",
      },
      {
        source: "/v1/products/:path*",
        destination: "http://127.0.0.1:8080/v1/products/:path*",
      },
      {
        source: "/v1/admin/:path*",
        destination: "http://127.0.0.1:8080/v1/admin/:path*",
      },
      {
        source: "/v1/orders/:path*",
        destination: "http://127.0.0.1:8082/v1/orders/:path*",
      },
    ];
  },
};

export default nextConfig;