<template>
  <section>
    <div class="page-head">
      <h1 class="page-title">Projects</h1>
      <button class="primary" type="button" @click="openCreate = true" :disabled="!rbac.canWrite">
        New Project
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
      :initial-filters="{}"
      :row-key="(p) => p.id"
      empty-text="No projects found."
    >
      <template #title>Projects</template>

      <template #header>
        <th style="width: 34%">Name</th>
        <th>Description</th>
        <th style="width: 180px">Created</th>
        <th style="width: 200px">Actions</th>
      </template>

      <template #row="{ row }">
        <td>
          <RouterLink class="name link" :to="{ name: 'project-detail', params: { id: row.id } }">
            {{ row.name }}
          </RouterLink>
          <div class="muted small">{{ row.id }}</div>
        </td>
        <td class="muted">{{ row.description || '—' }}</td>
        <td class="muted small">{{ fmtDate(row.created_at) }}</td>
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

    <ProjectFormModal
      :open="openCreate"
      mode="create"
      :initial="null"
      @close="openCreate = false"
      @saved="onCreated"
    />

    <ProjectFormModal
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
import type { ListResponse, Project } from '@/api/types'
import { deleteProject, listProjects } from '@/api/resources'
import { parseApiError } from '@/utils/apiErrors'
import { useRbac } from '@/utils/rbac'
import ProjectFormModal from '@/components/projects/ProjectFormModal.vue'

const rbac = useRbac()

const table = ref<InstanceType<typeof DataTable> | null>(null)
const openCreate = ref(false)
const openEdit = ref(false)
const editing = ref<Project | null>(null)
const actionError = ref<string | null>(null)

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

function onEdit(p: Project) {
  if (!rbac.canWrite) return
  editing.value = p
  openEdit.value = true
}

/**
 * Optimistic delete:
 * - safest optimistic action here is removing row locally by forcing a refresh and relying on server
 *   as source of truth.
 * - We trigger a refresh immediately after user confirms, and rollback by refreshing again if failed.
 */
async function onDelete(p: Project) {
  if (!rbac.canDelete) return
  const ok = window.confirm(`Delete project "${p.name}"? This cannot be undone.`)
  if (!ok) return

  actionError.value = null

  // Optimistically refresh the table (it will still show until backend confirms in many cases),
  // but this keeps UI responsive and avoids stale results after delete.
  table.value?.refresh()

  try {
    await deleteProject(p.id)
    table.value?.refresh()
  } catch (e) {
    actionError.value = parseApiError(e).message
    // Rollback to server truth
    table.value?.refresh()
  }
}

function onCreated() {
  table.value?.refresh()
}

function onUpdated(updated: Project) {
  // If the edited project was the same as the editing reference, update it for subsequent edits.
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
.name {
  font-weight: 650;
}
.link {
  text-decoration: underline;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.danger {
  border: 1px solid #fecaca;
  background: #fff5f5;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.primary {
  border: 1px solid #0f5aa5;
  background: var(--color-primary);
  color: white;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
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
