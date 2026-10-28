<template>
  <div class="pointer-events-none fixed inset-x-0 top-0 z-[70]" aria-live="polite">
    <transition name="activity-fade">
      <div
        v-if="isBarVisible"
        class="relative h-1 w-full overflow-hidden bg-brand-500/15"
        role="progressbar"
        aria-label="در حال ارتباط با سرور"
      >
        <div class="activity-bar absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-l from-brand-400 via-brand-600 to-brand-400"></div>
      </div>
    </transition>

    <transition name="activity-fade">
      <div
        v-if="isChipVisible"
        class="mx-auto mt-3 flex w-max max-w-[90vw] items-center gap-2 rounded-full border border-brand-500/30 bg-paper-light/95 px-3.5 py-1.5 text-[11px] font-bold text-ink-700 shadow-lifted backdrop-blur-md dark:bg-paper-surface/95 dark:text-ink-200"
      >
        <InlineSpinner size="xs" class="text-brand-600" />
        <span>در حال دریافت اطلاعات از سرور...</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { networkActivity } from '../../services/NetworkActivityService';
import InlineSpinner from './InlineSpinner.vue';

var BAR_DELAY_MS = 120;
var CHIP_DELAY_MS = 700;

var isBarVisible = ref<boolean>(false);
var isChipVisible = ref<boolean>(false);
var barTimer: ReturnType<typeof setTimeout> | null = null;
var chipTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (barTimer) clearTimeout(barTimer);
  if (chipTimer) clearTimeout(chipTimer);
  barTimer = null;
  chipTimer = null;
}

watch(
  networkActivity.isBusy,
  function (busy) {
    if (busy) {
      if (barTimer || isBarVisible.value) return;
      barTimer = setTimeout(function () { isBarVisible.value = true; }, BAR_DELAY_MS);
      chipTimer = setTimeout(function () { isChipVisible.value = true; }, CHIP_DELAY_MS);
      return;
    }
    clearTimers();
    isBarVisible.value = false;
    isChipVisible.value = false;
  },
  { immediate: true }
);

onBeforeUnmount(clearTimers);
</script>

<style scoped>
.activity-bar {
  animation: activity-slide 1.1s ease-in-out infinite;
}

@keyframes activity-slide {
  0% { inset-inline-start: -35%; }
  100% { inset-inline-start: 100%; }
}

.activity-fade-enter-active,
.activity-fade-leave-active {
  transition: opacity 0.2s ease;
}

.activity-fade-enter-from,
.activity-fade-leave-to {
  opacity: 0;
}
</style>
