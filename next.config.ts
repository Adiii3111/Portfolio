import type { NextConfig } from "next";

// Set only by the GitHub Pages workflow (e.g. "/Aditya-Portfolio"). Empty locally.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const isPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Hide the dev-only "N" route indicator (it never appears on the live site); errors still show.
  devIndicators: false,
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
  },
  // Partial prerendering needs a server, so these stay off for the static GitHub Pages export.
  cacheComponents: !isPagesBuild,
  partialPrefetching: !isPagesBuild,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // GitHub Pages serves plain files, so that build is a static export under the repo's path.
  ...(isPagesBuild && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
