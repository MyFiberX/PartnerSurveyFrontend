<script setup lang="ts">
import LocaleToggle from './ui/LocaleToggle.vue'
import { useI18n } from '../stores/i18n'
import logo from '../assets/ar - بنفسجي.png'

defineProps<{
  step: number
  totalSteps: number
}>()

const { t } = useI18n()
</script>

<template>
  <header class="head">
    <div class="bar">
      <div class="side">
        <LocaleToggle />
      </div>
      <img class="logo" :src="logo" :alt="t('app.brand')" />
      <!-- Mirrors the toggle's side so the logo stays optically centred. -->
      <div class="side" aria-hidden="true"></div>
    </div>

    <h1 class="title">{{ t('survey.headerTitle') }}<br />{{ t('survey.headerTitle2') }}</h1>

    <div
      class="track"
      role="progressbar"
      :aria-valuenow="step"
      aria-valuemin="1"
      :aria-valuemax="totalSteps"
      :aria-label="t('survey.step', { step, total: totalSteps })"
    >
      <div class="fill" :style="{ width: `${(step / totalSteps) * 100}%` }"></div>
    </div>
    <p class="count">{{ t('survey.step', { step, total: totalSteps }) }}</p>
  </header>
</template>

<style scoped>
.head {
  padding-top: 8px;
}

/* The toggle sits to one side; the spacer balances it so the logo centres. */
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.side {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
}

.logo {
  display: block;
  height: 34px;
  width: auto;
  flex: none;
}

.title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.6;
  text-align: center;
  color: var(--text);
}

.track {
  margin-top: 20px;
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--track);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--brand);
  transition: width 0.35s ease;
}

.count {
  margin: 8px 0 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  text-align: left;
}

@media (min-width: 768px) {
  .logo {
    height: 42px;
  }

  .title {
    font-size: 1.3rem;
  }
}
</style>
