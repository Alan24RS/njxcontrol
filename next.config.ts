import type { NextConfig } from 'next'

const runtimeEnv =
  process.env.NEXT_PUBLIC_RUNTIME_ENVIRONMENT ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV ??
  'development'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_RUNTIME_ENVIRONMENT: runtimeEnv
  }
}

export default nextConfig
