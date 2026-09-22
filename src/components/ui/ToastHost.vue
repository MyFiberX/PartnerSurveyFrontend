<script setup lang="ts">
import { toast } from '../../stores/toast'
import { useI18n } from '../../stores/i18n'

// Aliased: the v-for below already binds `t` to each toast.
const { t: translate } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div class="host" role="region" aria-live="polite">
      <TransitionGroup name="slide">
        <div v-for="t in toast.items.value" :key="t.id" class="toast" :class="t.tone">
          <span class="text">{{ t.text }}</span>
          <button type="button" :aria-label="translate('common.close')" @click="toast.dismiss(t.id)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.host {
  position: fixed;
  z-index: 200;
  bottom: 20px;
  inset-inline-start: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(420px, calc(100vw - 40px));
  padding: 13px 16px;
  border-radius: var(--radius-sm);
  background: var(--text);
  color: #fff;
  font-size: 0.85rem;
  line-height: 1.6;
  box-shadow: 0 10px 30px rgba(22, 18, 31, 0.25);
  pointer-events: auto;
}

.toast.success {
  background: #1E7A4B;
}

.toast.error {
  background: #B3382F;
}

.text {
  flex: 1;
}

button {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
