<script setup lang="ts">
/**
 * Surveys list. Columns are limited to the four fields SurveyResponse exposes —
 * createAt/updateAt/ratings are not returned by the API, so they are not shown.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import DataPager from '../components/ui/DataPager.vue'
import SearchBox from '../components/ui/SearchBox.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { usePagedList } from '../composables/usePagedList'
import { ApiError } from '../api/http'
import { byOrderAsc, collectAll } from '../api/collect'
import { ratingCriteriaService, ratingsService, surveysService } from '../api/services'
import type { RatingCriterionResponse, SurveyResponse, SurveyUpdate } from '../api/types'
import { auth } from '../stores/auth'
import { toast } from '../stores/toast'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const list = usePagedList<SurveyResponse>((params, signal) => surveysService.list(params, signal))

/* ---- scores merged into the table ----
 * SurveyResponse carries no ratings and the API has no per-survey ratings
 * endpoint, so every rating and criterion is fetched once and joined here.
 * One column per criterion, ordered like the public form.
 */

const criteria = ref<RatingCriterionResponse[]>([])
/** responseId -> criterionId -> score */
const scores = ref<Map<string, Map<string, number>>>(new Map())
const scoresLoading = ref(true)
const scoresFailed = ref(false)

async function loadScores() {
  scoresLoading.value = true
  scoresFailed.value = false

  try {
    const [allRatings, allCriteria] = await Promise.all([
      collectAll(ratingsService.list),
      collectAll(ratingCriteriaService.list),
    ])

    criteria.value = byOrderAsc(allCriteria.items)

    const next = new Map<string, Map<string, number>>()
    for (const r of allRatings.items) {
      const row = next.get(r.responseId) ?? new Map<string, number>()
      row.set(r.criterionId, r.score)
      next.set(r.responseId, row)
    }
    scores.value = next
  } catch {
    // Scores are supplementary: the table still lists surveys without them.
    scoresFailed.value = true
    criteria.value = []
  } finally {
    scoresLoading.value = false
  }
}

function scoreFor(surveyId: string, criterionId: string): number | null {
  return scores.value.get(surveyId)?.get(criterionId) ?? null
}

/** Average across the criteria this survey actually has, normalised to 100. */
function averageFor(surveyId: string): string {
  const row = scores.value.get(surveyId)
  if (!row || row.size === 0) return '—'

  let sum = 0
  let max = 0
  for (const c of criteria.value) {
    const score = row.get(c.id)
    if (score == null) continue
    const lo = Math.min(c.scaleMin, c.scaleMax)
    const hi = Math.max(c.scaleMin, c.scaleMax)
    // Normalise each scale to 0..1 so mixed ranges stay comparable.
    if (hi > lo) sum += (score - lo) / (hi - lo)
    max += 1
  }
  if (max === 0) return '—'
  return `${Math.round((sum / max) * 100)}%`
}

const showScoreColumns = computed(() => criteria.value.length > 0)

onMounted(() => {
  void list.load()
  void loadScores()
})

// A new or edited survey can bring new scores; refresh the join alongside it.
watch(() => list.items.value, (rows) => {
  if (rows.length && scores.value.size === 0 && !scoresLoading.value && !scoresFailed.value) {
    void loadScores()
  }
})

/* ---- create / edit ---- */

const editorOpen = ref(false)
const editing = ref<SurveyResponse | null>(null)
const saving = ref(false)
const formError = ref<ApiError | null>(null)

const form = reactive({ companyName: '', phone: '', feedback: '' })
/** Snapshot of the record as loaded, so an edit can send only changed fields. */
let original: SurveyResponse | null = null

function openCreate() {
  editing.value = null
  original = null
  form.companyName = ''
  form.phone = ''
  form.feedback = ''
  formError.value = null
  editorOpen.value = true
}

function openEdit(survey: SurveyResponse) {
  editing.value = survey
  original = survey
  form.companyName = survey.companyName
  form.phone = survey.phone
  form.feedback = survey.feedback ?? ''
  formError.value = null
  editorOpen.value = true
}

function close() {
  if (saving.value) return
  editorOpen.value = false
}

function fieldError(name: string): string {
  const fields = formError.value?.fieldErrors
  if (!fields) return ''
  const key = Object.keys(fields).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? (fields[key]?.[0] ?? '') : ''
}

async function save() {
  if (saving.value) return
  saving.value = true
  formError.value = null

  try {
    if (editing.value && original) {
      // SurveyUpdate uses patch semantics: send only what actually changed.
      const patch: SurveyUpdate = {}
      if (form.companyName !== original.companyName) patch.companyName = form.companyName
      if (form.phone !== original.phone) patch.phone = form.phone
      if (form.feedback !== (original.feedback ?? '')) patch.feedback = form.feedback

      const { message } = await surveysService.update(editing.value.id, patch)
      toast.success(message ?? t('surveys.updated'))
    } else {
      const { message } = await surveysService.create({
        companyName: form.companyName,
        phone: form.phone,
        feedback: form.feedback || null,
      })
      toast.success(message ?? t('surveys.created'))
    }

    editorOpen.value = false
    await list.load()
  } catch (cause) {
    formError.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
  } finally {
    saving.value = false
  }
}

/* ---- permanent delete (Admin only) ----
 * Deleting a survey also deletes its ratings server-side, so the score join
 * is reloaded alongside the list.
 */

const deleteTarget = ref<SurveyResponse | null>(null)
const deleteAllOpen = ref(false)
const deleting = ref(false)

function toError(cause: unknown): ApiError {
  return cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
}

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true

  try {
    const { message } = await surveysService.remove(deleteTarget.value.id)
    toast.success(message ?? t('surveys.deleted'))
    deleteTarget.value = null
    await Promise.all([list.load(), loadScores()])
  } catch (cause) {
    toast.error(toError(cause).message)
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

async function confirmDeleteAll() {
  if (deleting.value) return
  deleting.value = true

  try {
    const { data } = await surveysService.removeAll()
    toast.success(
      t('surveys.deletedAll', { surveys: data.deletedSurveys, ratings: data.deletedRatings }),
    )
    deleteAllOpen.value = false
    list.pageNumber.value = 1
    await Promise.all([list.load(), loadScores()])
  } catch (cause) {
    toast.error(toError(cause).message)
    deleteAllOpen.value = false
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('surveys.title') }}</h2>
        <p class="sub">{{ t('surveys.subtitle') }}</p>
      </div>
      <div class="head-actions">
        <button
          type="button"
          class="btn btn-outline"
          :disabled="list.loading.value"
          @click="list.load(); loadScores()"
        >
          {{ t('common.refresh') }}
        </button>
        <button
          v-if="auth.isAdmin.value"
          type="button"
          class="btn btn-danger"
          :disabled="list.totalCount.value === 0"
          @click="deleteAllOpen = true"
        >
          {{ t('surveys.deleteAll') }}
        </button>
        <button type="button" class="btn btn-primary" @click="openCreate">{{ t('surveys.new') }}</button>
      </div>
    </div>

    <section class="card">
      <div class="toolbar">
        <div class="grow">
          <SearchBox
            v-model="list.search.value"
            :placeholder="t('surveys.search')"
            :busy="list.searching.value"
          />
        </div>
      </div>

      <StateBlock v-if="list.loading.value && !list.loaded.value" variant="loading" :title="t('common.loading')" />

      <StateBlock
        v-else-if="list.error.value"
        variant="error"
        :title="t('surveys.loadFailed')"
        :message="list.error.value.message"
        retryable
        @retry="list.load()"
      />

      <StateBlock
        v-else-if="list.items.value.length === 0"
        variant="empty"
        :title="list.search.value ? t('surveys.noResults') : t('surveys.empty')"
        :message="
          list.search.value
            ? t('surveys.noResultsHint')
            : t('surveys.emptyHint')
        "
      />

      <template v-else>
        <div class="table-scroll" :class="{ dim: list.loading.value }">
          <table class="data">
            <thead>
              <tr>
                <th>{{ t('surveys.company') }}</th>
                <th>{{ t('surveys.phone') }}</th>
                <th v-for="c in criteria" :key="c.id" class="score-col" :title="c.labelAr">
                  {{ c.labelAr }}
                </th>
                <th v-if="showScoreColumns" class="score-col">{{ t('surveys.average') }}</th>
                <th>{{ t('surveys.feedback') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in list.items.value" :key="s.id">
                <td>{{ s.companyName }}</td>
                <td dir="ltr">{{ s.phone }}</td>

                <td v-for="c in criteria" :key="c.id" class="score-col">
                  <span v-if="scoreFor(s.id, c.id) !== null" class="score">
                    {{ scoreFor(s.id, c.id) }}<span class="of">/{{ Math.max(c.scaleMin, c.scaleMax) }}</span>
                  </span>
                  <span v-else class="muted">—</span>
                </td>

                <td v-if="showScoreColumns" class="score-col">
                  <strong>{{ averageFor(s.id) }}</strong>
                </td>

                <td class="truncate muted">{{ s.feedback || '—' }}</td>
                <td>
                  <div class="row-actions">
                    <RouterLink
                      class="btn btn-outline btn-sm"
                      :to="{ name: 'survey-details', params: { id: s.id } }"
                    >
                      {{ t('common.details') }}
                    </RouterLink>
                    <button type="button" class="btn btn-outline btn-sm" @click="openEdit(s)">
                      {{ t('common.edit') }}
                    </button>
                    <button
                      v-if="auth.isAdmin.value"
                      type="button"
                      class="btn btn-danger btn-sm"
                      @click="deleteTarget = s"
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

    <!-- Create / edit -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="editorOpen" class="backdrop" role="dialog" aria-modal="true" @click.self="close">
          <div class="modal">
            <h3 class="modal-title">
              {{ editing ? t('surveys.edit') : t('surveys.new') }}
            </h3>

            <div v-if="formError" class="alert alert-error" role="alert">
              {{ formError.message }}
              <ul v-if="formError.fieldErrorList.length > 1">
                <li v-for="(line, i) in formError.fieldErrorList" :key="i">{{ line }}</li>
              </ul>
            </div>

            <form novalidate @submit.prevent="save">
              <div class="form-field">
                <label class="form-label" for="companyName">{{ t('surveys.companyFull') }}</label>
                <input
                  id="companyName"
                  v-model="form.companyName"
                  class="form-control"
                  :class="{ invalid: fieldError('companyName') }"
                  type="text"
                  :disabled="saving"
                />
                <p v-if="fieldError('companyName')" class="form-error">
                  {{ fieldError('companyName') }}
                </p>
              </div>

              <div class="form-field">
                <label class="form-label" for="phone">{{ t('surveys.phone') }}</label>
                <input
                  id="phone"
                  v-model="form.phone"
                  class="form-control"
                  :class="{ invalid: fieldError('phone') }"
                  type="tel"
                  dir="ltr"
                  :disabled="saving"
                />
                <p v-if="fieldError('phone')" class="form-error">{{ fieldError('phone') }}</p>
              </div>

              <div class="form-field">
                <label class="form-label" for="feedback">{{ t('surveys.feedback') }}</label>
                <textarea
                  id="feedback"
                  v-model="form.feedback"
                  class="form-control"
                  :disabled="saving"
                ></textarea>
                <p v-if="editing" class="form-hint">
                  {{ t('surveys.patchHint') }}
                </p>
              </div>

              <div class="modal-actions">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? t('common.saving') : t('common.save') }}
                </button>
                <button type="button" class="btn btn-outline" :disabled="saving" @click="close">
                  {{ t('common.cancel') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :open="deleteTarget !== null"
      :title="t('surveys.deleteTitle')"
      :message="deleteTarget ? t('surveys.confirmDelete', { name: deleteTarget.companyName }) : ''"
      :confirm-label="t('common.deletePermanently')"
      tone="danger"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />

    <ConfirmDialog
      :open="deleteAllOpen"
      :title="t('surveys.deleteAllTitle')"
      :message="t('surveys.confirmDeleteAll')"
      :confirm-label="t('common.deletePermanently')"
      :confirm-word="t('confirm.deleteWord')"
      tone="danger"
      :busy="deleting"
      @confirm="confirmDeleteAll"
      @cancel="deleteAllOpen = false"
    />
  </DashboardLayout>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
}

/* Score columns stay narrow so the company name keeps the room it needs. */
.score-col {
  text-align: center !important;
  white-space: nowrap;
}

th.score-col {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score {
  font-weight: 700;
}

.of {
  font-weight: 400;
  font-size: 0.78em;
  color: var(--text-faint);
}

.dim {
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(22, 18, 31, 0.45);
  overflow-y: auto;
}

.modal {
  width: 100%;
  max-width: 460px;
  padding: 26px 24px 22px;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(22, 18, 31, 0.2);
}

.modal-title {
  margin: 0 0 18px;
  font-size: 1.05rem;
  font-weight: 800;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-top: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
