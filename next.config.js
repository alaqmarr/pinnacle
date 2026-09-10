/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure native server modules are not bundled by webpack
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'nodemailer'],
};

module.exports = nextConfig;
