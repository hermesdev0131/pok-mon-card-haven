/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/marketplace/psa10',
        destination: '/marketplace/internacional',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
