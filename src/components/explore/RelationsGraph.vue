<template>
  <div class="space-y-6">
    <!-- انتخاب اثر / کتاب (MasterCatId) -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200 dark:border-paper-border">
      <div>
        <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 mb-1">
          درخت تبارشناسی بر اساس اثر ادبی
        </h4>
        <p class="text-xs text-ink-500">
          روابط و خویشاوندی‌ها در نسخه‌های مختلف متفاوت است؛ یک کتاب را انتخاب کنید:
        </p>
      </div>

      <select
        v-model="selectedMasterCatId"
        class="px-4 py-2 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-800 dark:text-ink-100 text-xs font-bold outline-hidden focus:ring-2 focus:ring-brand-500"
      >
        <option :value="33">شاهنامه فردوسی (بزرگ‌ترین شجره‌نامه اساطیری)</option>
        <option :value="0">همهٔ آثار و اسناد</option>
      </select>
    </div>

    <!-- فهرست روابط خانوادگی در این اثر -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="rel in filteredRelations"
        :key="rel.Id"
        class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-xs hover:border-brand-500/40 transition-all"
      >
        <div class="flex items-center justify-between mb-3">
          <!-- شخص اول -->
          <router-link
            :to="`/person/${rel.Person1Id}`"
            class="font-bold text-sm text-brand-700 dark:text-brand-300 hover:underline"
          >
            {{ getPersonName(rel.Person1Id) }}
          </router-link>

          <!-- نوع نسبت -->
          <span class="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-800 dark:text-brand-300 font-medium border border-brand-500/20">
            {{ formatRelationType(rel.RelationType) }}
          </span>

          <!-- شخص دوم -->
          <router-link
            :to="`/person/${rel.Person2Id}`"
            class="font-bold text-sm text-ink-800 dark:text-ink-100 hover:underline"
          >
            {{ getPersonName(rel.Person2Id) }}
          </router-link>
        </div>

        <!-- ابیات شاهد (Evidence) -->
        <div v-if="rel.Evidence && rel.Evidence.length" class="mt-3 pt-3 border-t border-ink-200/60 dark:border-paper-border space-y-1.5">
          <div class="text-[11px] font-bold text-ink-500 dark:text-ink-400">
            ابیات شاهد در متن (Evidence):
          </div>
          <div
            v-for="(ev, eIdx) in rel.Evidence"
            :key="eIdx"
            class="text-[11px] text-ink-600 dark:text-ink-300 flex items-center justify-between bg-paper-warm/50 dark:bg-paper-dark/30 px-2.5 py-1.5 rounded-lg"
          >
            <span>شعر شناسه {{ toPersianDigits(ev.PoemId) }}، بیت {{ toPersianDigits(ev.CoupletIndex + 1) }}</span>
            <router-link
              :to="`/search?poemId=${ev.PoemId}`"
              class="text-brand-600 hover:underline text-[10px]"
            >
              مشاهده شعر
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- پیوندهای دوستی و دشمنی (Affiliations) -->
    <div class="mt-8">
      <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 mb-3">
        مناقشات و هم‌پیمانی‌های اساطیری و تاریخی
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="aff in literaryStore.affiliations.slice(0, 10)"
          :key="aff.Id"
          class="p-3.5 rounded-xl border border-ink-200/80 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-xs"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="font-bold text-ink-900 dark:text-ink-100">
              {{ getPersonName(aff.Person1Id) }} و {{ getPersonName(aff.Person2Id) }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full font-medium text-[10px]"
              :class="aff.AffiliationType === 'Rival' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'"
            >
              {{ aff.AffiliationType === 'Rival' ? 'هماورد / دشمنی' : 'هم‌پیمان' }}
            </span>
          </div>
          <p v-if="aff.Note" class="text-ink-600 dark:text-ink-400 leading-relaxed">
            {{ aff.Note }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorPersonRelation } from '../../types/ganjoor';

var literaryStore = useLiteraryStore();
var selectedMasterCatId = ref<number>(33); // پیش‌فرض شاهنامه

var filteredRelations = computed(function () {
  var rels = literaryStore.relations;
  if (!selectedMasterCatId.value) return rels;

  return rels.filter(function (r) {
    if (!r.Evidence || !r.Evidence.length) return false;
    return r.Evidence.some(function (ev) {
      return ev.MasterCatId === selectedMasterCatId.value;
    });
  });
});

function getPersonName(id: number): string {
  var person = literaryStore.getPersonById(id);
  return person ? person.Name : `شخص کد ${id}`;
}

function formatRelationType(type: string): string {
  switch (type) {
    case 'Parent': return 'پدر / مادرِ';
    case 'Sibling': return 'برادر / خواهرِ';
    case 'Spouse': return 'همسرِ';
    case 'Ancestor': return 'نیا و تبارِ';
    default: return type;
  }
}
</script>
