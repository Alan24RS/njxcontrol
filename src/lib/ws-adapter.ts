/**
 * Adaptador genérico para módulos de Node.js en Edge Runtime
 * Detecta si está corriendo en Edge Runtime y maneja imports dinámicos
 */

/**
 * Detecta si el código está corriendo en Edge Runtime
 */
export function isEdgeRuntime(): boolean {
  return typeof (globalThis as any).EdgeRuntime !== 'undefined'
}

/**
 * Adaptador para WebSocket (ws)
 * Nota: Solo disponible en runtime 'nodejs'
 */
export async function createWebSocketAdapter() {
  if (isEdgeRuntime()) {
    throw new Error(
      'WebSocket module is not available in Edge Runtime. Use runtime: "nodejs" in your API route.'
    )
  }

  try {
    const { default: WebSocket } = await import('ws' as any)
    return WebSocket
  } catch (error) {
    throw new Error(
      'Failed to import WebSocket module: ' + (error as Error).message
    )
  }
}

/**
 * Adaptador para encoding
 * Nota: Solo disponible en runtime 'nodejs'
 */
export async function createEncodingAdapter() {
  if (isEdgeRuntime()) {
    throw new Error(
      'Encoding module is not available in Edge Runtime. Use runtime: "nodejs" in your API route.'
    )
  }

  try {
    const encoding = await import('encoding' as any)
    return encoding
  } catch (error) {
    throw new Error(
      'Failed to import encoding module: ' + (error as Error).message
    )
  }
}

/**
 * Adaptador para crypto de Node.js
 */
export async function createNodeCryptoAdapter() {
  if (isEdgeRuntime()) {
    throw new Error(
      'Node.js crypto module is not available in Edge Runtime. Use Web Crypto API or runtime: "nodejs" in your API route.'
    )
  }

  try {
    const crypto = await import('crypto')
    return crypto
  } catch (error) {
    throw new Error(
      'Failed to import Node.js crypto module: ' + (error as Error).message
    )
  }
}

/**
 * Adaptador para stream de Node.js
 */
export async function createNodeStreamAdapter() {
  if (isEdgeRuntime()) {
    throw new Error(
      'Node.js stream module is not available in Edge Runtime. Use Web Streams API or runtime: "nodejs" in your API route.'
    )
  }

  try {
    const stream = await import('stream')
    return stream
  } catch (error) {
    throw new Error(
      'Failed to import Node.js stream module: ' + (error as Error).message
    )
  }
}

/**
 * Guard seguro para process.version y process.versions
 */
export function getProcessInfo() {
  if (isEdgeRuntime()) {
    return {
      version: '',
      versions: {}
    }
  }

  return {
    version: typeof process !== 'undefined' ? process.version : '',
    versions: typeof process !== 'undefined' ? process.versions : {}
  }
}

/**
 * Adaptador genérico para cualquier módulo de Node.js
 */
export async function createNodeModuleAdapter<T>(
  moduleName: string
): Promise<T> {
  if (isEdgeRuntime()) {
    throw new Error(
      `Node.js module "${moduleName}" is not available in Edge Runtime. Use runtime: "nodejs" in your API route.`
    )
  }

  try {
    const nodeModule = await import(moduleName)
    return nodeModule
  } catch (error) {
    throw new Error(
      `Failed to import Node.js module "${moduleName}": ` +
        (error as Error).message
    )
  }
}
