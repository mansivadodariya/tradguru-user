/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/chart/:path*',
        destination: 'https://thirsty-spoiler-cartel.ngrok-free.dev/api/v1/chart/:path*',
      },
    ];
  },
};

export default nextConfig;
