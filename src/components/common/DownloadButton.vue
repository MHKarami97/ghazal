<template>
  <button
    type="button"
    class="disabled:cursor-wait"
    :class="variantClass"
    :title="title || computedLabel"
    :aria-busy="isActive"
    @click="onClick"
  >
    <InlineSpinner v-if="isActive" size="sm" />
    <Download v-else class="w-3.5 h-3.5" />
    <span v-if="variant !== 'icon'">{{ computedLabel }}</span>
    <span v-else-if="isActive" class="text-[10px] font-bold">{{ percentText }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download } from 'lucide-vue-next';
import { useDataStore } from '../../stores/dataStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import InlineSpinner from './InlineSpinner.vue';

var props = withDefaults(
  defineProps<{
    packageId: string;
    idleLabel?: string;
    busyLabel?: string;
    variant?: 'link' | 'solid' | 'icon';
    title?: string;
  }>(),
  { idleLabel: 'دانلود', busyLabel: 'در حال دانلود', variant: 'link' }
);

var emit = defineEmits<{ (e: 'start'): void }>();
var dataStore = useDataStore();

var progress = computed(function () {
  return dataStore.getProgress(props.packageId);
});

var isActive = computed(function () {
  return dataStore.isDownloadActive(props.packageId);
});

var isInterrupted = computed(function () {
  return dataStore.installedPackages.some(function (p) {
    return p.id === props.packageId && (p.status === 'interrupted' || p.status === 'error');
  });
});

var percentText = computed(function () {
  var pct = progress.value ? progress.value.percent : 0;
  return `٪${toPersianDigits(pct)}`;
});

var computedLabel = computed(function () {
  if (isActive.value) {
    var status = progress.value?.status;
    if (status === 'preparing') return 'در حال آماده‌سازی...';
    if (status === 'finalizing') return 'در حال ذخیره‌سازی...';
    if (status === 'paused') return `متوقف‌شده ${percentText.value}`;
    return `${props.busyLabel} ${percentText.value}`;
  }
  return isInterrupted.value ? 'ادامهٔ دانلود' : props.idleLabel;
});

var variantClass = computed(function () {
  if (props.variant === 'solid') {
    return 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors';
  }
  if (props.variant === 'icon') {
    return 'inline-flex items-center gap-1 p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors';
  }
  return 'inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline';
});

function onClick() {
  if (isActive.value) {
    dataStore.isDownloadPanelOpen = true;
    return;
  }
  emit('start');
}
</script>
