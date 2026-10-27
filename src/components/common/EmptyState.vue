<template>
  <div class="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-ink-200 dark:border-paper-border rounded-2xl bg-paper-warm/40 dark:bg-paper-dark/30">
    <div class="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
      <component :is="iconComponent" class="w-7 h-7" />
    </div>
    <h3 class="text-base font-bold text-ink-800 dark:text-ink-200 mb-1">
      {{ title || 'موردی یافت نشد' }}
    </h3>
    <p v-if="description" class="text-xs text-ink-500 dark:text-ink-400 max-w-sm mb-4">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BookX, SearchX, Inbox } from 'lucide-vue-next';

var props = defineProps<{
  title?: string;
  description?: string;
  type?: 'search' | 'empty' | 'book';
}>();

var iconComponent = computed(function () {
  if (props.type === 'search') return SearchX;
  if (props.type === 'book') return BookX;
  return Inbox;
});
</script>
