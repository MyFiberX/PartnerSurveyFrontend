<script setup lang="ts">
/** Pagination bar driven entirely by the server's PagedResult metadata. */
import { PAGE_SIZE_MAX } from '../../api/types'
import { useI18n } from '../../stores/i18n'

const { t } = useI18n()

defineProps<{
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:pageNumber': [value: number]
  'update:pageSize': [value: number]
}>()

const SIZES = [10, 25, 50, PAGE_SIZE_MAX]

function onSize(event: Event) {
  emit('update:pageSize', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="pager">
    <div class="size">
      <label for="pageSize">{{ t('pager.perPage') }}</label>
      <select id="pageSize" :value="pageSize" :disabled="disabled" @change="onSize">
        <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <p class="count">
      <span>{{ totalCount }}</span> {{ t('pager.records') }}
      <template v-if="totalPages > 0">
        · {{ t('pager.page', { page: pageNumber, total: totalPages }) }}
      </template>
    </p>

    <div class="nav">
      <button
        type="button"
        :disabled="!hasPrevious || disabled"
        @click="emit('update:pageNumber', pageNumber - 1)"
      >
        {{ t('pager.previous') }}
      </button>
      <button
        type="button"
        :disabled="!hasNext || disabled"
        @click="emit('update:pageNumber', pageNumber + 1)"
      >
        {{ t('pager.next') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 4px 4px;
}

.size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: inherit;
  font-size: 0.82rem;
  color: var(--text);
}

.count {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.count span {
  font-weight: 700;
  color: var(--text);
}

.nav {
  display: flex;
  gap: 8px;
}

.nav button {
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
}

.nav button:hover:not(:disabled) {
  border-color: var(--brand);
  color: var(--brand);
}

.nav button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 560px) {
  .pager {
    justify-content: center;
  }
}
</style>
