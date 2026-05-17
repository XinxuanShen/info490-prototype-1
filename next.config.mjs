/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/prototype1",
  assetPrefix: "/prototype1/",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
