<script setup lang="ts">
/** Modal confirmation. Used for user activate/deactivate — never for deletion. */
import { computed } from 'vue'
import { useI18n } from '../../stores/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    busy?: boolean
    tone?: 'brand' | 'danger'
  }>(),
  // Labels are resolved below rather than as prop defaults, which are
  // evaluated once and would not follow a locale change.
  { busy: false, tone: 'brand' },
)

const confirmText = computed(() => props.confirmLabel ?? t('confirm.confirm'))
const cancelText = computed(() => props.cancelLabel ?? t('common.cancel'))

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="!busy && emit('cancel')"
        @keydown.esc="!busy && emit('cancel')"
      >
        <div class="panel">
          <h3 class="title">{{ title }}</h3>
          <p class="msg">{{ message }}</p>

          <div class="actions">
            <button
              type="button"
              class="btn confirm"
              :class="tone"
              :disabled="busy"
              @click="emit('confirm')"
            >
              {{ busy ? t('confirm.working') : confirmText }}
            </button>
            <button type="button" class="btn cancel" :disabled="busy" @click="emit('cancel')">
              {{ cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(22, 18, 31, 0.45);
  backdrop-filter: blur(2px);
}

.panel {
  width: 100%;
  max-width: 400px;
  padding: 26px 24px 20px;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(22, 18, 31, 0.2);
}

.title {
  margin: 0 0 10px;
  font-size: 1.05rem;
  font-weight: 800;
}

.msg {
  margin: 0 0 22px;
  font-size: 0.87rem;
  line-height: 1.8;
  color: var(--text-muted);
}

.actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.btn {
  height: 44px;
  min-height: 44px;
  padding: 0 22px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.confirm.brand {
  background: var(--brand);
  color: #fff;
}

.confirm.brand:hover:not(:disabled) {
  background: var(--brand-dark);
}

.confirm.danger {
  background: #C0392B;
  color: #fff;
}

.confirm.danger:hover:not(:disabled) {
  background: #A93226;
}

.cancel {
  background: var(--surface);
  border-color: var(--field-border);
  color: var(--text-muted);
}

.cancel:hover:not(:disabled) {
  border-color: var(--brand);
  color: var(--brand);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
