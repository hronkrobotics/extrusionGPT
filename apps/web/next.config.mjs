/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The core engine is a workspace TS package; let Next transpile it directly.
  transpilePackages: ["@extrusiongpt/core"],
  webpack: (config) => {
    // core uses ESM-style ".js" import specifiers that point at ".ts" sources.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
