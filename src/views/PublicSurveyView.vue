<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import SurveyHeader from '../components/SurveyHeader.vue'
import StepContact from '../components/StepContact.vue'
import StepRatings from '../components/StepRatings.vue'
import StepNotes from '../components/StepNotes.vue'
import SurveySuccess from '../components/SurveySuccess.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { isValidPhone } from '../survey'
import { useI18n } from '../stores/i18n'
import { ApiError } from '../api/http'
import { byOrderAsc, collectAll } from '../api/collect'
import { ratingCriteriaService, ratingsService, surveysService } from '../api/services'
import type { RatingCriterionResponse } from '../api/types'

const TOTAL_STEPS = 3

const { t, isRtl } = useI18n()

const step = ref(1)
const submitted = ref(false)
const sending = ref(false)
const showErrors = ref(false)
const submitError = ref<ApiError | null>(null)

/** Criteria come from the API; the form cannot be shown until they arrive. */
const criteria = ref<RatingCriterionResponse[]>([])
const loadingCriteria = ref(true)
const criteriaError = ref<ApiError | null>(null)

const form = reactive({
  companyName: '',
  phone: '',
  notes: '',
  /** Keyed by criterion id. */
  ratings: {} as Record<string, number | null>,
})

let criteriaController: AbortController | null = null

/**
 * The list endpoint returns inactive criteria too and sorts by `order` DESC,
 * so the active ones are filtered and re-sorted ascending here.
 */
async function loadCriteria() {
  criteriaController?.abort()
  criteriaController = new AbortController()

  loadingCriteria.value = true
  criteriaError.value = null

  try {
    const { items } = await collectAll(ratingCriteriaService.list, {
      signal: criteriaController.signal,
    })
    const active = byOrderAsc(items.filter((c) => c.isActive))
    criteria.value = active
    form.ratings = Object.fromEntries(active.map((c) => [c.id, null]))
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    criteriaError.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
  } finally {
    loadingCriteria.value = false
  }
}

onMounted(loadCriteria)
onBeforeUnmount(() => criteriaController?.abort())

const phoneValid = computed(() => isValidPhone(form.phone))

const stepValid = computed(() => {
  if (step.value === 1) return form.companyName.trim().length > 0 && phoneValid.value
  // Only required criteria gate the step.
  if (step.value === 2)
    return criteria.value.every((c) => !c.isRequired || form.ratings[c.id] != null)
  return true
})

// Clear the error state as soon as the user fixes the current step.
watch(stepValid, (ok) => {
  if (ok) showErrors.value = false
})

function rate(criterionId: string, value: number) {
  form.ratings[criterionId] = value
}

function next() {
  if (!stepValid.value) {
    showErrors.value = true
    return
  }
  showErrors.value = false
  step.value = Math.min(step.value + 1, TOTAL_STEPS)
  scrollTop()
}

function back() {
  showErrors.value = false
  step.value = Math.max(step.value - 1, 1)
  scrollTop()
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * Returns to a blank survey after the success screen.
 *
 * The submit-resume ids must be cleared too: keeping them would attach the
 * next partner's scores to the survey that was just submitted.
 */
function restart() {
  createdSurveyId.value = null
  savedCriterionIds.value = new Set()

  form.companyName = ''
  form.phone = ''
  form.notes = ''
  form.ratings = Object.fromEntries(criteria.value.map((c) => [c.id, null]))

  submitError.value = null
  showErrors.value = false
  step.value = 1
  submitted.value = false

  window.scrollTo({ top: 0 })
}

/**
 * Submission is not atomic: the survey and each score are separate requests.
 * These two ids survive a failed attempt so a retry resumes instead of
 * creating a second survey or re-sending a score the server already stored
 * (which its unique (responseId, criterionId) constraint would reject).
 */
const createdSurveyId = ref<string | null>(null)
const savedCriterionIds = ref<Set<string>>(new Set())

async function submit() {
  if (sending.value) return
  sending.value = true
  submitError.value = null

  try {
    if (!createdSurveyId.value) {
      const { data } = await surveysService.create({
        companyName: form.companyName.trim(),
        phone: form.phone,
        feedback: form.notes.trim() || null,
      })
      createdSurveyId.value = data.id
    }

    const responseId = createdSurveyId.value
    const pending = criteria.value.filter(
      (c) => form.ratings[c.id] != null && !savedCriterionIds.value.has(c.id),
    )

    // Sequential: a shared survey id makes ordering clearer to debug, and the
    // number of criteria is small.
    for (const criterion of pending) {
      await ratingsService.create({
        responseId,
        criterionId: criterion.id,
        score: form.ratings[criterion.id] as number,
      })
      savedCriterionIds.value.add(criterion.id)
    }

    submitted.value = true
  } catch (cause) {
    submitError.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    scrollTop()
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <SurveySuccess v-if="submitted" @done="restart" />

  <div v-else class="shell">
    <div class="card">
      <SurveyHeader :step="step" :total-steps="TOTAL_STEPS" />

      <StateBlock v-if="loadingCriteria" variant="loading" :title="t('survey.loading')" />

      <StateBlock
        v-else-if="criteriaError"
        variant="error"
        :title="t('survey.loadFailed')"
        :message="criteriaError.message"
        retryable
        @retry="loadCriteria"
      />

      <template v-else>
        <main class="content">
          <div v-if="submitError" class="submit-alert" role="alert">
            {{ submitError.message }}
            <!-- The survey itself is already stored; a retry sends only what is left. -->
            <span v-if="createdSurveyId"> {{ t('survey.partialSaved') }}</span>
          </div>

          <StepContact
            v-if="step === 1"
            v-model:company-name="form.companyName"
            v-model:phone="form.phone"
            :show-errors="showErrors"
            :phone-valid="phoneValid"
          />

          <StepRatings
            v-else-if="step === 2"
            :criteria="criteria"
            :ratings="form.ratings"
            :show-errors="showErrors"
            @rate="rate"
          />

          <StepNotes v-else v-model:notes="form.notes" />
        </main>

        <footer class="actions" :class="{ dual: step > 1 }">
          <button v-if="step > 1" type="button" class="btn ghost" @click="back">{{ t('common.back') }}</button>

          <button v-if="step < TOTAL_STEPS" type="button" class="btn primary" @click="next">
            {{ t('survey.next') }}
            <!-- The arrow points along the reading direction, so it flips with the locale. -->
            <span aria-hidden="true">{{ isRtl ? '←' : '→' }}</span>
          </button>

          <button v-else type="button" class="btn primary" :disabled="sending" @click="submit">
            {{
              sending
                ? t('survey.sending')
                : createdSurveyId
                  ? t('survey.resubmit')
                  : t('survey.submit')
            }}
            <span v-if="!sending" aria-hidden="true">{{ isRtl ? '←' : '→' }}</span>
          </button>
        </footer>
      </template>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  background: var(--surface);
}

.card {
  width: 100%;
  max-width: 560px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: calc(env(safe-area-inset-top) + 20px) var(--shell-pad)
    calc(env(safe-area-inset-bottom) + 20px);
}

.content {
  flex: 1;
  padding-top: 30px;
}

.submit-alert {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: #FCEBEA;
  font-size: 0.83rem;
  line-height: 1.7;
  color: #B3382F;
}

.actions {
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 12px;
  padding-top: 24px;
  flex: none;
}

/* Primary sits first in the source so it lands on the right in RTL. */
.actions.dual {
  grid-template-columns: 1fr auto;
}

.btn {
  height: 52px;
  min-height: 52px;
  flex: none;
  width: 100%;
  padding: 0 24px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.12s ease,
    opacity 0.2s ease;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.primary {
  background: var(--brand);
  color: #fff;
}

.primary:hover:not(:disabled) {
  background: var(--brand-dark);
}

.primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ghost {
  padding: 0 32px;
  background: var(--surface);
  border-color: var(--field-border);
  color: var(--text-muted);
}

.ghost:hover {
  border-color: var(--brand);
  color: var(--brand);
}

@media (min-width: 768px) {
  .card {
    padding: 44px 40px;
  }

  .content {
    padding-top: 34px;
  }

  .btn {
    height: 56px;
    font-size: 1rem;
  }
}
</style>
