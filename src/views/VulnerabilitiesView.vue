<template>
  <section>
    <h1 class="page-title">Vulnerabilities</h1>

    <DataTable
      ref="table"
      :fetcher="fetcher"
      :initial-filters="filters"
      :row-key="(v) => v.id"
      empty-text="No vulnerabilities found."
    >
      <template #title>Vulnerabilities</template>

      <template #filters>
        <label class="field">
          <span class="muted small">Severity</span>
          <select class="select" v-model="filters.severity" @change="applyFilters">
            <option value="">All</option>
            <option v-for="s in severityOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="field">
          <span class="muted small">Status</span>
          <select class="select" v-model="filters.status" @change="applyFilters">
            <option value="">All</option>
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="field">
          <span class="muted small">Project ID</span>
          <input
            class="input"
            v-model.trim="filters.project_id"
            placeholder="uuid…"
            @keydown.enter.prevent="applyFilters"
            @blur="applyFilters"
          />
        </label>

        <button class="btn" type="button" @click="reset">Reset</button>
      </template>

      <template #header>
        <th style="width: 34%">Title</th>
        <th style="width: 120px">Severity</th>
        <th style="width: 140px">Status</th>
        <th style="width: 240px">Project</th>
        <th>Description</th>
      </template>

      <template #row="{ row }">
        <td>
          <div class="title">{{ row.title }}</div>
          <div class="muted small">{{ row.id }}</div>
        </td>
        <td><span class="badge" :data-sev="row.severity">{{ row.severity }}</span></td>
        <td class="muted">{{ row.status }}</td>
        <td class="muted small">{{ row.project_id }}</td>
        <td class="muted">{{ row.description || '—' }}</td>
      </template>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import type { ListResponse, Vulnerability } from '@/api/types'
import { listVulnerabilities } from '@/api/resources'

type VulnFilters = {
  severity: string
  status: string
  project_id: string
}

const severityOptions = ['critical', 'high', 'medium', 'low', 'info']
const statusOptions = ['open', 'triaged', 'accepted', 'fixed', 'wont_fix']

const table = ref<InstanceType<typeof DataTable> | null>(null)

const filters = ref<VulnFilters>({
  severity: '',
  status: '',
  project_id: ''
})

const fetcher = async (params: {
  limit: number
  offset: number
  q?: string
  filters: VulnFilters
}): Promise<ListResponse<Vulnerability>> => {
  return await listVulnerabilities({
    limit: params.limit,
    offset: params.offset,
    q: params.q,
    project_id: params.filters.project_id || undefined,
    status: params.filters.status || undefined,
    severity: params.filters.severity || undefined
  })
}

function applyFilters() {
  table.value?.applySearchNow()
}

function reset() {
  filters.value = { severity: '', status: '', project_id: '' }
  table.value?.applySearchNow()
}
</script>

<style scoped>
.small {
  font-size: 12px;
}

.field {
  display: grid;
  gap: 4px;
}

.input,
.select {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 200px;
}

.select {
  min-width: 150px;
  padding: 7px 10px;
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  align-self: end;
  height: 34px;
}

.title {
  font-weight: 650;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  font-size: 12px;
  background: #fff;
  text-transform: lowercase;
}

.badge[data-sev='critical'],
.badge[data-sev='high'] {
  border-color: #fecaca;
  background: #fff5f5;
}

.badge[data-sev='medium'] {
  border-color: #fed7aa;
  background: #fff7ed;
}

.badge[data-sev='low'] {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.badge[data-sev='info'] {
  border-color: #bfdbfe;
  background: #eff6ff;
}
</style>
