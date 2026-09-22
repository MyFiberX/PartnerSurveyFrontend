/**
 * Shared state machine for the three paged list pages.
 *
 * Search is sent to the server, never applied to the current page, and resets
 * the page to 1. In-flight requests are aborted when superseded so a slow
 * response cannot overwrite a newer one.
 */
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { ApiError } from '../api/http'
import { i18n } from '../stores/i18n'
import { PAGE_SIZE_DEFAULT, type PagedResult, type PaginationParams } from '../api/types'

type Fetcher<T> = (
  params: PaginationParams,
  signal: AbortSignal,
) => Promise<{ data: PagedResult<T>; message: string | null }>

export function usePagedList<T>(fetcher: Fetcher<T>) {
  const items = ref<T[]>([]) as Ref<T[]>
  const pageNumber = ref(1)
  const pageSize = ref(PAGE_SIZE_DEFAULT)
  const search = ref('')

  const totalCount = ref(0)
  const totalPages = ref(0)
  const hasPrevious = ref(false)
  const hasNext = ref(false)

  const loading = ref(false)
  const searching = ref(false)
  const error = ref<ApiError | null>(null)
  const loaded = ref(false)

  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    controller = new AbortController()

    loading.value = true
    error.value = null

    try {
      const { data } = await fetcher(
        { pageNumber: pageNumber.value, pageSize: pageSize.value, search: search.value },
        controller.signal,
      )

      items.value = data.items
      // Read paging state back from the server: it silently clamps the request.
      pageNumber.value = data.pageNumber
      pageSize.value = data.pageSize
      totalCount.value = data.totalCount
      totalPages.value = data.totalPages
      hasPrevious.value = data.hasPrevious
      hasNext.value = data.hasNext
      loaded.value = true
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      error.value =
        cause instanceof ApiError
          ? cause
          : new ApiError({ status: 0, message: i18n.t('common.unexpected') })
      items.value = []
    } finally {
      loading.value = false
      searching.value = false
    }
  }

  watch(search, () => {
    searching.value = true
    pageNumber.value = 1
    void load()
  })

  watch(pageSize, () => {
    pageNumber.value = 1
    void load()
  })

  watch(pageNumber, () => void load())

  onBeforeUnmount(() => controller?.abort())

  return {
    items,
    pageNumber,
    pageSize,
    search,
    totalCount,
    totalPages,
    hasPrevious,
    hasNext,
    loading,
    searching,
    error,
    loaded,
    load,
  }
}
