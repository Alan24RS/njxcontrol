export type Environment = 'development' | 'staging' | 'production' | 'unknown'

export interface EnvironmentInfo {
  name: string
  color: string
  textColor: string
  borderColor: string
  environment: Environment
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const runtimeEnv =
    process.env.NEXT_PUBLIC_RUNTIME_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    'development'

  const normalizedEnv = runtimeEnv.toLowerCase()

  if (normalizedEnv === 'production' || normalizedEnv === 'prod') {
    return {
      name: 'PRODUCTION',
      color: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
      environment: 'production'
    }
  }

  if (
    normalizedEnv === 'preview' ||
    normalizedEnv === 'staging' ||
    normalizedEnv === 'test'
  ) {
    return {
      name: 'STAGING',
      color: 'bg-orange-500',
      textColor: 'text-white',
      borderColor: 'border-orange-600',
      environment: 'staging'
    }
  }

  if (normalizedEnv === 'development' || normalizedEnv === 'dev') {
    return {
      name: 'DEVELOPMENT',
      color: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600',
      environment: 'development'
    }
  }

  return {
    name: 'UNKNOWN',
    color: 'bg-gray-500',
    textColor: 'text-white',
    borderColor: 'border-gray-600',
    environment: 'unknown'
  }
}

export function isProduction(): boolean {
  return getEnvironmentInfo().environment === 'production'
}

export function isDevelopment(): boolean {
  return getEnvironmentInfo().environment === 'development'
}

export function isStaging(): boolean {
  return getEnvironmentInfo().environment === 'staging'
}
