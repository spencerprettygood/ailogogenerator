/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * The 'experimental.serverComponentsExternalPackages' option is deprecated.
   * Use 'serverExternalPackages' instead.
   *
   * Example:
   * serverExternalPackages: ['@prisma/client', 'sharp']
   */
};

export default nextConfig;