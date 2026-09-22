<script setup lang="ts">
/**
 * Rating criteria list.
 *
 * The server orders by `order` DESCENDING. That order is preserved exactly as
 * returned — no client-side re-sorting.
 */
import { onMounted, reactive, ref } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPager from '../components/ui/DataPager.vue'
import SearchBox from '../components/ui/SearchBox.vue'
import StateBlock from '../components/ui/StateBlock.vue'
import { usePagedList } from '../composables/usePagedList'
import { ApiError } from '../api/http'
import { ratingCriteriaService } from '../api/services'
import type { RatingCriterionResponse } from '../api/types'
import { toast } from '../stores/toast'
import { useI18n } from '../stores/i18n'

const { t } = useI18n()

const list = usePagedList<RatingCriterionResponse>((params, signal) =>
  ratingCriteriaService.list(params, signal),
)

onMounted(() => void list.load())

const createOpen = ref(false)
const saving = ref(false)
const formError = ref<ApiError | null>(null)

// Defaults mirror the backend DTO: isRequired/isActive default to true.
const form = reactive({
  labelAr: '',
  scaleMin: 1,
  scaleMax: 5,
  order: 1,
  isRequired: true,
  isActive: true,
})

function openCreate() {
  form.labelAr = ''
  form.scaleMin = 1
  form.scaleMax = 5
  form.order = 1
  form.isRequired = true
  form.isActive = true
  formError.value = null
  createOpen.value = true
}

function close() {
  if (saving.value) return
  createOpen.value = false
}

function fieldError(name: string): string {
  const fields = formError.value?.fieldErrors
  if (!fields) return ''
  const key = Object.keys(fields).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? (fields[key]?.[0] ?? '') : ''
}

async function save() {
  if (saving.value) return
  saving.value = true
  formError.value = null

  try {
    const { message } = await ratingCriteriaService.create({
      labelAr: form.labelAr,
      scaleMin: Number(form.scaleMin),
      scaleMax: Number(form.scaleMax),
      order: Number(form.order),
      isRequired: form.isRequired,
      isActive: form.isActive,
    })
    // This endpoint returns no success message, so a local one is used.
    toast.success(message ?? t('criteria.created2'))
    createOpen.value = false
    await list.load()
  } catch (cause) {
    formError.value =
      cause instanceof ApiError ? cause : new ApiError({ status: 0, message: t('common.unexpected') })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-head">
      <div>
        <h2>{{ t('criteria.title') }}</h2>
        <p class="sub">{{ t('criteria.subtitle2') }}</p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn btn-outline" :disabled="list.loading.value" @click="list.load()">
          {{ t('common.refresh') }}
        </button>
        <button type="button" class="btn btn-primary" @click="openCreate">{{ t('criteria.new') }}</button>
      </div>
    </div>

    <section class="card">
      <div class="toolbar">
        <div class="grow">
          <SearchBox
            v-model="list.search.value"
            :placeholder="t('criteria.search2')"
            :busy="list.searching.value"
          />
        </div>
      </div>

      <StateBlock v-if="list.loading.value && !list.loaded.value" variant="loading" :title="t('common.loading')" />

      <StateBlock
        v-else-if="list.error.value"
        variant="error"
        :title="t('criteria.loadFailed')"
        :message="list.error.value.message"
        retryable
        @retry="list.load()"
      />

      <StateBlock
        v-else-if="list.items.value.length === 0"
        variant="empty"
        :title="list.search.value ? t('surveys.noResults') : t('criteria.empty')"
        :message="
          list.search.value ? t('criteria.noResultsHint') : t('criteria.emptyHint2')
        "
      />

      <template v-else>
        <div class="table-scroll" :class="{ dim: list.loading.value }">
          <table class="data">
            <thead>
              <tr>
                <th>{{ t('criteria.label') }}</th>
                <th>{{ t('criteria.scaleMin') }}</th>
                <th>{{ t('criteria.scaleMax') }}</th>
                <th>{{ t('criteria.order') }}</th>
                <th>{{ t('criteria.required') }}</th>
                <th>{{ t('criteria.status') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in list.items.value" :key="c.id">
                <td>{{ c.labelAr }}</td>
                <td>{{ c.scaleMin }}</td>
                <td>{{ c.scaleMax }}</td>
                <td>{{ c.order }}</td>
                <td>
                  <span class="badge" :class="c.isRequired ? 'admin' : 'user'">
                    {{ c.isRequired ? t('common.yes') : t('common.no') }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="c.isActive ? 'on' : 'off'">
                    {{ c.isActive ? t('status.active') : t('status.inactive') }}
                  </span>
                </td>
                <td>
                  <RouterLink
                    class="btn btn-outline btn-sm"
                    :to="{ name: 'rating-criterion-details', params: { id: c.id } }"
                  >
                    {{ t('common.details') }}
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <DataPager
          v-model:page-number="list.pageNumber.value"
          v-model:page-size="list.pageSize.value"
          :total-count="list.totalCount.value"
          :total-pages="list.totalPages.value"
          :has-previous="list.hasPrevious.value"
          :has-next="list.hasNext.value"
          :disabled="list.loading.value"
        />
      </template>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="createOpen" class="backdrop" role="dialog" aria-modal="true" @click.self="close">
          <div class="modal">
            <h3 class="modal-title">{{ t('criteria.newTitle') }}</h3>

            <div v-if="formError" class="alert alert-error" role="alert">
              {{ formError.message }}
              <ul v-if="formError.fieldErrorList.length > 1">
                <li v-for="(line, i) in formError.fieldErrorList" :key="i">{{ line }}</li>
              </ul>
            </div>

            <form novalidate @submit.prevent="save">
              <div class="form-field">
                <label class="form-label" for="labelAr">{{ t('criteria.labelField') }}</label>
                <input
                  id="labelAr"
                  v-model="form.labelAr"
                  class="form-control"
                  :class="{ invalid: fieldError('labelAr') }"
                  type="text"
                  :disabled="saving"
                />
                <p v-if="fieldError('labelAr')" class="form-error">{{ fieldError('labelAr') }}</p>
              </div>

              <div class="grid3">
                <div class="form-field">
                  <label class="form-label" for="scaleMin">{{ t('criteria.scaleMin') }}</label>
                  <input
                    id="scaleMin"
                    v-model.number="form.scaleMin"
                    class="form-control"
                    type="number"
                    :disabled="saving"
                  />
                </div>
                <div class="form-field">
                  <label class="form-label" for="scaleMax">{{ t('criteria.scaleMax') }}</label>
                  <input
                    id="scaleMax"
                    v-model.number="form.scaleMax"
                    class="form-control"
                    type="number"
                    :disabled="saving"
                  />
                </div>
                <div class="form-field">
                  <label class="form-label" for="order">{{ t('criteria.order') }}</label>
                  <input
                    id="order"
                    v-model.number="form.order"
                    class="form-control"
                    type="number"
                    :disabled="saving"
                  />
                </div>
              </div>

              <div class="form-field checks">
                <label class="check">
                  <input v-model="form.isRequired" type="checkbox" :disabled="saving" />
                  <span>{{ t('criteria.required') }}</span>
                </label>
                <label class="check">
                  <input v-model="form.isActive" type="checkbox" :disabled="saving" />
                  <span>{{ t('status.active') }}</span>
                </label>
              </div>

              <div class="modal-actions">
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? t('common.saving') : t('common.save') }}
                </button>
                <button type="button" class="btn btn-outline" :disabled="saving" @click="close">
                  {{ t('common.cancel') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </DashboardLayout>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
}

.dim {
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.checks {
  display: flex;
  gap: 22px;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(22, 18, 31, 0.45);
  overflow-y: auto;
}

.modal {
  width: 100%;
  max-width: 460px;
  padding: 26px 24px 22px;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: 0 18px 50px rgba(22, 18, 31, 0.2);
}

.modal-title {
  margin: 0 0 18px;
  font-size: 1.05rem;
  font-weight: 800;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .grid3 {
    grid-template-columns: 1fr;
  }
}
</style>
