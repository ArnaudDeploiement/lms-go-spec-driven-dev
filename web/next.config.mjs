const normalizeTarget = (target = '') => target.replace(/\/+$/, '');

const resolveProxyTarget = () => {
  const candidates = [
    process.env.NEXT_API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_API_URL,
    'http://api:8080',
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return normalizeTarget(candidate);
    }
  }

  return 'http://api:8080';
};

const apiProxyTarget = resolveProxyTarget();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
