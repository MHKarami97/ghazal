<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
    <div class="bg-paper-light dark:bg-paper-surface w-full max-w-lg rounded-2xl border border-ink-200 dark:border-paper-border p-6 shadow-2xl flex flex-col items-center">
      <!-- هدر مدال -->
      <div class="w-full flex items-center justify-between pb-4 border-b border-ink-200/60 dark:border-paper-border mb-4">
        <h3 class="text-lg font-bold text-ink-900 dark:text-ink-50">
          کارت اشتراک‌گذاری بیت
        </h3>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- پیش‌نمایش تصویر کارت -->
      <div class="w-full aspect-square max-h-[380px] rounded-xl overflow-hidden border border-brand-500/30 shadow-md mb-6 flex items-center justify-center bg-paper-warm">
        <img
          v-if="cardDataUrl"
          :src="cardDataUrl"
          alt="کارت شعر"
          class="w-full h-full object-contain"
        />
        <div v-else class="text-sm text-ink-500 animate-pulse">
          در حال آماده‌سازی کارت...
        </div>
      </div>

      <!-- دکمه‌های اقدام -->
      <div class="w-full flex items-center gap-3">
        <button
          @click="downloadImage"
          class="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Download class="w-4 h-4" />
          دانلود تصویر کارت
        </button>
        <button
          @click="copyPoemText"
          class="py-2.5 px-4 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Copy class="w-4 h-4" />
          کپی متن
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { exportService } from '../../services/ExportService';
import { X, Download, Copy } from 'lucide-vue-next';

var props = defineProps<{
  show: boolean;
  firstMisra: string;
  secondMisra: string;
  poetName: string;
  poemTitle?: string;
}>();

var emit = defineEmits(['close']);
var cardDataUrl = ref<string>('');

watch(
  () => props.show,
  function (newVal) {
    if (newVal) {
      setTimeout(function () {
        var canvas = exportService.generatePoemCardCanvas(
          props.firstMisra,
          props.secondMisra,
          props.poetName,
          props.poemTitle
        );
        cardDataUrl.value = canvas.toDataURL('image/png');
      }, 50);
    }
  }
);

function downloadImage() {
  if (!cardDataUrl.value) return;
  var a = document.createElement('a');
  a.href = cardDataUrl.value;
  a.download = `ghazal-${Date.now()}.png`;
  a.click();
}

function copyPoemText() {
  var text = `${props.firstMisra}\n${props.secondMisra}\n\n— ${props.poetName}`;
  navigator.clipboard.writeText(text);
  alert('متن بیت در کلیپ‌بورد کپی شد.');
}
</script>
