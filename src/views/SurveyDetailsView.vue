<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { ApiError } from '../api/http'
import { byOrderAsc, collectAll } from '../api/collect'
import { ratingCriteriaService, ratingsService, surveysService } from '../api/services'
import type { RatingCriterionResponse, RatingResponse, SurveyResponse } from '../api/types'
import { auth } from '../stores/auth'
import { toast } from '../stores/toast'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const survey = ref<SurveyResponse | null>(null)
const loading = ref(true)
const error = ref<ApiError | null>(null)

const ratings = ref<RatingResponse[]>([])
const criteria = ref<RatingCriterionResponse[]>([])
const ratingsLoading = ref(true)
const ratingsError = ref<ApiError | null>(null)
/** True when the ratings walk hit its page cap, so the list may be partial. */
const ratingsTruncated = ref(false)

let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()

  loading.value = true
  error.value = null

  try {
    const { data } = await surveysService.getById(String(route.params.id), controller.signal)
    survey.value = data
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    survey.value = null
  } finally {
    loading.value = false
  }
}

/**
 * The API has no "ratings of survey X" endpoint and GET /api/Surveys/{id}
 * carries none, so every rating is fetched and filtered by responseId here.
 * This does not scale; a dedicated endpoint should replace it.
 */
async function loadRatings() {
  ratingsLoading.value = true
  ratingsError.value = null

  const signal = controller?.signal
  const id = String(route.params.id)

  try {
    const [all, criteriaPage] = await Promise.all([
      collectAll(ratingsService.list, { signal }),
      collectAll(ratingCriteriaService.list, { signal }),
    ])

    ratings.value = all.items.filter((r) => r.responseId === id)
    ratingsTruncated.value = all.truncated
    criteria.value = byOrderAsc(criteriaPage.items)
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    ratingsError.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    ratings.value = []
  } finally {
    ratingsLoading.value = false
  }
}

/** Scores joined to their criterion, ordered like the public form. */
const scored = computed(() => {
  const byId = new Map(ratings.value.map((r) => [r.criterionId, r]))

  const known = criteria.value
    .filter((c) => byId.has(c.id))
    .map((c) => ({
      id: c.id,
      ratingId: byId.get(c.id)!.id,
      label: c.labelAr,
      score: byId.get(c.id)!.score,
      scaleMax: Math.max(c.scaleMin, c.scaleMax),
    }))

  // A rating whose criterion is missing still shows, rather than vanishing.
  const orphans = ratings.value
    .filter((r) => !criteria.value.some((c) => c.id === r.criterionId))
    .map((r) => ({
      id: r.criterionId,
      ratingId: r.id,
      label: t('ratings.deletedCriterion'),
      score: r.score,
      scaleMax: null,
    }))

  return [...known, ...orphans]
})

onMounted(async () => {
  await load()
  await loadRatings()
})
onBeforeUnmount(() => controller?.abort())

/* ---- permanent delete (Admin only) ---- */

type ScoredRow = (typeof scored.value)[number]

const surveyDeleteOpen = ref(false)
const ratingTarget = ref<ScoredRow | null>(null)
const deleting = ref(false)

function toError(cause: unknown): ApiError {
  return cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
}

async function confirmDeleteSurvey() {
  if (!survey.value || deleting.value) return
  deleting.value = true

  try {
    const { message } = await surveysService.remove(survey.value.id)
    toast.success(message ?? t('surveys.deleted'))
    surveyDeleteOpen.value = false
    await router.push({ name: 'surveys' })
  } catch (cause) {
    toast.error(toError(cause).message)
    surveyDeleteOpen.value = false
  } finally {
    deleting.value = false
  }
}

async function confirmDeleteRating() {
  if (!ratingTarget.value || deleting.value) return
  deleting.value = true

  try {
    const { message } = await ratingsService.remove(ratingTarget.value.ratingId)
    toast.success(message ?? t('ratings.deleted'))
    ratingTarget.value = null
    await loadRatings()
  } catch (cause) {
    toast.error(toError(cause).message)
    ratingTarget.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('surveys.detailsTitle') }}</h2>
        <p class="sub">{{ t('common.serverData') }}</p>
      </div>
      <div class="head-actions">
        <button
          v-if="auth.isAdmin.value && survey && !loading"
          type="button"
          class="btn btn-danger"
          @click="surveyDeleteOpen = true"
        >
          {{ t('common.delete') }}
        </button>
        <RouterLink class="btn btn-outline" :to="{ name: 'surveys' }">{{ t('common.back') }}</RouterLink>
      </div>
    </div>

    <section class="card card-pad">
      <StateBlock v-if="loading" variant="loading" :title="t('common.loading')" />

      <!-- A 404 carries the server's own message: "الاستبيان غير موجود" -->
      <StateBlock
        v-else-if="error"
        variant="error"
        :title="error.status === 404 ? t('common.notFound') : t('surveys.loadOneFailed')"
        :message="error.message"
        :retryable="error.status !== 404"
        @retry="load"
      />

      <dl v-else-if="survey" class="detail-list">
        <div class="detail-row">
          <dt>{{ t('common.id') }}</dt>
          <dd dir="ltr">{{ survey.id }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('surveys.companyFull') }}</dt>
          <dd>{{ survey.companyName }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('surveys.phone') }}</dt>
          <dd dir="ltr">{{ survey.phone }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('surveys.feedback') }}</dt>
          <dd class="feedback">{{ survey.feedback || '—' }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="survey && !loading" class="card ratings">
      <header class="ratings-head">
        <h3>{{ t('ratings.title') }}</h3>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          :disabled="ratingsLoading"
          @click="loadRatings"
        >
          {{ t('common.refresh') }}
        </button>
      </header>

      <StateBlock v-if="ratingsLoading" variant="loading" :title="t('ratings.loading')" />

      <StateBlock
        v-else-if="ratingsError"
        variant="error"
        :title="t('ratings.loadFailed')"
        :message="ratingsError.message"
        retryable
        @retry="loadRatings"
      />

      <StateBlock
        v-else-if="scored.length === 0"
        variant="empty"
        :title="t('ratings.empty')"
        :message="t('ratings.emptyHint')"
      />

      <template v-else>
        <p v-if="ratingsTruncated" class="warn">
          {{ t('ratings.truncated') }}
        </p>

        <div class="table-scroll">
          <table class="data">
            <thead>
              <tr>
                <th>{{ t('ratings.criterion') }}</th>
                <th>{{ t('ratings.score') }}</th>
                <th v-if="auth.isAdmin.value">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in scored" :key="row.ratingId">
                <td>{{ row.label }}</td>
                <td>
                  <strong>{{ row.score }}</strong>
                  <span v-if="row.scaleMax" class="muted"> / {{ row.scaleMax }}</span>
                </td>
                <td v-if="auth.isAdmin.value">
                  <button type="button" class="btn btn-danger btn-sm" @click="ratingTarget = row">
                    {{ t('common.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <ConfirmDialog
      :open="surveyDeleteOpen"
      :title="t('surveys.deleteTitle')"
      :message="survey ? t('surveys.confirmDelete', { name: survey.companyName }) : ''"
      :confirm-label="t('common.deletePermanently')"
      tone="danger"
      :busy="deleting"
      @confirm="confirmDeleteSurvey"
      @cancel="surveyDeleteOpen = false"
    />

    <ConfirmDialog
      :open="ratingTarget !== null"
      :title="t('ratings.deleteTitle')"
      :message="ratingTarget ? t('ratings.confirmDelete', { name: ratingTarget.label }) : ''"
      :confirm-label="t('common.deletePermanently')"
      tone="danger"
      :busy="deleting"
      @confirm="confirmDeleteRating"
      @cancel="ratingTarget = null"
    />
  </DashboardLayout>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
}

.feedback {
  white-space: pre-wrap;
  line-height: 1.8;
}

.ratings {
  margin-top: 18px;
}

.ratings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.ratings-head h3 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
}

.warn {
  margin: 0 16px 12px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
