<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '../stores/i18n'
import logoWhite from '../assets/ar - ابيض.png'

const { t } = useI18n()

const SECONDS = 3

/** Emitted when the countdown ends, so the parent can reset to a blank form. */
const emit = defineEmits<{ done: [] }>()

const remaining = ref(SECONDS)
let timer: ReturnType<typeof setInterval> | null = null

function stop() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  timer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      stop()
      emit('done')
    }
  }, 1000)
})

// Covers an early unmount, e.g. the user navigating away mid-countdown.
onBeforeUnmount(stop)
</script>

<template>
  <div class="done">
    <img class="logo" :src="logoWhite" :alt="t('app.brand')" />

    <div class="body">
      <div class="halo">
        <div class="badge">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              stroke="var(--brand)"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <h2 class="title">
        {{ t('survey.successTitle') }}<br />{{ t('survey.successTitle2') }}
      </h2>
      <p class="sub">{{ t('survey.successSub') }}</p>

      <p class="countdown" aria-live="polite">
        {{ t('survey.returning', { seconds: remaining }) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.done {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--brand-deep);
  color: #fff;
  padding: calc(env(safe-area-inset-top) + 34px) var(--shell-pad)
    calc(env(safe-area-inset-bottom) + 34px);
  text-align: center;
}

.logo {
  height: 34px;
  width: auto;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 420px;
  padding-bottom: 6vh;
}

.halo {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: grid;
  place-items: center;
  margin-bottom: 34px;
  animation: pop 0.45s cubic-bezier(0.2, 1.3, 0.5, 1) both;
}

.badge {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
}

.title {
  margin: 0;
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.85;
}

.sub {
  margin: 22px 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.82);
}

.countdown {
  margin: 30px 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (min-width: 768px) {
  .logo {
    height: 42px;
  }

  .title {
    font-size: 1.4rem;
  }

  .sub {
    font-size: 0.95rem;
  }
}
</style>
