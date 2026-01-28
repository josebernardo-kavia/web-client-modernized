<template>
  <ModalDialog :open="open" :title="modeTitle" @close="emit('close')">
    <form class="form" @submit.prevent="onSubmit">
      <div v-if="formError" class="alert" role="alert">
        <strong>Unable to save</strong>
        <div class="muted small">{{ formError }}</div>
      </div>

      <div class="grid2">
        <label class="field">
          <span class="label">Title</span>
          <input class="input" v-model.trim="model.title" :disabled="busy" placeholder="Task title" />
          <div v-if="titleErr" class="err">{{ titleErr }}</div>
        </label>

        <label class="field">
          <span class="label">Status</span>
          <select class="select" v-model="model.status" :disabled="busy">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
          <div v-if="statusErr" class="err">{{ statusErr }}</div>
        </label>
      </div>

      <label class="field">
        <span class="label">Project ID</span>
        <input
          class="input"
          v-model.trim="model.project_id"
          :disabled="busy"
          placeholder="UUID of the project"
        />
        <div v-if="projectErr" class="err">{{ projectErr }}</div>
      </label>

      <label class="field">
        <span class="label">Description</span>
        <textarea class="textarea" v-model="model.description" :disabled="busy" rows="4" />
        <div v-if="descErr" class="err">{{ descErr }}</div>
      </label>

      <template #footer>
        <button class="btn" type="button" @click="emit('close')" :disabled="busy">Cancel</button>
        <button class="primary" type="submit" :disabled="busy || !canSubmit">
          {{ busy ? 'Saving…' : mode === 'create' ? 'Create task' : 'Save changes' }}
        </button>
      </template>
    </form>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ModalDialog from '@/components/ModalDialog.vue'
import type { Task } from '@/api/types'
import { createTask, updateTask, type TaskCreate, type TaskUpdate } from '@/api/resources'
import { formatFieldErrors, parseApiError, type FieldErrors } from '@/utils/apiErrors'

const statusOptions = ['open', 'in_progress', 'done', 'blocked']

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: Task | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', item: Task): void
}>()

const busy = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<FieldErrors>({})

const model = reactive<TaskCreate>({
  project_id: '',
  title: '',
  description: '',
  status: 'open'
})

watch(
  () => props.open,
  (v) => {
    if (!v) return
    formError.value = null
    fieldErrors.value = {}
    model.project_id = props.initial?.project_id ?? ''
    model.title = props.initial?.title ?? ''
    model.description = props.initial?.description ?? ''
    model.status = props.initial?.status ?? 'open'
  }
)

const modeTitle = computed(() => (props.mode === 'create' ? 'New Task' : 'Edit Task'))

function validate(): FieldErrors {
  const errs: FieldErrors = {}
  if (!model.title || model.title.trim().length < 2) errs.title = ['Title must be at least 2 characters.']
  if (!model.project_id || model.project_id.trim().length < 8)
    errs.project_id = ['Project ID looks invalid.']
  if (!model.status) errs.status = ['Status is required.']
  if (model.description && model.description.length > 4000) errs.description = ['Description is too long.']
  return errs
}

const titleErr = computed(
  () => formatFieldErrors(fieldErrors.value, 'title') || formatFieldErrors(validate(), 'title')
)
const projectErr = computed(
  () => formatFieldErrors(fieldErrors.value, 'project_id') || formatFieldErrors(validate(), 'project_id')
)
const statusErr = computed(
  () => formatFieldErrors(fieldErrors.value, 'status') || formatFieldErrors(validate(), 'status')
)
const descErr = computed(
  () =>
    formatFieldErrors(fieldErrors.value, 'description') || formatFieldErrors(validate(), 'description')
)

const canSubmit = computed(() => Object.keys(validate()).length === 0 && !busy.value)

async function onSubmit() {
  if (busy.value) return

  const clientErrs = validate()
  if (Object.keys(clientErrs).length > 0) {
    fieldErrors.value = clientErrs
    return
  }

  busy.value = true
  formError.value = null
  fieldErrors.value = {}

  try {
    let saved: Task
    if (props.mode === 'create') {
      saved = await createTask({
        project_id: model.project_id.trim(),
        title: model.title.trim(),
        description: model.description ? model.description : null,
        status: model.status
      })
    } else {
      const id = props.initial?.id
      if (!id) throw new Error('Missing task id.')
      const payload: TaskUpdate = {
        project_id: model.project_id.trim(),
        title: model.title.trim(),
        description: model.description ? model.description : null,
        status: model.status
      }
      saved = await updateTask(id, payload)
    }

    emit('saved', saved)
    emit('close')
  } catch (e) {
    const parsed = parseApiError(e)
    formError.value = parsed.message
    fieldErrors.value = parsed.fieldErrors
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 12px;
}
.field {
  display: grid;
  gap: 6px;
}
.label {
  font-size: 12px;
  color: #6b7280;
}
.input,
.textarea,
.select {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: 8px;
  padding: 9px 10px;
  width: 100%;
}
.textarea {
  resize: vertical;
}
.err {
  color: #b42318;
  font-size: 12px;
}
.alert {
  border: 1px solid #fecaca;
  background: #fff5f5;
  border-radius: 10px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}
.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 9px 12px;
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
@media (max-width: 640px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}
</style>
