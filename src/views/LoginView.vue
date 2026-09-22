<script setup lang="ts">
/**
 * The only authentication entry point. There is intentionally no link to a
 * registration page — the frontend does not expose POST /api/Users/register.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api/http'
import { auth } from '../stores/auth'
import logo from '../assets/ar - بنفسجي.png'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const userName = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const error = ref<ApiError | null>(null)
const touched = ref(false)

const userNameError = computed(() =>
  touched.value && !userName.value.trim() ? t('login.userNameRequired') : '',
)
const passwordError = computed(() =>
  touched.value && !password.value ? t('login.passwordRequired') : '',
)

/** Field-level errors from ValidationProblemDetails, matched case-insensitively. */
function serverFieldError(field: string): string {
  const fields = error.value?.fieldErrors
  if (!fields) return ''
  const key = Object.keys(fields).find((k) => k.toLowerCase() === field.toLowerCase())
  return key ? (fields[key]?.[0] ?? '') : ''
}

async function submit() {
  touched.value = true
  if (!userName.value.trim() || !password.value || submitting.value) return

  submitting.value = true
  error.value = null

  try {
    await auth.login({ userName: userName.value.trim(), password: password.value })
    const target = typeof route.query.redirect === 'string' ? route.query.redirect : null
    // Never bounce back to /login, and only follow in-app paths.
    const safe = target && target.startsWith('/') && !target.startsWith('/login') ? target : null
    await router.replace(safe ?? { name: 'dashboard' })
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <img class="logo" :src="logo" :alt="t('app.brand')" />
      <h1 class="title">{{ t('login.title') }}</h1>
      <p class="sub">{{ t('login.subtitle') }}</p>

      <!-- Server messages are shown exactly as returned, Arabic included. -->
      <div v-if="error" class="alert alert-error" role="alert">
        {{ error.message }}
        <ul v-if="error.fieldErrorList.length > 1">
          <li v-for="(line, i) in error.fieldErrorList" :key="i">{{ line }}</li>
        </ul>
      </div>

      <form novalidate @submit.prevent="submit">
        <div class="form-field">
          <label class="form-label" for="userName">{{ t('login.userName') }} <span class="req">*</span></label>
          <input
            id="userName"
            v-model="userName"
            class="form-control"
            :class="{ invalid: userNameError || serverFieldError('userName') }"
            type="text"
            autocomplete="username"
            :disabled="submitting"
          />
          <p v-if="userNameError" class="form-error">{{ userNameError }}</p>
          <p v-else-if="serverFieldError('userName')" class="form-error">
            {{ serverFieldError('userName') }}
          </p>
        </div>

        <div class="form-field">
          <label class="form-label" for="password">{{ t('login.password') }} <span class="req">*</span></label>
          <div class="pw">
            <input
              id="password"
              v-model="password"
              class="form-control"
              :class="{ invalid: passwordError || serverFieldError('password') }"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="submitting"
            />
            <button
              type="button"
              class="peek"
              :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M2.5 12S6 5.5 12 5.5c1.6 0 3 .5 4.2 1.1M21.5 12s-3.5 6.5-9.5 6.5c-1.6 0-3-.5-4.2-1.1"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
                <path d="m4 4 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
          <p v-else-if="serverFieldError('password')" class="form-error">
            {{ serverFieldError('password') }}
          </p>
        </div>

        <button type="submit" class="btn btn-primary submit" :disabled="submitting">
          {{ submitting ? t('login.submitting') : t('login.submit') }}
        </button>
      </form>

      <RouterLink class="public-link" :to="{ name: 'survey' }">
        {{ t('login.toSurvey') }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #F7F7FA;
}

.card {
  width: 100%;
  max-width: 400px;
  padding: 34px 28px 28px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--field-border);
  box-shadow: 0 10px 40px rgba(22, 18, 31, 0.06);
}

.logo {
  display: block;
  height: 32px;
  width: auto;
  margin: 0 auto 22px;
}

.title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
}

.sub {
  margin: 6px 0 26px;
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: center;
}

.pw {
  position: relative;
}

.pw .form-control {
  padding-inline-start: 46px;
}

.peek {
  position: absolute;
  inset-inline-start: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-faint);
}

.peek:hover {
  color: var(--brand);
  background: var(--brand-soft);
}

.submit {
  width: 100%;
  height: 48px;
  margin-top: 6px;
}

.public-link {
  display: block;
  margin-top: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
  text-decoration: none;
}

.public-link:hover {
  color: var(--brand);
}
</style>
