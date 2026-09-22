<script setup lang="ts">
import { NOTES_MAX } from '../survey'
import { useI18n } from '../stores/i18n'

defineProps<{ notes: string }>()

const emit = defineEmits<{ 'update:notes': [value: string] }>()

const { t } = useI18n()
</script>

<template>
  <section>
    <h2 class="heading">{{ t('survey.notesTitle') }}</h2>

    <label class="label" for="notes">
      {{ t('survey.notesLabel') }} <span class="optional">{{ t('survey.optional') }}</span>
    </label>

    <div class="wrap">
      <textarea
        id="notes"
        class="area"
        rows="5"
        :maxlength="NOTES_MAX"
        :placeholder="t('survey.notesPlaceholder')"
        :value="notes"
        @input="emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <span class="counter" aria-live="polite">{{ notes.length }} / {{ NOTES_MAX }}</span>
    </div>

    <p class="note">{{ t('survey.notesDisclaimer') }}</p>
  </section>
</template>

<style scoped>
.heading {
  margin: 0 0 24px;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.6;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.optional {
  font-weight: 400;
  color: var(--text-faint);
}

.wrap {
  position: relative;
}

.area {
  width: 100%;
  padding: 14px 16px 30px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-md);
  background: var(--field);
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--text);
  resize: vertical;
  min-height: 130px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.area::placeholder {
  color: var(--text-faint);
}

.area:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--brand);
}

.counter {
  position: absolute;
  bottom: 12px;
  inset-inline-start: 14px;
  font-size: 0.7rem;
  color: var(--text-faint);
  pointer-events: none;
}

.note {
  margin: 12px 0 0;
  font-size: 0.68rem;
  line-height: 1.7;
  color: var(--text-faint);
  text-align: center;
}

@media (min-width: 768px) {
  .heading {
    font-size: 1.65rem;
  }

  .area {
    min-height: 160px;
  }
}
</style>
