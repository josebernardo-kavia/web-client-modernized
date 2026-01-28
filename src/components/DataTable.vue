<template>
  <section class="card">
    <div class="toolbar">
      <div class="left">
        <div class="title">
          <slot name="title">
            <span class="muted">Items</span>
          </slot>
        </div>

        <div v-if="$slots.filters" class="filters">
          <slot name="filters" />
        </div>
      </div>

      <div class="right">
        <label class="search" aria-label="Search">
          <span class="muted small">Search</span>
          <input
            v-model="localSearch"
            class="input"
            type="search"
            placeholder="Type to search…"
            @keydown.enter.prevent="applySearchNow"
          />
        </label>

        <button class="btn" type="button" @click="refresh" :disabled="loading">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="state error" role="alert">
      <div class="msg">
        <strong>Failed to load</strong>
        <div class="muted small">{{ error }}</div>
      </div>
      <button class="btn" type="button" @click="refresh" :disabled="loading">Retry</button>
    </div>

    <div v-else-if="loading" class="state">
      <div class="spinner" aria-hidden="true"></div>
      <div class="muted">Loading…</div>
    </div>

    <div v-else-if="items.length === 0" class="state">
      <div class="muted">{{ emptyTextComputed }}</div>
    </div>

    <div v-else class="table-wrap">
      <table class="table" role="table">
        <thead>
          <tr>
            <slot name="header" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in items" :key="rowKey(row, idx)">
            <slot name="row" :row="row" :index="idx" />
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer" v-if="showFooter">
      <div class="muted small">
        Showing <strong>{{ rangeLabel }}</strong> of <strong>{{ total }}</strong>
      </div>

      <div class="pager">
        <label class="muted small">
          Per page
          <select class="select" v-model.number="localPageSize" :disabled="loading">
            <option v-for="n in pageSizeOptionsComputed" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>

        <button class="btn" type="button" @click="prevPage" :disabled="loading || page <= 1">
          Prev
        </button>

        <div class="muted small">
          Page <strong>{{ page }}</strong> / <strong>{{ totalPages }}</strong>
        </div>

        <button
          class="btn"
          type="button"
          @click="nextPage"
          :disabled="loading || page >= totalPages"
        >
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts" generic="T, F extends Record<string, unknown>">
import { computed, onMounted, ref, watch } from 'vue'
import type { ListResponse, ProblemDetails } from '@/api/types'
import axios from 'axios'

type FetchParams<F> = {
  limit: number
  offset: number
  q?: string
  filters: F
}

type Props<T, F> = {
  /**
   * Function that fetches one page of data from the server.
   * Must implement server-side pagination (limit/offset) and accept q/filters.
   */
  fetcher: (params: FetchParams<F>) => Promise<ListResponse<T>>
  initialFilters: F
  initialSearch?: string
  /**
   * Unique row key. If omitted, uses index (ok for read-only lists).
   */
  rowKey?: (row: T, index: number) => string | number
  emptyText?: string
  pageSizeOptions?: number[]
  initialPageSize?: number
  /**
   * If true, performs initial fetch on mount.
   */
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props<T, F>>(), {
  initialSearch: '',
  emptyText: 'No results.',
  pageSizeOptions: () => [10, 25, 50, 100],
  initialPageSize: 25,
  autoLoad: true
})

const items = ref<T[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

const localSearch = ref(props.initialSearch)
const filters = ref<F>({ ...(props.initialFilters as any) })

const localPageSize = ref<number>(props.initialPageSize)
const page = ref(1)

const offset = computed(() => (page.value - 1) * localPageSize.value)

const totalPages = computed(() => {
  const denom = Math.max(1, localPageSize.value)
  return Math.max(1, Math.ceil(total.value / denom))
})

const showFooter = computed(() => total.value > 0)

const pageSizeOptionsComputed = computed(() => {
  const opts = props.pageSizeOptions.length ? props.pageSizeOptions : [10, 25, 50]
  // Ensure current selection is present.
  return Array.from(new Set([...opts, localPageSize.value])).sort((a, b) => a - b)
})

const emptyTextComputed = computed(() => props.emptyText)

const rangeLabel = computed(() => {
  if (total.value === 0) return '0'
  const start = offset.value + 1
  const end = Math.min(offset.value + items.value.length, total.value)
  return `${start}-${end}`
})

function rowKey(row: T, index: number): string | number {
  return props.rowKey ? props.rowKey(row, index) : index
}

function parseErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status
    const data = e.response?.data as ProblemDetails | any
    const detail = typeof data?.detail === 'string' ? data.detail : null
    const title = typeof data?.title === 'string' ? data.title : null
    const msg = detail || title || e.message || 'Request failed.'
    return status ? `HTTP ${status}: ${msg}` : msg
  }
  if (e instanceof Error) return e.message
  return 'Request failed.'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await props.fetcher({
      limit: localPageSize.value,
      offset: offset.value,
      q: localSearch.value.trim().length > 0 ? localSearch.value.trim() : undefined,
      filters: filters.value
    })
    items.value = res.items
    total.value = res.total
    // Clamp page if total shrank (e.g., after filtering).
    const maxPage = Math.max(1, Math.ceil(Math.max(1, res.total) / localPageSize.value))
    if (page.value > maxPage) page.value = maxPage
  } catch (e) {
    error.value = parseErrorMessage(e)
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// PUBLIC_INTERFACE
function refresh() {
  /** Re-fetch current page using current search/filters/pagination. */
  void load()
}

// PUBLIC_INTERFACE
function setFilter<K extends keyof F>(key: K, value: F[K]) {
  /** Update one filter field and reload from page 1. */
  ;(filters.value as any)[key] = value
  page.value = 1
  void load()
}

// PUBLIC_INTERFACE
function resetFilters() {
  /** Reset filters to initial values and reload from page 1. */
  filters.value = { ...(props.initialFilters as any) }
  page.value = 1
  void load()
}

// PUBLIC_INTERFACE
function applySearchNow() {
  /** Apply search immediately and reload from page 1. */
  page.value = 1
  void load()
}

function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  void load()
}

function nextPage() {
  if (page.value >= totalPages.value) return
  page.value += 1
  void load()
}

// When page size changes, reset to page 1 and reload.
watch(localPageSize, () => {
  page.value = 1
  void load()
})

// Debounced search: typing triggers reload after short pause.
let searchTimer: number | null = null
watch(
  localSearch,
  () => {
    page.value = 1
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
      void load()
    }, 300)
  },
  { flush: 'post' }
)

onMounted(() => {
  if (props.autoLoad) void load()
})

defineExpose({
  refresh,
  setFilter,
  resetFilters,
  applySearchNow
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  font-weight: 650;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.right {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.search {
  display: grid;
  gap: 4px;
}

.small {
  font-size: 12px;
}

.input,
.select {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 240px;
}

.select {
  min-width: 90px;
  padding: 7px 10px;
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-wrap {
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg);
}

.table thead th {
  text-align: left;
  font-size: 12px;
  color: #4b5563;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  background: #fafbfc;
  white-space: nowrap;
}

.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  background: #ffffff;
}

.state.error {
  border-style: solid;
  border-color: #fecaca;
  background: #fff5f5;
  justify-content: space-between;
}

.msg {
  display: grid;
  gap: 4px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pager {
  display: flex;
  align-items: center;
  gap: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
