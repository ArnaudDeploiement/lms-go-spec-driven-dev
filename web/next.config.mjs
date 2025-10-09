/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // "api" = nom du service Docker (docker-compose)
      { source: '/api/:path*', destination: 'http://api:8080/:path*' },
    ];
  },
};
export default nextConfig;
