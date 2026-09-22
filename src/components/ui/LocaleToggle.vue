<script setup lang="ts">
/** Switches between Arabic and English. Labelled in the target language. */
import { useI18n } from '../../stores/i18n'

defineProps<{ variant?: 'light' | 'dark' }>()

const { t, toggle, locale } = useI18n()
</script>

<template>
  <button
    type="button"
    class="locale"
    :class="variant ?? 'light'"
    :lang="locale === 'ar' ? 'en' : 'ar'"
    :title="t('app.switchTo')"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" stroke-width="1.5" />
      <path
        d="M12 3.4c2.2 2.3 3.3 5.1 3.3 8.6s-1.1 6.3-3.3 8.6c-2.2-2.3-3.3-5.1-3.3-8.6S9.8 5.7 12 3.4Z"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path d="M3.6 12h16.8" stroke="currentColor" stroke-width="1.5" />
    </svg>
    {{ t('app.switchTo') }}
  </button>
</template>

<style scoped>
.locale {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--font);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.locale.light {
  border-color: var(--field-border);
  background: var(--surface);
  color: var(--text-muted);
}

.locale.light:hover {
  border-color: var(--brand);
  color: var(--brand);
}

/* For the purple survey/success screens. */
.locale.dark {
  border-color: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.92);
}

.locale.dark:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.6);
}
</style>
