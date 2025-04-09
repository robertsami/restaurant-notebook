/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'maps.googleapis.com',
      'public.blob.vercel-storage.com'
    ],
  },
  experimental: {
    serverActions: true,
  },
}

export default nextConfig
