import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const basePath = isPages ? "/gallary8" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: isPages ? "/gallary8/" : undefined,
  transpilePackages: ["three"],
  eslint: { ignoreDuringBuilds: true },
  // Windows: tracing hangs the Pages export; static `out/` does not need NFT traces
  outputFileTracingExcludes: {
    "*": ["node_modules/**/*", ".git/**/*", "ref-plan/**/*", "public/**/*"],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
