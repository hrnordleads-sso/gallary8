import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? "/gallary8" : "",
  assetPrefix: isPages ? "/gallary8/" : undefined,
  transpilePackages: ["three"],
};

export default nextConfig;
