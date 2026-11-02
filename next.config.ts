import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Le foto vengono ridimensionate nel browser, ma lasciamo margine
      bodySizeLimit: "4mb",
    },
  },
  serverExternalPackages: ["pg"],
};

export default nextConfig;
