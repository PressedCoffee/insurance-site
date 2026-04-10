import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed `output: 'export'` to enable Vercel serverless API routes
  // (BackNine webhooks at /api/backnine/eapp and /api/backnine/case)
  // Static pages still pre-render; API routes run as serverless functions.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;