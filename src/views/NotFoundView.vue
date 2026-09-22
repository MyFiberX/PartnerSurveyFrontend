<script setup lang="ts">
import { auth } from '../stores/auth'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()
</script>

<template>
  <div class="page">
    <div class="box">
      <p class="code">404</p>
      <h1 class="title">{{ t('notFound.title') }}</h1>
      <p class="msg">{{ t('notFound.message') }}</p>

      <RouterLink
        class="btn btn-primary"
        :to="auth.isAuthenticated.value ? { name: 'dashboard' } : { name: 'login' }"
      >
        {{ auth.isAuthenticated.value ? t('notFound.toDashboard') : t('notFound.toLogin') }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #F7F7FA;
}

.box {
  text-align: center;
}

.code {
  margin: 0;
  font-size: 3.4rem;
  font-weight: 800;
  color: var(--brand);
  line-height: 1;
}

.title {
  margin: 12px 0 6px;
  font-size: 1.2rem;
  font-weight: 800;
}

.msg {
  margin: 0 0 24px;
  font-size: 0.88rem;
  color: var(--text-muted);
}
</style>
