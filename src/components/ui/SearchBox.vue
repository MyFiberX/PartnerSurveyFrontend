<script setup lang="ts">
/** Debounced server-side search input with a clear button. */
import { computed, ref, watch } from 'vue'
import { useI18n } from '../../stores/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    busy?: boolean
    debounce?: number
  }>(),
  // No default placeholder here: a prop default is evaluated once and would
  // not follow a locale change. `shownPlaceholder` resolves it reactively.
  { busy: false, debounce: 350 },
)

const shownPlaceholder = computed(() => props.placeholder ?? t('search.placeholder'))

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const local = ref(props.modelValue)
let timer: ReturnType<typeof setTimeout> | undefined

// Keep in step when the parent resets the term (e.g. on navigation).
watch(
  () => props.modelValue,
  (next) => {
    if (next !== local.value) local.value = next
  },
)

watch(local, (next) => {
  clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', next), props.debounce)
})

function clear() {
  clearTimeout(timer)
  local.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="box" :class="{ busy }">
    <svg class="icon" viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </svg>

    <input v-model="local" type="search" class="input" :placeholder="shownPlaceholder" />

    <span v-if="busy" class="dot" aria-hidden="true"></span>

    <button v-else-if="local" type="button" class="clear" :aria-label="t('search.clear')" @click="clear">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
        <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-sm);
  background: var(--field);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.box:focus-within {
  background: var(--surface);
  border-color: var(--brand);
}

.icon {
  flex: none;
  color: var(--text-faint);
}

.input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font-size: 0.87rem;
  color: var(--text);
}

.input:focus {
  outline: none;
}

.input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  flex: none;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--track);
  color: var(--text-muted);
}

.clear:hover {
  background: var(--brand-soft);
  color: var(--brand);
}

.dot {
  flex: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid var(--track);
  border-top-color: var(--brand);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
