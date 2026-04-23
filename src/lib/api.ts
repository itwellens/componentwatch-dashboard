/**
 * API client for the ComponentWatch FastAPI backend.
 *
 * Attaches Clerk's session JWT as a Bearer token so the backend can verify
 * the user. The backend will need to accept and validate these tokens —
 * that's Phase 1B work (add Clerk JWT verification middleware to FastAPI).
 *
 * Until Phase 1B lands, calls will succeed at the network level but the
 * backend will ignore the Authorization header and return data without
 * user scoping. That's fine for wiring — the flow is validated; only the
 * enforcement is deferred.
 *
 * USAGE (from a React component):
 *   import { useAuth } from '@clerk/clerk-react'
 *   import { apiFetch } from '../lib/api'
 *
 *   function MyComponent() {
 *     const { getToken } = useAuth()
 *
 *     const load = async () => {
 *       const data = await apiFetch('/api/dashboard', { getToken })
 *       // ...
 *     }
 *   }
 */

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>

export interface ApiFetchOptions extends RequestInit {
  /** Clerk's getToken function (from useAuth()). Required for authed endpoints. */
  getToken?: GetTokenFn
  /** Skip attaching the auth token even if getToken is provided. */
  skipAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * In dev, requests go through Vite's proxy at /api/* -> localhost:8000.
 * In production, VITE_API_BASE_URL should be set to https://api.componentwatch.com
 * at build time. The proxy only kicks in for dev, so production builds hit
 * the full URL directly.
 */
function resolveUrl(path: string): string {
  // Dev: relative path goes through Vite proxy
  if (import.meta.env.DEV) {
    return path
  }
  // Prod: join with VITE_API_BASE_URL
  const base = import.meta.env.VITE_API_BASE_URL ?? 'https://api.componentwatch.com'
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Makes an authenticated request to the backend API.
 * Throws ApiError on non-2xx responses with parsed body if possible.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { getToken, skipAuth, headers, ...rest } = options

  const finalHeaders = new Headers(headers)
  finalHeaders.set('Accept', 'application/json')

  // Attach Clerk session token if available and not explicitly skipped.
  // Safe no-op if user is signed out (getToken returns null).
  if (getToken && !skipAuth) {
    try {
      const token = await getToken()
      if (token) {
        finalHeaders.set('Authorization', `Bearer ${token}`)
      }
    } catch (err) {
      // Non-fatal — let the request proceed; the backend will 401 if needed.
      console.warn('Failed to get Clerk session token:', err)
    }
  }

  // Auto-set Content-Type for JSON bodies unless caller already did
  if (rest.body && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  const url = resolveUrl(path)
  const response = await fetch(url, { ...rest, headers: finalHeaders })

  // Parse body once — we need it for both success and error paths
  let body: unknown = null
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null)
  } else {
    body = await response.text().catch(() => null)
  }

  if (!response.ok) {
    throw new ApiError(
      `${response.status} ${response.statusText} — ${path}`,
      response.status,
      body,
    )
  }

  return body as T
}
