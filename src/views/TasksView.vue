<template>
  <section>
    <h1 class="page-title">Tasks</h1>

    <DataTable
      ref="table"
      :fetcher="fetcher"
      :initial-filters="filters"
      :row-key="(t) => t.id"
      empty-text="No tasks found."
    >
      <template #title>Tasks</template>

      <template #filters>
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
        <th style="width: 36%">Title</th>
        <th style="width: 140px">Status</th>
        <th style="width: 240px">Project</th>
        <th>Description</th>
      </template>

      <template #row="{ row }">
        <td>
          <div class="title">{{ row.title }}</div>
          <div class="muted small">{{ row.id }}</div>
        </td>
        <td>
          <span class="pill" :data-status="row.status">{{ row.status }}</span>
        </td>
        <td class="muted small">{{ row.project_id }}</td>
        <td class="muted">{{ row.description || '—' }}</td>
      </template>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import type { ListResponse, Task } from '@/api/types'
import { listTasks } from '@/api/resources'

type TaskFilters = {
  status: string
  project_id: string
}

const statusOptions = ['open', 'in_progress', 'done', 'blocked']

const table = ref<InstanceType<typeof DataTable> | null>(null)

const filters = ref<TaskFilters>({
  status: '',
  project_id: ''
})

const fetcher = async (params: {
  limit: number
  offset: number
  q?: string
  filters: TaskFilters
}): Promise<ListResponse<Task>> => {
  return await listTasks({
    limit: params.limit,
    offset: params.offset,
    q: params.q,
    project_id: params.filters.project_id || undefined,
    status: params.filters.status || undefined
  })
}

function applyFilters() {
  table.value?.applySearchNow() // triggers reload from page 1 with latest filters (via fetcher closure)
}

function reset() {
  filters.value = { status: '', project_id: '' }
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
  min-width: 220px;
}

.select {
  min-width: 140px;
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

.pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  font-size: 12px;
  background: #fff;
}

.pill[data-status='done'] {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.pill[data-status='blocked'] {
  border-color: #fecaca;
  background: #fff5f5;
}

.pill[data-status='in_progress'] {
  border-color: #bfdbfe;
  background: #eff6ff;
}
</style>
