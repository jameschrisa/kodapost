/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
    // Prevent webpack from bundling @libsql/client's native bindings
    serverComponentsExternalPackages: ["@libsql/client"],
  },
};

export default nextConfig;
