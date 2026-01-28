<template>
  <ModalDialog :open="open" :title="modeTitle" @close="emit('close')">
    <form class="form" @submit.prevent="onSubmit">
      <div v-if="formError" class="alert" role="alert">
        <strong>Unable to save</strong>
        <div class="muted small">{{ formError }}</div>
      </div>

      <label class="field">
        <span class="label">Name</span>
        <input class="input" v-model.trim="model.name" :disabled="busy" placeholder="Project name" />
        <div v-if="nameErr" class="err">{{ nameErr }}</div>
      </label>

      <label class="field">
        <span class="label">Description</span>
        <textarea
          class="textarea"
          v-model="model.description"
          :disabled="busy"
          placeholder="Optional description"
          rows="4"
        />
        <div v-if="descErr" class="err">{{ descErr }}</div>
      </label>

      <div class="muted small">
        Fields marked required must be provided. Changes are applied optimistically and rolled back on
        failure.
      </div>

      <template #footer>
        <button class="btn" type="button" @click="emit('close')" :disabled="busy">Cancel</button>
        <button class="primary" type="submit" :disabled="busy || !canSubmit">
          {{ busy ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save changes' }}
        </button>
      </template>
    </form>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ModalDialog from '@/components/ModalDialog.vue'
import type { Project } from '@/api/types'
import { formatFieldErrors, parseApiError, type FieldErrors } from '@/utils/apiErrors'
import { createProject, updateProject, type ProjectCreate, type ProjectUpdate } from '@/api/resources'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  initial?: Project | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', item: Project): void
}>()

const busy = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<FieldErrors>({})

const model = reactive<ProjectCreate>({
  name: '',
  description: ''
})

watch(
  () => props.open,
  (v) => {
    if (!v) return
    // Reset state each time the modal opens.
    formError.value = null
    fieldErrors.value = {}
    model.name = props.initial?.name ?? ''
    model.description = props.initial?.description ?? ''
  }
)

const modeTitle = computed(() => (props.mode === 'create' ? 'New Project' : 'Edit Project'))

function validate(): FieldErrors {
  const errs: FieldErrors = {}
  if (!model.name || model.name.trim().length < 2) {
    errs.name = ['Name must be at least 2 characters.']
  }
  if (model.description && model.description.length > 4000) {
    errs.description = ['Description is too long.']
  }
  return errs
}

const nameErr = computed(
  () => formatFieldErrors(fieldErrors.value, 'name') || formatFieldErrors(validate(), 'name')
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
    let saved: Project
    if (props.mode === 'create') {
      saved = await createProject({
        name: model.name.trim(),
        description: model.description ? model.description : null
      })
    } else {
      const id = props.initial?.id
      if (!id) throw new Error('Missing project id.')
      const payload: ProjectUpdate = {
        name: model.name.trim(),
        description: model.description ? model.description : null
      }
      saved = await updateProject(id, payload)
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

.field {
  display: grid;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #6b7280;
}

.input,
.textarea {
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
</style>
