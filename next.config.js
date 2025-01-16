/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'placehold.co', 'images.unsplash.com'],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig; 