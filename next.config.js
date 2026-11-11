/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Ensure native server modules are never bundled by Turbopack / webpack
  serverExternalPackages: [
    "@prisma/client",
    "better-sqlite3",
    "bcryptjs",
    "nodemailer",
  ],
};

module.exports = nextConfig;
