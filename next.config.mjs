/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Prevent webpack from bundling @libsql/client's native bindings
    serverComponentsExternalPackages: ["@libsql/client", "c2pa-node"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "connect-src 'self' https: wss:",
              "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev https://web.telegram.org https://js.stripe.com https://checkout.stripe.com",
              "font-src 'self' data:",
              "media-src 'self' blob: data:",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
