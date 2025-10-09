/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',            // <-- remets ceci
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://api:8080/:path*' },
    ];
  },
};
export default nextConfig;
