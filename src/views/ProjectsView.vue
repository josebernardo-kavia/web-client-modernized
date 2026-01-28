<template>
  <section>
    <h1 class="page-title">Projects</h1>

    <DataTable
      ref="table"
      :fetcher="fetcher"
      :initial-filters="{}"
      :row-key="(p) => p.id"
      empty-text="No projects found."
    >
      <template #title>Projects</template>

      <template #header>
        <th style="width: 40%">Name</th>
        <th>Description</th>
        <th style="width: 180px">Created</th>
      </template>

      <template #row="{ row }">
        <td>
          <div class="name">{{ row.name }}</div>
          <div class="muted small">{{ row.id }}</div>
        </td>
        <td class="muted">{{ row.description || '—' }}</td>
        <td class="muted small">{{ fmtDate(row.created_at) }}</td>
      </template>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import DataTable from '@/components/DataTable.vue'
import type { ListResponse, Project } from '@/api/types'
import { listProjects } from '@/api/resources'

const fetcher = async (params: {
  limit: number
  offset: number
  q?: string
  filters: Record<string, never>
}): Promise<ListResponse<Project>> => {
  return await listProjects({
    limit: params.limit,
    offset: params.offset,
    q: params.q
  })
}

function fmtDate(v?: string) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}
</script>

<style scoped>
.small {
  font-size: 12px;
}
.name {
  font-weight: 650;
}
</style>
