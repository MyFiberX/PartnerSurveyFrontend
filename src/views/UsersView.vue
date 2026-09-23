<script setup lang="ts">
/**
 * Users management — Admin only. Deactivation is the reversible option;
 * delete is permanent and is not offered on the admin's own row.
 */
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import DataPager from '../components/ui/DataPager.vue'
import SearchBox from '../components/ui/SearchBox.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { usePagedList } from '../composables/usePagedList'
import { ApiError } from '../api/http'
import { usersService } from '../api/services'
import type { UserResponse } from '../api/types'
import { auth } from '../stores/auth'
import { toast } from '../stores/toast'
import { formatDateTime, roleLabel } from '../utils/format'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const list = usePagedList<UserResponse>((params, signal) => usersService.list(params, signal))

onMounted(() => void list.load())

const target = ref<UserResponse | null>(null)
const busy = ref(false)

const dialogTitle = computed(() =>
  target.value?.isActive ? t('users.deactivateTitle') : t('users.activateTitle'),
)

const dialogMessage = computed(() => {
  if (!target.value) return ''
  const name = target.value.userName
  return target.value.isActive
    ? t('users.confirmDeactivate', { name })
    : t('users.confirmActivate', { name })
})

function ask(user: UserResponse) {
  target.value = user
}

async function confirm() {
  if (!target.value || busy.value) return
  busy.value = true

  const user = target.value
  const nextActive = !user.isActive

  try {
    // isActive travels as a query parameter; this endpoint takes no body.
    const { data, message } = await usersService.setActive(user.id, nextActive)
    toast.success(message ?? t('users.statusUpdated'))

    // Reflect the change immediately, then resync with the server.
    const row = list.items.value.find((u) => u.id === user.id)
    if (row) row.isActive = data.isActive

    target.value = null
    await list.load()
  } catch (cause) {
    const err =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    toast.error(err.message)
    target.value = null
  } finally {
    busy.value = false
  }
}

/* ---- permanent delete ---- */

const deleteTarget = ref<UserResponse | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true

  try {
    const { message } = await usersService.remove(deleteTarget.value.id)
    toast.success(message ?? t('users.deleted'))
    deleteTarget.value = null
    await list.load()
  } catch (cause) {
    const err =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    toast.error(err.message)
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('users.title') }}</h2>
        <p class="sub">{{ t('users.subtitle2') }}</p>
      </div>
      <button type="button" class="btn btn-outline" :disabled="list.loading.value" @click="list.load()">
        {{ t('common.refresh') }}
      </button>
    </div>

    <section class="card">
      <div class="toolbar">
        <div class="grow">
          <SearchBox
            v-model="list.search.value"
            :placeholder="t('users.search')"
            :busy="list.searching.value"
          />
        </div>
      </div>

      <StateBlock v-if="list.loading.value && !list.loaded.value" variant="loading" :title="t('common.loading')" />

      <StateBlock
        v-else-if="list.error.value"
        variant="error"
        :title="t('users.loadFailed')"
        :message="list.error.value.message"
        retryable
        @retry="list.load()"
      />

      <StateBlock
        v-else-if="list.items.value.length === 0"
        variant="empty"
        :title="list.search.value ? t('surveys.noResults') : t('users.empty')"
        :message="list.search.value ? t('users.noResultsHint') : ''"
      />

      <template v-else>
        <div class="table-scroll" :class="{ dim: list.loading.value }">
          <table class="data">
            <thead>
              <tr>
                <th>{{ t('users.userName') }}</th>
                <th>{{ t('users.role') }}</th>
                <th>{{ t('users.status') }}</th>
                <th>{{ t('users.createdAt') }}</th>
                <th>{{ t('users.lastLoginShort') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in list.items.value" :key="u.id">
                <td>
                  {{ u.userName }}
                  <span v-if="u.id === auth.user.value?.id" class="you">{{ t('users.you') }}</span>
                </td>
                <td>
                  <span class="badge" :class="u.role === 'Admin' ? 'admin' : 'user'">
                    {{ roleLabel(u.role) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="u.isActive ? 'on' : 'off'">
                    {{ u.isActive ? t('status.active') : t('status.inactive') }}
                  </span>
                </td>
                <td class="muted">{{ formatDateTime(u.createAt) }}</td>
                <td class="muted">{{ formatDateTime(u.lastLoginAt) }}</td>
                <td>
                  <div class="row-actions">
                    <RouterLink
                      class="btn btn-outline btn-sm"
                      :to="{ name: 'user-details', params: { id: u.id } }"
                    >
                      {{ t('common.details') }}
                    </RouterLink>
                    <button type="button" class="btn btn-outline btn-sm" @click="ask(u)">
                      {{ u.isActive ? t('users.deactivateLabel') : t('users.activate') }}
                    </button>
                    <button
                      v-if="u.id !== auth.user.value?.id"
                      type="button"
                      class="btn btn-danger btn-sm"
                      @click="deleteTarget = u"
                    >
                      {{ t('common.delete') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <DataPager
          v-model:page-number="list.pageNumber.value"
          v-model:page-size="list.pageSize.value"
          :total-count="list.totalCount.value"
          :total-pages="list.totalPages.value"
          :has-previous="list.hasPrevious.value"
          :has-next="list.hasNext.value"
          :disabled="list.loading.value"
        />
      </template>
    </section>

    <ConfirmDialog
      :open="target !== null"
      :title="dialogTitle"
      :message="dialogMessage"
      :confirm-label="target?.isActive ? t('users.deactivateLabel') : t('users.activate')"
      :tone="target?.isActive ? 'danger' : 'brand'"
      :busy="busy"
      @confirm="confirm"
      @cancel="target = null"
    />

    <ConfirmDialog
      :open="deleteTarget !== null"
      :title="t('users.deleteTitle')"
      :message="deleteTarget ? t('users.confirmDelete', { name: deleteTarget.userName }) : ''"
      :confirm-label="t('common.deletePermanently')"
      tone="danger"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </DashboardLayout>
</template>

<style scoped>
.dim {
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.you {
  margin-inline-start: 5px;
  font-size: 0.72rem;
  color: var(--text-faint);
}
</style>
