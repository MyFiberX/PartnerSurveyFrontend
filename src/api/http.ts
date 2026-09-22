/**
 * Central HTTP client: base URL, bearer token, response parsing, error shaping.
 *
 * Two distinct error bodies come back from the API and are normalised here so
 * pages never have to tell them apart:
 *   - ApiResponse<T>            — business failures, Arabic `message`
 *   - ValidationProblemDetails  — [ApiController] DataAnnotation failures (RFC 7807)
 */
import { i18n, type MessageKey } from '../stores/i18n'
import type { ApiResponse } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5147').replace(/\/+$/, '')

/** RFC 7807 body produced by [ApiController] on validation failure. */
export interface ValidationProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors: Record<string, string[]>
}

export class ApiError extends Error {
  readonly status: number
  /** Server `message`, preserved verbatim — Arabic messages are never rewritten. */
  readonly serverMessage: string | null
  /** Field-level errors from ValidationProblemDetails, keyed by field name. */
  readonly fieldErrors: Record<string, string[]> | null
  readonly errors: string[]
  readonly isNetworkError: boolean

  constructor(init: {
    status: number
    message: string
    serverMessage?: string | null
    fieldErrors?: Record<string, string[]> | null
    errors?: string[]
    isNetworkError?: boolean
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.serverMessage = init.serverMessage ?? null
    this.fieldErrors = init.fieldErrors ?? null
    this.errors = init.errors ?? []
    this.isNetworkError = init.isNetworkError ?? false
  }

  /** Flattened field errors, for forms that show a single list. */
  get fieldErrorList(): string[] {
    if (!this.fieldErrors) return []
    return Object.values(this.fieldErrors).flat()
  }
}

/**
 * Generic fallbacks, used only when the server sent no message of its own.
 * Resolved through i18n so they follow the selected locale; a server-supplied
 * `message` always wins and is shown verbatim in whatever language it arrives.
 */
function statusFallback(status: number): string | undefined {
  const key = `error.${status}` as MessageKey
  const text = i18n.t(key)
  // translate() echoes the key back when it is missing.
  return text === key ? undefined : text
}

function isValidationProblem(body: unknown): body is ValidationProblemDetails {
  return (
    typeof body === 'object' &&
    body !== null &&
    'errors' in body &&
    !('success' in body) &&
    typeof (body as ValidationProblemDetails).errors === 'object' &&
    !Array.isArray((body as ValidationProblemDetails).errors)
  )
}

function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  return typeof body === 'object' && body !== null && 'success' in body
}

let tokenGetter: () => string | null = () => null
let onUnauthorized: (() => void) | null = null

/** Wired by the auth store so this module stays free of store imports. */
export function configureAuth(getToken: () => string | null, unauthorizedHandler: () => void) {
  tokenGetter = getToken
  onUnauthorized = unauthorizedHandler
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Anonymous endpoints skip the Authorization header. */
  anonymous?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

/**
 * Issues a request and unwraps ApiResponse<T>.data.
 * Throws ApiError on any non-2xx response or transport failure.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<{
  data: T
  message: string | null
}> {
  const { method = 'GET', body, query, anonymous = false, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (!anonymous) {
    const token = tokenGetter()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError({
      status: 0,
      message: i18n.t('error.network'),
      isNetworkError: true,
    })
  }

  // 401/403 from the framework have empty bodies; parse defensively.
  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
  }

  if (response.status === 401 && !anonymous) {
    onUnauthorized?.()
  }

  if (!response.ok) {
    if (isValidationProblem(parsed)) {
      const flat = Object.values(parsed.errors).flat()
      throw new ApiError({
        status: response.status,
        message: flat[0] ?? parsed.title ?? statusFallback(response.status) ?? i18n.t('error.generic'),
        serverMessage: parsed.title ?? null,
        fieldErrors: parsed.errors,
      })
    }

    if (isApiResponse(parsed)) {
      const serverMessage = parsed.message ?? null
      throw new ApiError({
        status: response.status,
        // Server message wins; the fallback only fills a genuine blank.
        message: serverMessage ?? statusFallback(response.status) ?? i18n.t('error.generic'),
        serverMessage,
        errors: parsed.errors ?? [],
      })
    }

    throw new ApiError({
      status: response.status,
      message: statusFallback(response.status) ?? `${i18n.t('error.generic')} (${response.status})`,
    })
  }

  if (isApiResponse(parsed)) {
    const envelope = parsed as ApiResponse<T>
    if (!envelope.success) {
      throw new ApiError({
        status: response.status,
        message: envelope.message ?? i18n.t('error.generic'),
        serverMessage: envelope.message ?? null,
        errors: envelope.errors ?? [],
      })
    }
    return { data: envelope.data as T, message: envelope.message }
  }

  return { data: parsed as T, message: null }
}
