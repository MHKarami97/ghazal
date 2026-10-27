<template>
  <div class="h-full flex flex-col bg-paper-light dark:bg-paper-dark border-r border-ink-200/60 dark:border-paper-border p-4 overflow-y-auto">
    <!-- هدر پنل -->
    <div class="flex items-center justify-between pb-3 border-b border-ink-200/60 dark:border-paper-border mb-4">
      <div class="flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 class="font-bold text-sm text-ink-900 dark:text-ink-50">
          تحلیل و آرایه‌های ادبی
        </h3>
      </div>
      <button
        v-if="selectedTag"
        @click="$emit('clear-selection')"
        class="text-xs text-brand-600 dark:text-brand-400 hover:underline"
      >
        نمایش همه
      </button>
    </div>

    <!-- حالت بدون برچسب -->
    <div
      v-if="!poemTags || poemTags.length === 0"
      class="flex-1 flex flex-col items-center justify-center text-center p-6 bg-paper-warm/40 dark:bg-paper-surface/30 rounded-2xl border border-dashed border-ink-200 dark:border-paper-border"
    >
      <BookOpen class="w-8 h-8 text-ink-400 mb-2" />
      <h4 class="text-xs font-bold text-ink-700 dark:text-ink-300 mb-1">
        فاقد برچسب آرایه
      </h4>
      <p class="text-[11px] text-ink-500 dark:text-ink-400 leading-relaxed max-w-xs">
        برای این شعر هنوز در پایگاه داده گنجور برچسب آرایه‌های ادبی ثبت نشده است. پژوهشگران به تدریج در حال تکمیل حاشیه‌نویسی‌های بلاغی هستند.
      </p>
    </div>

    <!-- نمایش جزئیات آرایه انتخاب‌شده -->
    <div v-else-if="selectedTag" class="space-y-4">
      <div class="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
        <div class="flex items-center justify-between mb-2">
          <span class="text-base font-bold text-brand-800 dark:text-brand-200">
            {{ currentDevice?.Name || `آرایه شماره ${selectedTag.DeviceId}` }}
          </span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-brand-200 dark:bg-brand-900/60 text-brand-900 dark:text-brand-200 font-medium">
            بیت {{ toPersianDigits(selectedTag.CoupletIndex + 1) }}
          </span>
        </div>

        <!-- برچسب‌های وضعیت: نامطمئن یا تولید ماشینی -->
        <div class="flex flex-wrap gap-1.5 mb-3">
          <span
            v-if="selectedTag.Uncertain"
            class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium flex items-center gap-1"
          >
            <AlertCircle class="w-3 h-3" />
            تحلیل غیرقطعی (Uncertain)
          </span>
          <span
            v-if="selectedTag.MachineGenerated"
            class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium flex items-center gap-1"
          >
            <Cpu class="w-3 h-3" />
            استخراج ماشینی (AI)
          </span>
        </div>

        <!-- تعریف آرایه -->
        <p v-if="currentDevice?.Definition" class="text-xs text-ink-700 dark:text-ink-300 leading-relaxed mb-3">
          {{ currentDevice.Definition }}
        </p>

        <!-- مثال شاخص -->
        <div v-if="currentDevice?.Example" class="p-2.5 rounded-xl bg-paper-light dark:bg-paper-dark border border-brand-500/20 text-xs">
          <div class="text-[10px] font-bold text-brand-600 dark:text-brand-400 mb-1">
            نمونه در ادبیات:
          </div>
          <div class="text-ink-600 dark:text-ink-300 italic">
            {{ currentDevice.Example }}
          </div>
        </div>
      </div>

      <!-- منبع و مجوز پژوهشی (AcademicCorpus) -->
      <div
        v-if="selectedTag.Origin === 'AcademicCorpus' && academicSource"
        class="p-3.5 rounded-xl bg-ink-50 dark:bg-paper-surface border border-ink-200 dark:border-paper-border text-xs"
      >
        <div class="flex items-center gap-1.5 font-bold text-ink-800 dark:text-ink-200 mb-1">
          <GraduationCap class="w-4 h-4 text-brand-600" />
          <span>منبع استخراج علمی:</span>
        </div>
        <div class="font-medium text-ink-700 dark:text-ink-300 mb-1">
          {{ academicSource.Title }}
        </div>
        <div class="text-[11px] text-ink-500 dark:text-ink-400 whitespace-pre-line mb-2">
          {{ academicSource.Authors }}
        </div>
        <div class="flex items-center justify-between text-[10px] text-ink-400 pt-2 border-t border-ink-200/60 dark:border-paper-border">
          <span>مجوز: {{ academicSource.License }}</span>
          <a
            :href="academicSource.Url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
          >
            مشاهده سند DOI
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>

    <!-- فهرست خلاصه کلیه آرایه‌های موجود در شعر -->
    <div v-else class="space-y-2.5">
      <div class="text-xs font-bold text-ink-500 dark:text-ink-400 mb-1">
        آرایه‌های شناسایی‌شده در این شعر ({{ toPersianDigits(poemTags.length) }} مورد):
      </div>

      <div
        v-for="(tag, idx) in poemTags"
        :key="idx"
        @click="$emit('select-tag', tag)"
        class="p-3 rounded-xl border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 cursor-pointer transition-all"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-xs text-ink-800 dark:text-ink-200">
            {{ getDeviceName(tag.DeviceId) }}
          </span>
          <span class="text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
            بیت {{ toPersianDigits(tag.CoupletIndex + 1) }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-ink-400">
          <span v-if="tag.Origin === 'AcademicCorpus'">پیکره علمی دانشگاهی</span>
          <span v-if="tag.Uncertain" class="text-amber-500">تحلیل احتمالی</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorLiteraryTag } from '../../types/ganjoor';
import {
  Sparkles,
  BookOpen,
  AlertCircle,
  Cpu,
  GraduationCap,
  ExternalLink
} from 'lucide-vue-next';

var props = defineProps<{
  poemTags?: GanjoorLiteraryTag[];
  selectedTag?: GanjoorLiteraryTag | null;
}>();

defineEmits(['select-tag', 'clear-selection']);

var literaryStore = useLiteraryStore();

var currentDevice = computed(function () {
  if (!props.selectedTag) return undefined;
  return literaryStore.getDeviceById(props.selectedTag.DeviceId);
});

var academicSource = computed(function () {
  if (!props.selectedTag || !props.selectedTag.SourceKey) return undefined;
  return literaryStore.getSourceByKey(props.selectedTag.SourceKey);
});

function getDeviceName(deviceId: number): string {
  var dev = literaryStore.getDeviceById(deviceId);
  return dev ? dev.Name : `آرایه ${deviceId}`;
}
</script>
