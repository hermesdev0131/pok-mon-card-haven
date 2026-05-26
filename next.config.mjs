/** @type {import('next').NextConfig} */

// Allow next/image to load card/listing images served from the Supabase
// Storage public buckets. Without this, next/image refuses the remote host
// and the image silently fails to render.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: 'https',
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
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
