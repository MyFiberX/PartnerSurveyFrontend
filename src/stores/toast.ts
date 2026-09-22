/** Minimal toast queue. Messages come from the API and are shown verbatim. */
import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
  tone: 'success' | 'error'
}

const items = ref<Toast[]>([])
let nextId = 1

function push(text: string, tone: Toast['tone']) {
  const id = nextId++
  items.value.push({ id, text, tone })
  setTimeout(() => dismiss(id), 4500)
}

function dismiss(id: number) {
  items.value = items.value.filter((t) => t.id !== id)
}

export const toast = {
  items,
  dismiss,
  success: (text: string) => push(text, 'success'),
  error: (text: string) => push(text, 'error'),
}
