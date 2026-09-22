<script setup lang="ts">
/**
 * Landing page. Every figure shown is PagedResult.totalCount from the server —
 * the API has no statistics endpoint, so nothing here is derived from the
 * current page's item count.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { ApiError } from '../api/http'
import { ratingCriteriaService, surveysService, usersService } from '../api/services'
import type { SurveyResponse } from '../api/types'
import { auth } from '../stores/auth'
import { useI18n } from '../stores/i18n'

const { t, isRtl } = useI18n()

const surveysTotal = ref<number | null>(null)
const criteriaTotal = ref<number | null>(null)
const usersTotal = ref<number | null>(null)
const recent = ref<SurveyResponse[]>([])

const loading = ref(true)
const error = ref<ApiError | null>(null)

let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal

  loading.value = true
  error.value = null

  try {
    // Five recent surveys double as the "latest" list and the surveys total.
    const surveys = await surveysService.list({ pageNumber: 1, pageSize: 5 }, signal)
    surveysTotal.value = surveys.data.totalCount
    recent.value = surveys.data.items

    const criteria = await ratingCriteriaService.list({ pageNumber: 1, pageSize: 1 }, signal)
    criteriaTotal.value = criteria.data.totalCount

    // Users is Admin-only; a non-admin simply gets no card rather than an error.
    if (auth.isAdmin.value) {
      const users = await usersService.list({ pageNumber: 1, pageSize: 1 }, signal)
      usersTotal.value = users.data.totalCount
    }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
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
        <h2>{{ t('dashboard.greeting', { name: auth.user.value?.userName ?? '' }) }}</h2>
        <p class="sub">{{ t('dashboard.subtitle') }}</p>
      </div>
      <button type="button" class="btn btn-outline" :disabled="loading" @click="load">{{ t('common.refresh') }}</button>
    </div>

    <StateBlock v-if="loading" variant="loading" :title="t('common.loading')" />

    <StateBlock
      v-else-if="error"
      variant="error"
      :title="t('dashboard.loadFailed')"
      :message="error.message"
      retryable
      @retry="load"
    />

    <template v-else>
      <div class="cards">
        <RouterLink class="stat" :to="{ name: 'surveys' }">
          <span class="label">{{ t('surveys.title') }}</span>
          <span class="value">{{ surveysTotal ?? '—' }}</span>
          <span class="go">{{ t('common.viewAll') }} {{ isRtl ? '←' : '→' }}</span>
        </RouterLink>

        <RouterLink class="stat" :to="{ name: 'rating-criteria' }">
          <span class="label">{{ t('criteria.title') }}</span>
          <span class="value">{{ criteriaTotal ?? '—' }}</span>
          <span class="go">{{ t('common.viewAll') }} {{ isRtl ? '←' : '→' }}</span>
        </RouterLink>

        <RouterLink v-if="auth.isAdmin.value" class="stat" :to="{ name: 'users' }">
          <span class="label">{{ t('users.title') }}</span>
          <span class="value">{{ usersTotal ?? '—' }}</span>
          <span class="go">{{ t('common.viewAll') }} {{ isRtl ? '←' : '→' }}</span>
        </RouterLink>
      </div>

      <section class="card recent">
        <header class="recent-head">
          <h3>{{ t('dashboard.recent') }}</h3>
          <RouterLink class="btn btn-outline btn-sm" :to="{ name: 'surveys' }">
            {{ t('common.viewAll') }}
          </RouterLink>
        </header>

        <StateBlock
          v-if="recent.length === 0"
          variant="empty"
          :title="t('surveys.empty')"
          :message="t('surveys.emptyHint')"
        />

        <div v-else class="table-scroll">
          <table class="data">
            <thead>
              <tr>
                <th>{{ t('surveys.company') }}</th>
                <th>{{ t('surveys.phone') }}</th>
                <th>{{ t('surveys.feedback') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in recent" :key="s.id">
                <td>{{ s.companyName }}</td>
                <td dir="ltr">{{ s.phone }}</td>
                <td class="truncate muted">{{ s.feedback || '—' }}</td>
                <td>
                  <RouterLink
                    class="btn btn-outline btn-sm"
                    :to="{ name: 'survey-details', params: { id: s.id } }"
                  >
                    {{ t('common.details') }}
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </DashboardLayout>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-md);
  background: var(--surface);
  text-decoration: none;
  transition: border-color 0.18s ease, transform 0.12s ease;
}

.stat:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
}

.label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.value {
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--brand);
  line-height: 1.2;
}

.go {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-faint);
}

.stat:hover .go {
  color: var(--brand);
}

.recent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.recent-head h3 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
}
</style>
