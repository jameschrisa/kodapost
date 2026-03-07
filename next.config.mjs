/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://*.clerk.com https://*.clerk.accounts.dev https://img.clerk.com https://*.stripe.com https://*.audius.co https://*.jamendo.com https://api.dicebear.com",
              "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://api.stripe.com https://unpkg.com https://*.audius.co https://api.jamendo.com https://*.anthropic.com https://*.vercel-insights.com wss://*.clerk.accounts.dev",
              "frame-src https://challenges.cloudflare.com https://*.clerk.accounts.dev https://web.telegram.org https://js.stripe.com https://checkout.stripe.com",
              "font-src 'self' data:",
              "media-src 'self' blob: data: https://*.audius.co https://*.jamendo.com",
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
