/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
  },
}

export default nextConfig
