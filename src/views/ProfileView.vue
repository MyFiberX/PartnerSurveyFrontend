<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { ApiError } from '../api/http'
import { usersService } from '../api/services'
import type { UserResponse } from '../api/types'
import { auth } from '../stores/auth'
import { formatDateTime, roleLabel } from '../utils/format'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const profile = ref<UserResponse | null>(null)
const loading = ref(true)
const error = ref<ApiError | null>(null)

let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()

  loading.value = true
  error.value = null

  try {
    const { data } = await usersService.me(controller.signal)
    profile.value = data
    // Refresh the cached user so the layout reflects any server-side change.
    auth.setUser(data)
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    profile.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('profile.title') }}</h2>
        <p class="sub">{{ t('profile.subtitle') }}</p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn btn-outline" :disabled="loading" @click="load">{{ t('common.refresh') }}</button>
        <RouterLink class="btn btn-primary" :to="{ name: 'change-password' }">
          {{ t('password.title') }}
        </RouterLink>
      </div>
    </div>

    <section class="card card-pad">
      <StateBlock v-if="loading" variant="loading" :title="t('common.loading')" />

      <!--
        Known server messages here:
        401 "الرمز غير صالح" · 404 "المستخدم غير موجود"
      -->
      <StateBlock
        v-else-if="error"
        variant="error"
        :title="t('profile.loadFailed')"
        :message="error.message"
        retryable
        @retry="load"
      />

      <dl v-else-if="profile" class="detail-list">
        <div class="detail-row">
          <dt>{{ t('users.userName') }}</dt>
          <dd>{{ profile.userName }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.role') }}</dt>
          <dd>
            <span class="badge" :class="profile.role === 'Admin' ? 'admin' : 'user'">
              {{ roleLabel(profile.role) }}
            </span>
          </dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.status') }}</dt>
          <dd>
            <span class="badge" :class="profile.isActive ? 'on' : 'off'">
              {{ profile.isActive ? t('status.active') : t('status.inactive') }}
            </span>
          </dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.createdAt') }}</dt>
          <dd>{{ formatDateTime(profile.createAt) }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.lastLogin') }}</dt>
          <dd>{{ formatDateTime(profile.lastLoginAt) }}</dd>
        </div>
      </dl>
    </section>
  </DashboardLayout>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
}
</style>
