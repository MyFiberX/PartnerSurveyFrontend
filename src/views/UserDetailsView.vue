<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { ApiError } from '../api/http'
import { usersService } from '../api/services'
import type { UserResponse } from '../api/types'
import { toast } from '../stores/toast'
import { formatDateTime, roleLabel } from '../utils/format'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const route = useRoute()

const user = ref<UserResponse | null>(null)
const loading = ref(true)
const error = ref<ApiError | null>(null)

const confirming = ref(false)
const busy = ref(false)

let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()

  loading.value = true
  error.value = null

  try {
    const { data } = await usersService.getById(String(route.params.id), controller.signal)
    user.value = data
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    user.value = null
  } finally {
    loading.value = false
  }
}

async function toggleActive() {
  if (!user.value || busy.value) return
  busy.value = true

  try {
    const { data, message } = await usersService.setActive(user.value.id, !user.value.isActive)
    user.value = data
    toast.success(message ?? t('users.statusUpdated'))
  } catch (cause) {
    const err =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    toast.error(err.message)
  } finally {
    busy.value = false
    confirming.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('users.detailsTitle') }}</h2>
        <p class="sub">{{ t('common.serverData') }}</p>
      </div>
      <div class="head-actions">
        <button
          v-if="user"
          type="button"
          class="btn btn-outline"
          :disabled="busy"
          @click="confirming = true"
        >
          {{ user.isActive ? t('users.deactivateLabel') : t('users.activate') }}
        </button>
        <RouterLink class="btn btn-outline" :to="{ name: 'users' }">{{ t('common.back') }}</RouterLink>
      </div>
    </div>

    <section class="card card-pad">
      <StateBlock v-if="loading" variant="loading" :title="t('common.loading')" />

      <!-- 404 carries the server message: "المستخدم غير موجود" -->
      <StateBlock
        v-else-if="error"
        variant="error"
        :title="error.status === 404 ? t('common.notFound') : t('users.loadOneFailed')"
        :message="error.message"
        :retryable="error.status !== 404"
        @retry="load"
      />

      <dl v-else-if="user" class="detail-list">
        <div class="detail-row">
          <dt>{{ t('common.id') }}</dt>
          <dd dir="ltr">{{ user.id }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.userName') }}</dt>
          <dd>{{ user.userName }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.role') }}</dt>
          <dd>
            <span class="badge" :class="user.role === 'Admin' ? 'admin' : 'user'">
              {{ roleLabel(user.role) }}
            </span>
          </dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.status') }}</dt>
          <dd>
            <span class="badge" :class="user.isActive ? 'on' : 'off'">
              {{ user.isActive ? t('status.active') : t('status.inactive') }}
            </span>
          </dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.createdAt') }}</dt>
          <dd>{{ formatDateTime(user.createAt) }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('users.lastLogin') }}</dt>
          <dd>{{ formatDateTime(user.lastLoginAt) }}</dd>
        </div>
      </dl>
    </section>

    <ConfirmDialog
      :open="confirming"
      :title="user?.isActive ? t('users.deactivateTitle') : t('users.activateTitle')"
      :message="
        user
          ? user.isActive
            ? t('users.confirmDeactivate', { name: user.userName })
            : t('users.confirmActivate', { name: user.userName })
          : ''
      "
      :confirm-label="user?.isActive ? t('users.deactivateLabel') : t('users.activate')"
      :tone="user?.isActive ? 'danger' : 'brand'"
      :busy="busy"
      @confirm="toggleActive"
      @cancel="confirming = false"
    />
  </DashboardLayout>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
}
</style>
