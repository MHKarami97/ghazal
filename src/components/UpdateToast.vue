<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
});

function reload() {
  updateServiceWorker(true);
}

function dismiss() {
  needRefresh.value = false;
}
</script>

<template>
  <div
    v-if="needRefresh"
    class="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-brand-500/40 shadow-2xl flex items-center gap-4 max-w-[92vw] text-xs font-medium"
  >
    <span class="text-ink-800 dark:text-ink-100">نسخهٔ جدید برنامه موجود است. برای اعمال، برنامه را به‌روزرسانی کنید.</span>
    <button
      class="py-1.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors shadow-xs"
      @click="reload"
    >
      به‌روزرسانی
    </button>
    <button
      class="p-1 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
      title="بستن"
      @click="dismiss"
    >
      ✕
    </button>
  </div>
</template>
