<template>
  <section>
    <div class="head">
      <div>
        <h1 class="page-title">Task</h1>
        <div class="muted small" v-if="id">ID: {{ id }}</div>
      </div>

      <div class="actions">
        <RouterLink class="btn" :to="{ name: 'tasks' }">Back</RouterLink>
        <button class="btn" type="button" @click="openEdit = true" :disabled="!rbac.canWrite || busy">
          Edit
        </button>
        <button class="danger" type="button" @click="onDelete" :disabled="!rbac.canDelete || busy">
          Delete
        </button>
      </div>
    </div>

    <div v-if="error" class="card alert" role="alert">
      <strong>Failed to load</strong>
      <div class="muted small">{{ error }}</div>
      <button class="btn" type="button" @click="load" :disabled="busy">Retry</button>
    </div>

    <div v-else-if="busy && !task" class="card muted">Loading…</div>

    <div v-else-if="task" class="card">
      <div class="row">
        <div class="label">Title</div>
        <div class="value strong">{{ task.title }}</div>
      </div>
      <div class="row">
        <div class="label">Status</div>
        <div class="value"><span class="pill" :data-status="task.status">{{ task.status }}</span></div>
      </div>
      <div class="row">
        <div class="label">Project</div>
        <div class="value">
          <RouterLink class="link" :to="{ name: 'project-detail', params: { id: task.project_id } }">
            {{ task.project_id }}
          </RouterLink>
        </div>
      </div>
      <div class="row">
        <div class="label">Description</div>
        <div class="value muted">{{ task.description || '—' }}</div>
      </div>
      <div class="row">
        <div class="label">Created</div>
        <div class="value muted">{{ fmtDate(task.created_at) }}</div>
      </div>
      <div class="row">
        <div class="label">Updated</div>
        <div class="value muted">{{ fmtDate(task.updated_at) }}</div>
      </div>
    </div>

    <TaskFormModal
      :open="openEdit"
      mode="edit"
      :initial="task"
      @close="openEdit = false"
      @saved="onSaved"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import type { Task } from '@/api/types'
import { deleteTask, getTask } from '@/api/resources'
import { parseApiError } from '@/utils/apiErrors'
import { useRbac } from '@/utils/rbac'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'

const route = useRoute()
const router = useRouter()
const rbac = useRbac()

const id = computed(() => String(route.params.id ?? ''))

const task = ref<Task | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const openEdit = ref(false)

function fmtDate(v?: string) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}

async function load() {
  if (!id.value) return
  busy.value = true
  error.value = null
  try {
    task.value = await getTask(id.value)
  } catch (e) {
    error.value = parseApiError(e).message
  } finally {
    busy.value = false
  }
}

async function onDelete() {
  if (!rbac.canDelete) return
  if (!id.value) return
  const ok = window.confirm('Delete this task? This cannot be undone.')
  if (!ok) return

  busy.value = true
  try {
    await deleteTask(id.value)
    router.replace({ name: 'tasks' })
  } catch (e) {
    error.value = parseApiError(e).message
  } finally {
    busy.value = false
  }
}

function onSaved(t: Task) {
  task.value = t
}

onMounted(() => void load())
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}
.actions {
  display: flex;
  gap: 10px;
}
.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.danger {
  border: 1px solid #fecaca;
  background: #fff5f5;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.alert {
  border-color: #fecaca;
  background: #fff5f5;
}
.row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}
.row:last-child {
  border-bottom: none;
}
.label {
  color: #6b7280;
  font-size: 12px;
}
.value {
  word-break: break-word;
}
.strong {
  font-weight: 700;
}
.link {
  text-decoration: underline;
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
