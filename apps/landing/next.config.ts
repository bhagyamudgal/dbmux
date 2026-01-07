import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@dbmux/types", "@dbmux/utils"],
};

export default nextConfig;
