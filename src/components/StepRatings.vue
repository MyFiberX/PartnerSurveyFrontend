<script setup lang="ts">
/**
 * Scores the criteria fetched from the API. Each criterion carries its own
 * scale, so the chips are built from scaleMin/scaleMax rather than a fixed
 * 1..5. They run high-to-low in source order; the grid follows the document
 * direction, so the best score sits at the reading start in either locale.
 */
import type { RatingCriterionResponse } from '../api/types'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const props = defineProps<{
  criteria: RatingCriterionResponse[]
  ratings: Record<string, number | null>
  showErrors: boolean
}>()

const emit = defineEmits<{
  rate: [criterionId: string, value: number]
}>()

/** Descending: the highest score leads, at the reading start. */
function scaleOf(criterion: RatingCriterionResponse): number[] {
  const min = Math.min(criterion.scaleMin, criterion.scaleMax)
  const max = Math.max(criterion.scaleMin, criterion.scaleMax)
  const values: number[] = []
  for (let value = max; value >= min; value--) values.push(value)
  return values
}

/** Only required criteria block the step; optional ones may stay unanswered. */
function missing(criterion: RatingCriterionResponse) {
  return props.showErrors && criterion.isRequired && props.ratings[criterion.id] == null
}
</script>

<template>
  <section>
    <h2 class="heading">{{ t('survey.ratingsHeading') }}</h2>
    <p class="sub">{{ t('survey.ratingsSub') }}</p>

    <fieldset v-for="criterion in criteria" :key="criterion.id" class="group">
      <legend class="legend">
        <span class="dot" aria-hidden="true"></span>
        {{ criterion.labelAr }}
        <span v-if="!criterion.isRequired" class="optional">{{ t('survey.optional') }}</span>
      </legend>

      <div
        class="scale"
        role="radiogroup"
        :aria-label="criterion.labelAr"
        :style="{ '--steps': scaleOf(criterion).length }"
      >
        <button
          v-for="value in scaleOf(criterion)"
          :key="value"
          type="button"
          role="radio"
          class="chip"
          :class="{ on: ratings[criterion.id] === value }"
          :aria-checked="ratings[criterion.id] === value"
          @click="emit('rate', criterion.id, value)"
        >
          {{ value }}
        </button>
      </div>

      <div class="anchors">
        <span>{{ t('survey.best', { value: Math.max(criterion.scaleMin, criterion.scaleMax) }) }}</span>
        <span>{{ t('survey.worst', { value: Math.min(criterion.scaleMin, criterion.scaleMax) }) }}</span>
      </div>

      <p v-if="missing(criterion)" class="error">{{ t('survey.pickRating') }}</p>
    </fieldset>
  </section>
</template>

<style scoped>
.heading {
  margin: 0 0 4px;
  font-size: 1.45rem;
  font-weight: 800;
}

.sub {
  margin: 0 0 22px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.group {
  margin: 0 0 22px;
  padding: 0;
  border: 0;
}

.legend {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  margin-bottom: 10px;
  font-size: 0.93rem;
  font-weight: 700;
}

.optional {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-faint);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand);
  flex: none;
}

/* Wraps instead of squashing when a criterion defines a wide scale. */
.scale {
  display: grid;
  grid-template-columns: repeat(var(--steps, 5), minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 520px) {
  .scale {
    grid-template-columns: repeat(auto-fit, minmax(46px, 1fr));
  }
}

.chip {
  height: 46px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-sm);
  background: var(--field);
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text);
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    transform 0.12s ease;
}

.chip:hover:not(.on) {
  border-color: var(--brand);
  background: var(--brand-soft);
}

.chip:active {
  transform: scale(0.96);
}

.chip.on {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.anchors {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
  font-size: 0.68rem;
  color: var(--text-faint);
}

.error {
  margin: 6px 0 0;
  font-size: 0.74rem;
  color: #D94A4A;
}

@media (min-width: 768px) {
  .heading {
    font-size: 1.7rem;
  }

  .chip {
    height: 52px;
    font-size: 1.05rem;
  }

  .group {
    margin-bottom: 26px;
  }
}
</style>
