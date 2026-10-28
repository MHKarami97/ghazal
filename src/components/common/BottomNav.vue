<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md border-t border-ink-200/60 dark:border-paper-border pb-safe transition-colors"
    aria-label="ناوبری اصلی موبایل"
  >
    <div class="flex items-stretch justify-around h-16 px-1">
      <router-link
        v-for="item in primaryItems"
        :key="item.path"
        :to="item.path"
        class="relative flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors"
        :class="[
          isActive(item.path)
            ? 'text-brand-600 dark:text-brand-400 font-bold'
            : 'text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 mb-1" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="absolute top-1 end-1/4 min-w-4 px-1 py-0.5 rounded-full text-[9px] font-bold bg-brand-500 text-white"
        >
          {{ item.badge }}
        </span>
      </router-link>

      <button
        type="button"
        class="relative flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors"
        :class="isMenuActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-ink-500 dark:text-ink-400'"
        aria-haspopup="dialog"
        :aria-expanded="isMoreOpen"
        @click="isMoreOpen = true"
      >
        <span class="relative">
          <Menu class="w-5 h-5 mb-1" />
          <span
            v-if="hasSecondaryActive"
            class="absolute -top-0.5 -end-1 w-2 h-2 rounded-full bg-brand-500"
          ></span>
        </span>
        <span>بیشتر</span>
      </button>
    </div>

    <teleport to="body">
      <transition name="sheet-fade">
        <div
          v-if="isMoreOpen"
          class="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="همهٔ بخش‌ها"
          @click.self="close"
        >
          <div class="w-full max-h-[82vh] flex flex-col rounded-t-3xl border-t border-ink-200 bg-paper-light shadow-2xl dark:border-paper-border dark:bg-paper-surface">
            <div class="flex items-center justify-between px-5 py-4 border-b border-ink-200/60 dark:border-paper-border">
              <div>
                <h3 class="text-base font-bold text-ink-900 dark:text-ink-50">همهٔ بخش‌ها</h3>
                <p class="text-[11px] text-ink-500 mt-0.5">دسترسی سریع به تمام امکانات برنامه</p>
              </div>
              <button
                type="button"
                class="p-2 rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-paper-dark transition-colors"
                title="بستن"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              <section v-for="group in menuGroups" :key="group.title">
                <h4 class="px-1 mb-2 text-[11px] font-bold text-ink-400">{{ group.title }}</h4>
                <div class="grid grid-cols-2 gap-2.5">
                  <router-link
                    v-for="item in group.items"
                    :key="item.path"
                    :to="item.path"
                    class="relative flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98]"
                    :class="[
                      isActive(item.path)
                        ? 'border-brand-500/50 bg-brand-500/10 text-brand-700 dark:text-brand-300 font-bold'
                        : 'border-ink-200/70 bg-paper-warm/50 text-ink-700 hover:border-brand-500/40 dark:border-paper-border dark:bg-paper-dark/60 dark:text-ink-200'
                    ]"
                    @click="close"
                  >
                    <span class="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <component :is="item.icon" class="w-[18px] h-[18px]" />
                    </span>
                    <span class="text-xs font-bold leading-snug">{{ item.label }}</span>
                    <span
                      v-if="item.badge"
                      class="absolute top-2 end-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-brand-500 text-white"
                    >
                      {{ item.badge }}
                    </span>
                  </router-link>
                </div>
              </section>
            </div>

            <div class="px-4 pb-safe pt-3 border-t border-ink-200/60 dark:border-paper-border">
              <button
                type="button"
                class="w-full py-3 mb-2 rounded-xl bg-ink-100 dark:bg-paper-dark text-sm font-bold text-ink-700 dark:text-ink-200 transition-colors hover:bg-ink-200 dark:hover:bg-paper-border"
                @click="close"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMemorizeStore } from '../../stores/memorizeStore';
import { toPersianDigits } from '../../utils/persianNormalizer';
import {
  Home,
  BookOpen,
  Brain,
  Sparkles,
  Compass,
  Search,
  BookmarkCheck,
  Music,
  Globe2,
  Scale,
  Bookmark,
  Settings,
  Menu,
  X
} from 'lucide-vue-next';

var route = useRoute();
var memorizeStore = useMemorizeStore();

var isMoreOpen = ref<boolean>(false);

var dueCount = computed(function () {
  return memorizeStore.dueCards.length > 0
    ? toPersianDigits(memorizeStore.dueCards.length)
    : undefined;
});

var primaryItems = [
  { label: 'خانه', path: '/', icon: Home },
  { label: 'شاعران', path: '/poets', icon: BookOpen },
  { label: 'حفظ شعر', path: '/memorize', icon: Brain, badge: dueCount.value },
  { label: 'آموزش', path: '/education', icon: Sparkles }
];

var menuGroups = computed(function () {
  return [
    {
      title: 'خواندن و جست‌وجو',
      items: [
        { label: 'خانه', path: '/', icon: Home },
        { label: 'شاعران و دیوان‌ها', path: '/poets', icon: BookOpen },
        { label: 'جست‌وجوی شعر', path: '/search', icon: Search },
        { label: 'مجموعه‌های شخصی', path: '/collections', icon: BookmarkCheck },
        { label: 'فال حافظ', path: '/faal', icon: Sparkles }
      ]
    },
    {
      title: 'آموزش و تمرین',
      items: [
        { label: 'حفظ شعر و آزمون', path: '/memorize', icon: Brain, badge: dueCount.value },
        { label: 'آموزش و آرایه‌ها', path: '/education', icon: Bookmark },
        { label: 'موسیقی و وزن شعر', path: '/metres', icon: Music },
        { label: 'مقایسه دو شاعر', path: '/compare', icon: Scale }
      ]
    },
    {
      title: 'کاوش و ابزارها',
      items: [
        { label: 'کاوش و تبارشناسی', path: '/explore', icon: Compass },
        { label: 'شعر در گویش‌ها', path: '/dialects', icon: Globe2 },
        { label: 'تنظیمات و داده‌ها', path: '/settings', icon: Settings }
      ]
    }
  ];
});

var secondaryPaths = computed(function () {
  return menuGroups.value
    .flatMap(function (group) { return group.items; })
    .map(function (item) { return item.path; });
});

var hasSecondaryActive = computed(function () {
  return secondaryPaths.value.some(function (path) { return isActive(path); });
});

var isMenuActive = computed(function () {
  return isMoreOpen.value || hasSecondaryActive.value;
});

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/';
  return route.path === path || route.path.startsWith(`${path}/`);
}

function close() {
  isMoreOpen.value = false;
}

watch(
  () => route.fullPath,
  close
);
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-fade-enter-active > div,
.sheet-fade-leave-active > div {
  transition: transform 0.24s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from > div,
.sheet-fade-leave-to > div {
  transform: translateY(100%);
}
</style>
