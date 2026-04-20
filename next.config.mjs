/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/marketplace',
        destination: '/marketplace/nacional',
        permanent: true,
      },
      {
        source: '/marketplace/psa10',
        destination: '/marketplace/internacional',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
