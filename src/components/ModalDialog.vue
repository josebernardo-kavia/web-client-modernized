<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" role="presentation" @mousedown.self="onBackdrop">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Dialog'"
        @keydown.esc.prevent="emit('close')"
        tabindex="-1"
        ref="root"
      >
        <div class="head">
          <div class="title">
            <slot name="title">
              {{ title }}
            </slot>
          </div>
          <button class="icon" type="button" aria-label="Close dialog" @click="emit('close')">
            ✕
          </button>
        </div>

        <div class="body">
          <slot />
        </div>

        <div class="foot" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    closeOnBackdrop?: boolean
  }>(),
  { title: '', closeOnBackdrop: true }
)

const emit = defineEmits<{ (e: 'close'): void }>()

const root = ref<HTMLElement | null>(null)

function onBackdrop() {
  if (props.closeOnBackdrop) emit('close')
}

watch(
  () => props.open,
  async (v) => {
    if (!v) return
    await nextTick()
    root.value?.focus()
  }
)
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 50;
}

.dialog {
  width: min(720px, 100%);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
  outline: none;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-weight: 700;
}

.icon {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.body {
  padding: 14px;
}

.foot {
  padding: 12px 14px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
