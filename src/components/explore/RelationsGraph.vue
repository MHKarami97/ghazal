<template>
  <div class="space-y-6">
    <!-- فیلتر و جست‌وجوی تبارشناسی -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-paper-warm/80 dark:bg-paper-surface/80 border border-ink-200 dark:border-paper-border">
      <div class="flex-1">
        <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 mb-1">
          پیوندها و تبارشناسی شخصیت‌های ادبی
        </h4>
        <p class="text-xs text-ink-500">
          جست‌وجوی روابط خویشاوندی و شجره‌نامه‌ها در متون و آثار ادبی
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- جست‌وجوی نام شخصیت -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="جست‌وجوی شخصیت (رستم، سهراب...)"
          class="px-3 py-2 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-800 dark:text-ink-100 text-xs outline-hidden focus:ring-2 focus:ring-brand-500"
        />

        <!-- فیلتر بر اساس اثر / منبع -->
        <select
          v-model="selectedMasterCatId"
          class="px-3 py-2 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-ink-800 dark:text-ink-100 text-xs font-bold outline-hidden focus:ring-2 focus:ring-brand-500"
        >
          <option :value="0">همهٔ آثار و اسناد ({{ toPersianDigits(literaryStore.relations.length) }})</option>
          <option v-for="cat in availableMasterCats" :key="cat.id" :value="cat.id">
            اثر کد {{ toPersianDigits(cat.id) }} ({{ toPersianDigits(cat.count) }} رابطه)
          </option>
        </select>
      </div>
    </div>

    <!-- حالت لودینگ -->
    <div v-if="literaryStore.isLoading && !literaryStore.relations.length" class="text-center py-12">
      <div class="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-2"></div>
      <p class="text-xs text-ink-500">در حال دریافت داده‌های تبارشناسی و پیوندها...</p>
    </div>

    <!-- حالت خالی -->
    <div v-else-if="!filteredRelations.length" class="text-center py-12 p-6 rounded-2xl bg-paper-warm/50 dark:bg-paper-surface/50 border border-dashed border-ink-300 dark:border-paper-border">
      <p class="text-sm font-bold text-ink-700 dark:text-ink-300 mb-1">هیچ پیوندی با این مشخصات یافت نشد</p>
      <p class="text-xs text-ink-500">می‌توانید عبارت جست‌وجو را تغییر دهید یا فیلتر را روی «همهٔ آثار و اسناد» بگذارید.</p>
    </div>

    <!-- فهرست روابط خانوادگی در این اثر -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="rel in visibleRelations"
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
            شاهد در متن (Evidence):
          </div>
          <div
            v-for="(ev, eIdx) in rel.Evidence.slice(0, 3)"
            :key="eIdx"
            class="text-[11px] text-ink-600 dark:text-ink-300 flex items-center justify-between bg-paper-warm/50 dark:bg-paper-dark/30 px-2.5 py-1.5 rounded-lg"
          >
            <span>شعر کد {{ toPersianDigits(ev.PoemId) }}، بیت {{ toPersianDigits(ev.CoupletIndex + 1) }}</span>
            <router-link
              :to="`/poem/${ev.PoemId}?couplet=${ev.CoupletIndex}`"
              class="text-brand-600 hover:underline text-[10px]"
            >
              مشاهده شعر
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- دکمه نمایش بیشتر -->
    <div v-if="visibleLimit < filteredRelations.length" class="text-center pt-2">
      <button
        @click="visibleLimit += 40"
        class="px-5 py-2.5 rounded-xl text-xs font-bold bg-paper-warm dark:bg-paper-surface hover:bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-ink-200 dark:border-paper-border transition-colors"
      >
        نمایش موارد بیشتر ({{ toPersianDigits(filteredRelations.length - visibleLimit) }} مورد باقی‌مانده)
      </button>
    </div>

    <!-- پیوندهای دوستی و دشمنی (Affiliations) -->
    <div v-if="literaryStore.affiliations && literaryStore.affiliations.length" class="mt-8">
      <h4 class="font-bold text-sm text-ink-900 dark:text-ink-50 mb-3">
        مناقشات و هم‌پیمانی‌های اساطیری و تاریخی
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="aff in literaryStore.affiliations.slice(0, 16)"
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
import { ref, computed, onMounted } from 'vue';
import { useLiteraryStore } from '../../stores/literaryStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import type { GanjoorPersonRelation } from '../../types/ganjoor';

var literaryStore = useLiteraryStore();
var selectedMasterCatId = ref<number>(0); // پیش‌فرض نمایش همه پیوندها
var searchQuery = ref<string>('');
var visibleLimit = ref<number>(40);

onMounted(async function () {
  await literaryStore.loadBaseMeta();
});

var availableMasterCats = computed(function () {
  var countMap = new Map<number, number>();
  var rels = literaryStore.relations;
  for (var i = 0; i < rels.length; i++) {
    var rel = rels[i];
    if (rel.Evidence && rel.Evidence.length) {
      for (var j = 0; j < rel.Evidence.length; j++) {
        var catId = rel.Evidence[j].MasterCatId;
        if (catId) {
          countMap.set(catId, (countMap.get(catId) || 0) + 1);
        }
      }
    }
  }

  var list: { id: number; count: number }[] = [];
  countMap.forEach(function (count, id) {
    list.push({ id: id, count: count });
  });

  return list.sort(function (a, b) {
    return b.count - a.count;
  });
});

var filteredRelations = computed(function () {
  var rels = literaryStore.relations;

  if (selectedMasterCatId.value !== 0) {
    rels = rels.filter(function (r) {
      if (!r.Evidence || !r.Evidence.length) return false;
      return r.Evidence.some(function (ev) {
        return ev.MasterCatId === selectedMasterCatId.value;
      });
    });
  }

  if (searchQuery.value.trim()) {
    var q = searchQuery.value.trim();
    rels = rels.filter(function (r) {
      var name1 = getPersonName(r.Person1Id);
      var name2 = getPersonName(r.Person2Id);
      return name1.includes(q) || name2.includes(q);
    });
  }

  return rels;
});

var visibleRelations = computed(function () {
  return filteredRelations.value.slice(0, visibleLimit.value);
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
