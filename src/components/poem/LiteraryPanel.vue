<template>
  <div class="h-full flex flex-col bg-paper-light dark:bg-paper-dark border-r border-ink-200/60 dark:border-paper-border p-4 overflow-y-auto space-y-5">
    <!-- بخش ۱: تحلیل و آرایه‌های ادبی -->
    <div>
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
        class="flex flex-col items-center justify-center text-center p-5 bg-paper-warm/40 dark:bg-paper-surface/30 rounded-2xl border border-dashed border-ink-200 dark:border-paper-border"
      >
        <BookOpen class="w-7 h-7 text-ink-400 mb-2" />
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

    <!-- بخش ۲: اشخاص و مکان‌های جغرافیایی نام‌برده‌شده در شعر -->
    <div v-if="poem" class="pt-4 border-t border-ink-200/60 dark:border-paper-border space-y-3">
      <div class="flex items-center gap-2">
        <Compass class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
        <h4 class="font-bold text-xs text-ink-900 dark:text-ink-50">
          اشخاص و مکان‌های جغرافیایی شعر
        </h4>
      </div>

      <div v-if="mentionedData.people.length === 0 && mentionedData.locations.length === 0" class="p-3 rounded-xl bg-paper-warm/40 dark:bg-paper-surface/40 border border-dashed border-ink-200/80 dark:border-paper-border text-[11px] text-ink-500 leading-relaxed">
        در این سروده هنوز نام شخصیت تاریخی یا مکان جغرافیایی مشخصی ثبت نشده است.
      </div>

      <div v-else class="space-y-3">
        <!-- مکان‌های جغرافیایی -->
        <div v-if="mentionedData.locations.length > 0" class="space-y-1.5">
          <div class="text-[11px] font-bold text-ink-500 dark:text-ink-400 flex items-center justify-between">
            <span class="flex items-center gap-1">
              <MapPin class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              مکان‌های جغرافیایی ({{ toPersianDigits(mentionedData.locations.length) }})
            </span>
            <router-link to="/explore?tab=map" class="text-[10px] text-brand-600 dark:text-brand-400 hover:underline">
              نقشه ادبی
            </router-link>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <div
              v-for="loc in mentionedData.locations"
              :key="loc.id"
              class="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] flex items-center gap-1.5"
            >
              <span class="font-bold text-emerald-800 dark:text-emerald-200">{{ loc.name }}</span>
              <button
                v-if="loc.coupletIndexes.length > 0"
                type="button"
                @click="$emit('jump-couplet', loc.coupletIndexes[0])"
                class="text-[10px] px-1.5 py-0.2 rounded-md bg-paper-light/80 dark:bg-paper-dark text-emerald-700 dark:text-emerald-300 hover:underline"
                title="رفتن به بیت"
              >
                بیت {{ toPersianDigits(loc.coupletIndexes[0] + 1) }}
              </button>
            </div>
          </div>
        </div>

        <!-- اشخاص و شخصیت‌ها -->
        <div v-if="mentionedData.people.length > 0" class="space-y-1.5">
          <div class="text-[11px] font-bold text-ink-500 dark:text-ink-400 flex items-center gap-1">
            <Users class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>اشخاص و اساطیر ({{ toPersianDigits(mentionedData.people.length) }})</span>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="person in mentionedData.people"
              :key="person.id"
              class="p-2.5 rounded-xl bg-paper-warm/60 dark:bg-paper-surface border border-ink-200/70 dark:border-paper-border flex items-center justify-between gap-2 text-xs"
            >
              <div class="min-w-0">
                <router-link
                  :to="`/person/${person.id}`"
                  class="font-bold text-brand-700 dark:text-brand-300 hover:underline block truncate"
                >
                  {{ person.name }}
                </router-link>
                <span v-if="person.caption" class="text-[10px] text-ink-400 block truncate">
                  {{ person.caption }}
                </span>
              </div>
              <button
                v-if="person.coupletIndexes.length > 0"
                type="button"
                @click="$emit('jump-couplet', person.coupletIndexes[0])"
                class="text-[10px] px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold shrink-0 hover:bg-brand-500/20 transition-colors"
              >
                بیت {{ toPersianDigits(person.coupletIndexes[0] + 1) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- بخش ۳: آمار تکمیلی قافیه، ردیف و سبک شعر -->
    <div v-if="styleStats" class="pt-4 border-t border-ink-200/60 dark:border-paper-border space-y-3">
      <div class="flex items-center gap-2">
        <BarChart2 class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
        <h4 class="font-bold text-xs text-ink-900 dark:text-ink-50">
          آمار تکمیلی قافیه، ردیف و سبک شعر
        </h4>
      </div>

      <!-- ارقام ساختاری -->
      <div class="grid grid-cols-2 gap-2 text-[11px]">
        <div class="p-2.5 rounded-xl bg-paper-warm/70 dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border">
          <span class="text-ink-400 block">تعداد ابیات / مصراع</span>
          <strong class="font-bold text-ink-900 dark:text-ink-100">
            {{ toPersianDigits(styleStats.coupletCount) }} بیت ({{ toPersianDigits(styleStats.verseCount) }} مصراع)
          </strong>
        </div>
        <div class="p-2.5 rounded-xl bg-paper-warm/70 dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border">
          <span class="text-ink-400 block">غنای واژگانی</span>
          <strong class="font-bold text-ink-900 dark:text-ink-100">
            ٪{{ toPersianDigits(styleStats.lexicalRichness) }} ({{ toPersianDigits(styleStats.uniqueWords) }} از {{ toPersianDigits(styleStats.totalWords) }})
          </strong>
        </div>
        <div class="p-2.5 rounded-xl bg-paper-warm/70 dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border">
          <span class="text-ink-400 block">میانگین واژه در بیت</span>
          <strong class="font-bold text-ink-900 dark:text-ink-100">
            {{ toPersianDigits(styleStats.avgWordsPerCouplet) }} واژه
          </strong>
        </div>
        <div class="p-2.5 rounded-xl bg-paper-warm/70 dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border">
          <span class="text-ink-400 block">زمان مطالعه تقریبی</span>
          <strong class="font-bold text-ink-900 dark:text-ink-100">
            حدود {{ toPersianDigits(styleStats.estimatedReadMinutes) }} دقیقه
          </strong>
        </div>
      </div>

      <!-- قافیه، ردیف و منبع -->
      <div class="p-3 rounded-xl bg-paper-warm/50 dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border space-y-2 text-[11px]">
        <div class="flex items-center justify-between gap-2">
          <span class="text-ink-500">حروف قافیه (گنجور):</span>
          <span class="font-bold text-brand-700 dark:text-brand-300">
            {{ styleStats.rhymeLetters || 'ثبت‌نشده' }}
          </span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <span class="text-ink-500">ردیف تشخیص‌داده‌شده:</span>
          <span class="font-bold text-ink-900 dark:text-ink-100">
            {{ styleStats.radif || 'فاقد ردیف مشترک' }}
          </span>
        </div>

        <div v-if="styleStats.rhymeWords.length > 0" class="pt-1 border-t border-ink-200/40 dark:border-paper-border/50">
          <span class="text-ink-400 block mb-1">نمونه واژگان قافیه / پایان مصراع:</span>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(rw, rIdx) in styleStats.rhymeWords"
              :key="rIdx"
              class="px-2 py-0.5 rounded-md bg-paper-light dark:bg-paper-dark border border-ink-200/70 dark:border-paper-border text-ink-800 dark:text-ink-200 font-medium"
            >
              {{ rw }}
            </span>
          </div>
        </div>

        <div v-if="styleStats.sourceName" class="pt-1 border-t border-ink-200/40 dark:border-paper-border/50 flex items-center justify-between gap-2">
          <span class="text-ink-500 shrink-0">منبع چاپی:</span>
          <span class="font-medium text-ink-700 dark:text-ink-300 text-left truncate" :title="styleStats.sourceName">
            {{ styleStats.sourceName }}
          </span>
        </div>
      </div>

      <!-- واج‌آرایی و بسامد صامت‌ها -->
      <div v-if="styleStats.topConsonants.length > 0" class="space-y-1.5 text-[11px]">
        <span class="text-ink-500 dark:text-ink-400 font-bold block">
          واج‌آرایی (پربسامدترین حروف صامت شعر):
        </span>
        <div class="grid grid-cols-4 gap-1.5">
          <div
            v-for="item in styleStats.topConsonants"
            :key="item.letter"
            class="p-2 rounded-xl bg-brand-500/5 border border-brand-500/20 text-center"
          >
            <div class="text-sm font-black text-brand-700 dark:text-brand-300">
              {{ item.letter }}
            </div>
            <div class="text-[10px] text-ink-500">
              ٪{{ toPersianDigits(item.percentage) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import { analyzePoemStyle, extractPoemPeopleAndLocations } from '../../utils/poemStyleAnalytics';
import type { GanjoorLiteraryTag, GanjoorPoem } from '../../types/ganjoor';
import {
  Sparkles,
  BookOpen,
  AlertCircle,
  Cpu,
  GraduationCap,
  ExternalLink,
  Compass,
  MapPin,
  Users,
  BarChart2
} from 'lucide-vue-next';

var props = defineProps<{
  poem?: GanjoorPoem | null;
  poemTags?: GanjoorLiteraryTag[];
  selectedTag?: GanjoorLiteraryTag | null;
}>();

defineEmits(['select-tag', 'clear-selection', 'jump-couplet']);

var literaryStore = useLiteraryStore();

var currentDevice = computed(function () {
  if (!props.selectedTag) return undefined;
  return literaryStore.getDeviceById(props.selectedTag.DeviceId);
});

var academicSource = computed(function () {
  if (!props.selectedTag || !props.selectedTag.SourceKey) return undefined;
  return literaryStore.getSourceByKey(props.selectedTag.SourceKey);
});

var styleStats = computed(function () {
  if (!props.poem) return null;
  return analyzePoemStyle(props.poem);
});

var mentionedData = computed(function () {
  if (!props.poem) {
    return { locations: [], people: [] };
  }
  return extractPoemPeopleAndLocations(props.poem, {
    geotags: literaryStore.geotags,
    people: literaryStore.people,
    relations: literaryStore.relations,
    affiliations: literaryStore.affiliations,
    concepts: literaryStore.concepts,
    getLocationById: literaryStore.getLocationById,
    getPersonById: literaryStore.getPersonById
  });
});

function getDeviceName(deviceId: number): string {
  var dev = literaryStore.getDeviceById(deviceId);
  return dev ? dev.Name : `آرایه ${deviceId}`;
}
</script>
