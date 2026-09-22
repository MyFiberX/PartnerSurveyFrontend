<script setup lang="ts">
/**
 * Shell for every authenticated page: sidebar, top bar, content slot.
 * Navigation contains no registration entry — /login is the only auth route.
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '../../stores/auth'
import { roleLabel } from '../../utils/format'
import logo from '../../assets/ar - بنفسجي.png'
import LocaleToggle from '../ui/LocaleToggle.vue'
import { useI18n, type MessageKey } from '../../stores/i18n'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const menuOpen = ref(false)

interface NavItem {
  name: string
  labelKey: MessageKey
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { name: 'dashboard', labelKey: 'nav.dashboard' },
  { name: 'surveys', labelKey: 'nav.surveys' },
  { name: 'rating-criteria', labelKey: 'nav.criteria' },
  { name: 'users', labelKey: 'nav.users', adminOnly: true },
  { name: 'profile', labelKey: 'nav.profile' },
  { name: 'change-password', labelKey: 'nav.changePassword' },
]

const visibleNav = computed(() => NAV.filter((i) => !i.adminOnly || auth.isAdmin.value))

const pageTitle = computed(() => {
  const key = route.meta.titleKey
  return key ? t(key) : ''
})

// Close the drawer whenever navigation happens.
watch(() => route.fullPath, () => (menuOpen.value = false))

function logout() {
  auth.logout()
  void router.replace({ name: 'login' })
}
</script>

<template>
  <div class="layout">
    <Transition name="fade">
      <div v-if="menuOpen" class="scrim" @click="menuOpen = false"></div>
    </Transition>

    <aside class="sidebar" :class="{ open: menuOpen }">
      <div class="brand">
        <img :src="logo" :alt="t('app.brand')" />
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-link"
        >
          {{ t(item.labelKey) }}
        </RouterLink>
      </nav>

      <button type="button" class="logout" @click="logout">{{ t('nav.logout') }}</button>
    </aside>

    <div class="main">
      <header class="topbar">
        <button
          type="button"
          class="burger"
          :aria-label="t('nav.menu')"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          </svg>
        </button>

        <h1 class="page-title">{{ pageTitle }}</h1>

        <LocaleToggle />

        <div v-if="auth.user.value" class="user">
          <div class="who">
            <span class="name">{{ auth.user.value.userName }}</span>
            <span class="role">{{ roleLabel(auth.user.value.role) }}</span>
          </div>
          <div class="avatar" aria-hidden="true">
            {{ auth.user.value.userName.charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100dvh;
  background: #F7F7FA;
}

.sidebar {
  position: fixed;
  z-index: 40;
  inset-block: 0;
  inset-inline-start: 0;
  width: 248px;
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  background: var(--surface);
  border-inline-end: 1px solid var(--field-border);
  /*
   * The drawer hides toward its own inline-start edge. transform is physical,
   * so the offset is negated in LTR; otherwise it would slide inward and cover
   * the page instead of leaving it.
   */
  transform: translateX(100%);
  transition: transform 0.25s ease;
}

:global(html[dir='ltr']) .sidebar {
  transform: translateX(-100%);
}

/* Both selectors need the open state; the LTR rule above outranks a bare one. */
.sidebar.open,
:global(html[dir='ltr']) .sidebar.open {
  transform: translateX(0);
}

.brand {
  padding: 4px 8px 22px;
}

.brand img {
  height: 30px;
  width: auto;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.nav-link:hover {
  background: var(--brand-soft);
  color: var(--brand);
}

.nav-link.router-link-active {
  background: var(--brand);
  color: #fff;
}

.logout {
  height: 44px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.logout:hover {
  border-color: #C0392B;
  color: #C0392B;
}

.scrim {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: rgba(22, 18, 31, 0.4);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  height: 62px;
  padding: 0 18px;
  background: var(--surface);
  border-bottom: 1px solid var(--field-border);
}

.burger {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: none;
  padding: 0;
  border: 1px solid var(--field-border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
}

.page-title {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.who {
  display: flex;
  flex-direction: column;
  /* Logical, so the block hugs the reading edge in both directions. */
  align-items: flex-start;
  text-align: start;
  line-height: 1.35;
}

.name {
  font-size: 0.82rem;
  font-weight: 700;
}

.role {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
}

.content {
  flex: 1;
  padding: 20px 18px 40px;
}

@media (min-width: 1024px) {
  /* The LTR rule is more specific, so it is restated here to be cancelled. */
  .sidebar,
  :global(html[dir='ltr']) .sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    transform: none;
  }

  .scrim,
  .burger {
    display: none;
  }

  .topbar {
    padding: 0 28px;
  }

  .content {
    padding: 26px 28px 48px;
  }
}

@media (max-width: 480px) {
  .who {
    display: none;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
