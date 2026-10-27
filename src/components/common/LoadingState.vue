<template>
  <div class="flex flex-col items-center justify-center p-12 text-center">
    <div class="w-12 h-12 rounded-full border-3 border-brand-500/20 border-t-brand-600 animate-spin mb-4"></div>
    <p class="text-sm font-medium text-ink-600 dark:text-ink-300">
      {{ message || 'در حال بارگذاری اطلاعات...' }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
}>();
</script>
