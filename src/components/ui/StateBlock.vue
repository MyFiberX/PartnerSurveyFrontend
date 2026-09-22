<script setup lang="ts">
/** Shared loading / empty / error placeholder for API-driven pages. */
import { useI18n } from '../../stores/i18n'

const { t } = useI18n()

defineProps<{
  variant: 'loading' | 'empty' | 'error'
  title?: string
  message?: string | null
  /** Extra lines, e.g. ValidationProblemDetails field errors. */
  details?: string[]
  retryable?: boolean
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="state" :class="variant" role="status" aria-live="polite">
    <div v-if="variant === 'loading'" class="spinner" aria-hidden="true"></div>

    <svg
      v-else-if="variant === 'empty'"
      viewBox="0 0 24 24"
      width="34"
      height="34"
      fill="none"
      aria-hidden="true"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6" />
      <path d="M7.5 9.5h9M7.5 13.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>

    <svg v-else viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" />
      <path d="M12 7.5v5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="16.2" r="1.1" fill="currentColor" />
    </svg>

    <p v-if="title" class="title">{{ title }}</p>
    <p v-if="message" class="msg">{{ message }}</p>

    <ul v-if="details && details.length" class="details">
      <li v-for="(line, i) in details" :key="i">{{ line }}</li>
    </ul>

    <button v-if="retryable" type="button" class="retry" @click="$emit('retry')">
      {{ t('common.retry') }}
    </button>
  </div>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  text-align: center;
  color: var(--text-muted);
}

.state.error {
  color: #B33A3A;
}

.title {
  margin: 4px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.state.error .title {
  color: #B33A3A;
}

.msg {
  margin: 0;
  font-size: 0.85rem;
  max-width: 46ch;
  line-height: 1.7;
}

.details {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.78rem;
  line-height: 1.8;
}

.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid var(--track);
  border-top-color: var(--brand);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry {
  margin-top: 8px;
  height: 40px;
  padding: 0 22px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--brand);
}

.retry:hover {
  border-color: var(--brand);
  background: var(--brand-soft);
}
</style>
