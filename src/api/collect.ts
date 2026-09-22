/**
 * Helpers for the two gaps the API leaves to the client.
 *
 * 1. No endpoint returns the ratings of one survey, and none returns only the
 *    active criteria. Both are reached by paging through the whole collection
 *    and filtering here.
 * 2. RatingCriteria comes back ordered by `order` DESC; forms want ascending.
 */
import { PAGE_SIZE_MAX, type PagedResult, type PaginationParams } from './types'

type Lister<T> = (
  params: PaginationParams,
  signal?: AbortSignal,
) => Promise<{ data: PagedResult<T>; message: string | null }>

/**
 * Reads every page of a list endpoint.
 *
 * `maxPages` bounds the walk so a large collection cannot hang the page: the
 * result is then truncated rather than complete, which callers that show a
 * total can detect by comparing `items.length` with `totalCount`.
 */
export async function collectAll<T>(
  list: Lister<T>,
  options: { signal?: AbortSignal; maxPages?: number; search?: string } = {},
): Promise<{ items: T[]; totalCount: number; truncated: boolean }> {
  const { signal, maxPages = 20, search } = options

  const items: T[] = []
  let pageNumber = 1
  let totalCount = 0
  let hasNext = true

  while (hasNext && pageNumber <= maxPages) {
    const { data } = await list({ pageNumber, pageSize: PAGE_SIZE_MAX, search }, signal)
    items.push(...data.items)
    totalCount = data.totalCount
    hasNext = data.hasNext
    // Trust the server's echoed page number: it clamps what it was sent.
    pageNumber = data.pageNumber + 1
  }

  return { items, totalCount, truncated: hasNext }
}

/** Ascending by `order`, undoing the server's DESC sort. Ties keep `labelAr`. */
export function byOrderAsc<T extends { order: number; labelAr: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || a.labelAr.localeCompare(b.labelAr, 'ar'))
}
