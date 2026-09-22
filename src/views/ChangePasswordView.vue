<script setup lang="ts">
/**
 * PUT /api/Users/me/password.
 *
 * `confirmNewPassword` is a frontend-only field and is never sent: the API's
 * ChangePasswordRequest accepts only currentPassword and newPassword.
 *
 * The controller maps every failure to 400 — including "user not found" — so
 * this page branches on the server message rather than on the status code.
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import { ApiError } from '../api/http'
import { usersService } from '../api/services'
import { auth } from '../stores/auth'
import { toast } from '../stores/toast'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const router = useRouter()

const form = reactive({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
const show = reactive({ current: false, next: false, confirm: false })

const submitting = ref(false)
const touched = ref(false)
const error = ref<ApiError | null>(null)

/** Mirrors the server's [StringLength(100, MinimumLength = 6)] on newPassword. */
const NEW_MIN = 6
const NEW_MAX = 100

const currentError = computed(() =>
  touched.value && !form.currentPassword ? t('password.currentRequired') : '',
)

const newError = computed(() => {
  if (!touched.value) return ''
  if (!form.newPassword) return t('password.newRequired')
  if (form.newPassword.length < NEW_MIN) return t('password.tooShort', { min: NEW_MIN })
  if (form.newPassword.length > NEW_MAX) return t('password.tooLong', { max: NEW_MAX })
  return ''
})

const confirmError = computed(() => {
  if (!touched.value || !form.confirmNewPassword) {
    return touched.value ? t('password.confirmRequired') : ''
  }
  return form.confirmNewPassword !== form.newPassword ? t('password.mismatch') : ''
})

const valid = computed(() => !currentError.value && !newError.value && !confirmError.value)

function serverFieldError(name: string): string {
  const fields = error.value?.fieldErrors
  if (!fields) return ''
  const key = Object.keys(fields).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? (fields[key]?.[0] ?? '') : ''
}

async function submit() {
  touched.value = true
  if (!valid.value || submitting.value) return

  submitting.value = true
  error.value = null

  try {
    // confirmNewPassword is deliberately excluded from this payload.
    const { data, message } = await usersService.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })

    auth.setUser(data)
    toast.success(message ?? t('password.saved'))

    form.currentPassword = ''
    form.newPassword = ''
    form.confirmNewPassword = ''
    touched.value = false

    await router.push({ name: 'profile' })
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('password.title') }}</h2>
        <p class="sub">{{ t('password.subtitle2', { min: NEW_MIN, max: NEW_MAX }) }}</p>
      </div>
      <RouterLink class="btn btn-outline" :to="{ name: 'profile' }">{{ t('common.back') }}</RouterLink>
    </div>

    <section class="card card-pad form-card">
      <div v-if="error" class="alert alert-error" role="alert">
        {{ error.message }}
        <ul v-if="error.fieldErrorList.length > 1">
          <li v-for="(line, i) in error.fieldErrorList" :key="i">{{ line }}</li>
        </ul>
      </div>

      <form novalidate @submit.prevent="submit">
        <div class="form-field">
          <label class="form-label" for="currentPassword">
            {{ t('password.current') }} <span class="req">*</span>
          </label>
          <div class="pw">
            <input
              id="currentPassword"
              v-model="form.currentPassword"
              class="form-control"
              :class="{ invalid: currentError || serverFieldError('currentPassword') }"
              :type="show.current ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="submitting"
            />
            <button
              type="button"
              class="peek"
              :aria-label="show.current ? t('password.hide') : t('password.show')"
              @click="show.current = !show.current"
            >
              {{ show.current ? t('password.hide') : t('password.show') }}
            </button>
          </div>
          <p v-if="currentError" class="form-error">{{ currentError }}</p>
          <p v-else-if="serverFieldError('currentPassword')" class="form-error">
            {{ serverFieldError('currentPassword') }}
          </p>
        </div>

        <div class="form-field">
          <label class="form-label" for="newPassword">
            {{ t('password.new') }} <span class="req">*</span>
          </label>
          <div class="pw">
            <input
              id="newPassword"
              v-model="form.newPassword"
              class="form-control"
              :class="{ invalid: newError || serverFieldError('newPassword') }"
              :type="show.next ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="submitting"
            />
            <button
              type="button"
              class="peek"
              :aria-label="show.next ? t('password.hide') : t('password.show')"
              @click="show.next = !show.next"
            >
              {{ show.next ? t('password.hide') : t('password.show') }}
            </button>
          </div>
          <p v-if="newError" class="form-error">{{ newError }}</p>
          <p v-else-if="serverFieldError('newPassword')" class="form-error">
            {{ serverFieldError('newPassword') }}
          </p>
        </div>

        <div class="form-field">
          <label class="form-label" for="confirmNewPassword">
            {{ t('password.confirm') }} <span class="req">*</span>
          </label>
          <div class="pw">
            <input
              id="confirmNewPassword"
              v-model="form.confirmNewPassword"
              class="form-control"
              :class="{ invalid: confirmError }"
              :type="show.confirm ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="submitting"
            />
            <button
              type="button"
              class="peek"
              :aria-label="show.confirm ? t('password.hide') : t('password.show')"
              @click="show.confirm = !show.confirm"
            >
              {{ show.confirm ? t('password.hide') : t('password.show') }}
            </button>
          </div>
          <p v-if="confirmError" class="form-error">{{ confirmError }}</p>
          <p v-else class="form-hint">{{ t('password.confirmHint') }}</p>
        </div>

        <button type="submit" class="btn btn-primary submit" :disabled="submitting">
          {{ submitting ? t('common.saving') : t('password.save') }}
        </button>
      </form>
    </section>
  </DashboardLayout>
</template>

<style scoped>
.form-card {
  max-width: 460px;
}

.pw {
  position: relative;
}

.pw .form-control {
  padding-inline-start: 64px;
}

.peek {
  position: absolute;
  inset-inline-start: 6px;
  top: 50%;
  transform: translateY(-50%);
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
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
</style>
