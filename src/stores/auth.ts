/**
 * Authentication state: token, current user, persistence.
 *
 * A plain reactive module rather than Pinia — the app has no store library and
 * this is the only global state, so adding one would not earn its weight.
 */
import { computed, readonly, ref } from 'vue'
import { configureAuth } from '../api/http'
import { authService } from '../api/services'
import type { LoginRequest, UserResponse } from '../api/types'

const STORAGE_KEY = 'partnersurvey.auth'

interface PersistedAuth {
  token: string
  expiresAt: string
  user: UserResponse
}

const token = ref<string | null>(null)
const expiresAt = ref<string | null>(null)
const user = ref<UserResponse | null>(null)

function readStorage(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedAuth
    if (!parsed?.token || !parsed?.user) return null
    return parsed
  } catch {
    // Private mode, cleared site data, or a malformed entry: treat as signed out.
    return null
  }
}

function writeStorage(value: PersistedAuth | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Persistence is a convenience; the session still works in memory.
  }
}

/** Server ClockSkew is zero, so expiry is exact. */
function isExpired(iso: string | null): boolean {
  if (!iso) return true
  const ms = Date.parse(iso)
  return Number.isNaN(ms) || ms <= Date.now()
}

function clear() {
  token.value = null
  expiresAt.value = null
  user.value = null
  writeStorage(null)
}

/** Restores a persisted session, discarding it if the token has already expired. */
function restore() {
  const stored = readStorage()
  if (!stored) return
  if (isExpired(stored.expiresAt)) {
    writeStorage(null)
    return
  }
  token.value = stored.token
  expiresAt.value = stored.expiresAt
  user.value = stored.user
}

restore()

const isAuthenticated = computed(() => token.value !== null && !isExpired(expiresAt.value))
const isAdmin = computed(() => user.value?.role === 'Admin')

export const auth = {
  token: readonly(token),
  expiresAt: readonly(expiresAt),
  user: readonly(user),
  isAuthenticated,
  isAdmin,

  async login(payload: LoginRequest) {
    const { data, message } = await authService.login(payload)
    token.value = data.token
    expiresAt.value = data.expiresAt
    user.value = data.user
    writeStorage({ token: data.token, expiresAt: data.expiresAt, user: data.user })
    return message
  },

  logout() {
    clear()
  },

  /** Replaces the cached user after a profile-affecting call. */
  setUser(next: UserResponse) {
    user.value = next
    if (token.value && expiresAt.value) {
      writeStorage({ token: token.value, expiresAt: expiresAt.value, user: next })
    }
  },
}

/** Callback set by the router so a 401 can redirect without a circular import. */
let unauthorizedRedirect: (() => void) | null = null

export function setUnauthorizedRedirect(handler: () => void) {
  unauthorizedRedirect = handler
}

configureAuth(
  () => token.value,
  () => {
    clear()
    unauthorizedRedirect?.()
  },
)
