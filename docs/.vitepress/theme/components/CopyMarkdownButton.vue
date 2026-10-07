<script setup lang="ts">
import { ref } from 'vue';
import { useData } from 'vitepress';

const { page } = useData();
const status = ref<'idle' | 'ok' | 'err'>('idle');

async function copyMarkdown() {
  const raw = (page.value as { markdownRaw?: string }).markdownRaw;
  if (!raw) {
    status.value = 'err';
    return;
  }
  try {
    await navigator.clipboard.writeText(raw);
    status.value = 'ok';
    window.setTimeout(() => {
      status.value = 'idle';
    }, 2000);
  } catch {
    status.value = 'err';
  }
}

const label = () => {
  if (status.value === 'ok') return 'Copié !';
  if (status.value === 'err') return 'Copie impossible';
  return 'Copier le Markdown';
};
</script>

<template>
  <div v-if="page.markdownRaw" class="copy-md-bar">
    <button type="button" class="copy-md-btn" :class="status" @click="copyMarkdown">
      {{ label() }}
    </button>
    <span class="copy-md-hint">Coller dans un prompt Cursor / LLM</span>
  </div>
</template>

<style scoped>
.copy-md-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 0.75rem;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.copy-md-btn {
  font-size: 13px;
  font-weight: 500;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  cursor: pointer;
  transition: opacity 0.15s;
}

.copy-md-btn:hover {
  opacity: 0.9;
}

.copy-md-btn.ok {
  border-color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-1);
}

.copy-md-btn.err {
  border-color: var(--vp-c-warning-1);
  color: var(--vp-c-warning-1);
}

.copy-md-hint {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
</style>
