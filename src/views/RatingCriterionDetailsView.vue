<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { ApiError } from '../api/http'
import { ratingCriteriaService } from '../api/services'
import type { RatingCriterionResponse } from '../api/types'
import { formatDateTime } from '../utils/format'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const route = useRoute()

const criterion = ref<RatingCriterionResponse | null>(null)
const loading = ref(true)
const error = ref<ApiError | null>(null)

let controller: AbortController | null = null

async function load() {
  controller?.abort()
  controller = new AbortController()

  loading.value = true
  error.value = null

  try {
    const { data } = await ratingCriteriaService.getById(String(route.params.id), controller.signal)
    criterion.value = data
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
    criterion.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('criteria.detailsTitle') }}</h2>
        <p class="sub">{{ t('common.serverData') }}</p>
      </div>
      <RouterLink class="btn btn-outline" :to="{ name: 'rating-criteria' }">{{ t('common.back') }}</RouterLink>
    </div>

    <section class="card card-pad">
      <StateBlock v-if="loading" variant="loading" :title="t('common.loading')" />

      <!--
        The server's 404 message for this endpoint is the literal string "Not ",
        an unfinished placeholder. It is shown verbatim rather than replaced.
      -->
      <StateBlock
        v-else-if="error"
        variant="error"
        :title="error.status === 404 ? t('common.notFound') : t('criteria.loadOneFailed')"
        :message="error.message"
        :retryable="error.status !== 404"
        @retry="load"
      />

      <dl v-else-if="criterion" class="detail-list">
        <div class="detail-row">
          <dt>{{ t('common.id') }}</dt>
          <dd dir="ltr">{{ criterion.id }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.label') }}</dt>
          <dd>{{ criterion.labelAr }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.scaleMin') }}</dt>
          <dd>{{ criterion.scaleMin }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.scaleMax') }}</dt>
          <dd>{{ criterion.scaleMax }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.order') }}</dt>
          <dd>{{ criterion.order }}</dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.required') }}</dt>
          <dd>
            <span class="badge" :class="criterion.isRequired ? 'admin' : 'user'">
              {{ criterion.isRequired ? t('common.yes') : t('common.no') }}
            </span>
          </dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.status') }}</dt>
          <dd>
            <span class="badge" :class="criterion.isActive ? 'on' : 'off'">
              {{ criterion.isActive ? t('status.active') : t('status.inactive') }}
            </span>
          </dd>
        </div>
        <div class="detail-row">
          <dt>{{ t('criteria.createdAt') }}</dt>
          <dd>{{ formatDateTime(criterion.createAt) }}</dd>
        </div>
      </dl>
    </section>
  </DashboardLayout>
</template>
