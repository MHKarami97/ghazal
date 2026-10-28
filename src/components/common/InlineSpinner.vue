<template>
  <span
    class="inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
    :class="sizeClass"
    role="status"
    aria-label="در حال بارگذاری"
  ></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

var props = withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md';
  }>(),
  { size: 'sm' }
);

var sizeClass = computed(function () {
  if (props.size === 'xs') return 'w-3 h-3';
  if (props.size === 'md') return 'w-5 h-5';
  return 'w-3.5 h-3.5';
});
</script>
