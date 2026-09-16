import type { NextConfig } from "next";

if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL === "") {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
  } else {
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  }
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
