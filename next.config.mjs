/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Screenshots are served from presigned R2 URLs.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.cloudflarestorage.com" }],
  },
};

export default nextConfig;
