<template>
  <div class="space-y-8 pb-12">
    <!-- عنوان و تب‌های کاوش -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
          کاوش ادبی و جغرافیایی
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          پیمایش مکان‌ها بر روی نقشه، تبارشناسی اساطیری و خط زمان مفاخر
        </p>
      </div>

      <!-- تب‌های سه گانه -->
      <div class="flex bg-ink-200/60 dark:bg-paper-surface p-1 rounded-2xl">
        <button
          @click="tab = 'map'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="tab === 'map' ? 'bg-paper-light dark:bg-paper-dark text-brand-700 dark:text-brand-300 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
        >
          <MapPin class="w-3.5 h-3.5" />
          نقشهٔ دیارها
        </button>
        <button
          @click="tab = 'relations'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="tab === 'relations' ? 'bg-paper-light dark:bg-paper-dark text-brand-700 dark:text-brand-300 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
        >
          <GitMerge class="w-3.5 h-3.5" />
          تبارشناسی و پیوندها
        </button>
        <button
          @click="tab = 'timeline'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          :class="tab === 'timeline' ? 'bg-paper-light dark:bg-paper-dark text-brand-700 dark:text-brand-300 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
        >
          <Clock class="w-3.5 h-3.5" />
          خط زمان اشخاص
        </button>
      </div>
    </div>

    <!-- کامپوننت متناسب با تب انتخابی -->
    <div class="mt-4">
      <LiteraryMap v-if="tab === 'map'" />
      <RelationsGraph v-else-if="tab === 'relations'" />
      <PeopleTimeline v-else-if="tab === 'timeline'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLiteraryStore } from '../stores/literaryStore';
import LiteraryMap from '../components/explore/LiteraryMap.vue';
import RelationsGraph from '../components/explore/RelationsGraph.vue';
import PeopleTimeline from '../components/explore/PeopleTimeline.vue';
import { MapPin, GitMerge, Clock } from 'lucide-vue-next';

var literaryStore = useLiteraryStore();
var tab = ref<'map' | 'relations' | 'timeline'>('map');

onMounted(async function () {
  await literaryStore.loadBaseMeta();
});
</script>
