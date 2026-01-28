<template>
  <section>
    <div class="page-head">
      <h1 class="page-title">Vulnerabilities</h1>
      <button class="primary" type="button" @click="openCreate = true" :disabled="!rbac.canWrite">
        New Vulnerability
      </button>
    </div>

    <div v-if="actionError" class="card alert" role="alert">
      <strong>Action failed</strong>
      <div class="muted small">{{ actionError }}</div>
      <button class="btn" type="button" @click="actionError = null">Dismiss</button>
    </div>

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
        <th style="width: 28%">Title</th>
        <th style="width: 120px">Severity</th>
        <th style="width: 140px">Status</th>
        <th style="width: 240px">Project</th>
        <th>Description</th>
        <th style="width: 200px">Actions</th>
      </template>

      <template #row="{ row }">
        <td>
          <RouterLink class="title link" :to="{ name: 'vulnerability-detail', params: { id: row.id } }">
            {{ row.title }}
          </RouterLink>
          <div class="muted small">{{ row.id }}</div>
        </td>
        <td><span class="badge" :data-sev="row.severity">{{ row.severity }}</span></td>
        <td class="muted">{{ row.status }}</td>
        <td class="muted small">
          <RouterLink class="link" :to="{ name: 'project-detail', params: { id: row.project_id } }">
            {{ row.project_id }}
          </RouterLink>
        </td>
        <td class="muted">{{ row.description || '—' }}</td>
        <td>
          <div class="actions">
            <button class="btn" type="button" @click="onEdit(row)" :disabled="!rbac.canWrite">
              Edit
            </button>
            <button class="danger" type="button" @click="onDelete(row)" :disabled="!rbac.canDelete">
              Delete
            </button>
          </div>
        </td>
      </template>
    </DataTable>

    <VulnerabilityFormModal
      :open="openCreate"
      mode="create"
      :initial="null"
      @close="openCreate = false"
      @saved="onCreated"
    />

    <VulnerabilityFormModal
      :open="openEdit"
      mode="edit"
      :initial="editing"
      @close="openEdit = false"
      @saved="onUpdated"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import DataTable from '@/components/DataTable.vue'
import type { ListResponse, Vulnerability } from '@/api/types'
import { deleteVulnerability, listVulnerabilities } from '@/api/resources'
import { parseApiError } from '@/utils/apiErrors'
import { useRbac } from '@/utils/rbac'
import VulnerabilityFormModal from '@/components/vulnerabilities/VulnerabilityFormModal.vue'

type VulnFilters = {
  severity: string
  status: string
  project_id: string
}

const rbac = useRbac()

const severityOptions = ['critical', 'high', 'medium', 'low', 'info']
const statusOptions = ['open', 'triaged', 'accepted', 'fixed', 'wont_fix']

const table = ref<InstanceType<typeof DataTable> | null>(null)

const filters = ref<VulnFilters>({
  severity: '',
  status: '',
  project_id: ''
})

const openCreate = ref(false)
const openEdit = ref(false)
const editing = ref<Vulnerability | null>(null)
const actionError = ref<string | null>(null)

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

function onEdit(v: Vulnerability) {
  if (!rbac.canWrite) return
  editing.value = v
  openEdit.value = true
}

async function onDelete(v: Vulnerability) {
  if (!rbac.canDelete) return
  const ok = window.confirm(`Delete vulnerability "${v.title}"? This cannot be undone.`)
  if (!ok) return

  actionError.value = null
  table.value?.refresh()

  try {
    await deleteVulnerability(v.id)
    table.value?.refresh()
  } catch (e) {
    actionError.value = parseApiError(e).message
    table.value?.refresh()
  }
}

function onCreated() {
  table.value?.refresh()
}

function onUpdated(updated: Vulnerability) {
  editing.value = updated
  table.value?.refresh()
}
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

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

.primary {
  border: 1px solid #0f5aa5;
  background: var(--color-primary);
  color: white;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.title {
  font-weight: 650;
}

.link {
  text-decoration: underline;
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

.actions {
  display: flex;
  gap: 8px;
}

.danger {
  border: 1px solid #fecaca;
  background: #fff5f5;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  height: 34px;
}

.alert {
  border-color: #fecaca;
  background: #fff5f5;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
</style>
