<template>
  <div class="space-y-8 pb-16">
    <!-- سربرگ مجموعه‌ها -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50 flex items-center gap-2">
          <BookmarkCheck class="w-6 h-6 text-brand-600" />
          مجموعه‌های شخصی
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          دفترهای شخصی، اشعار سفر، گلچین ابیات و مناسبت‌ها با قابلیت چاپ و دریافت PDF
        </p>
      </div>

      <!-- دکمه‌های ساخت مجموعه و چاپ -->
      <div class="flex items-center gap-2">
        <button
          v-if="selectedCollection && selectedCollection.items.length > 0"
          @click="printCollection"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-ink-200 dark:border-paper-border hover:bg-paper-warm dark:hover:bg-paper-dark text-ink-800 dark:text-ink-200 text-xs font-bold transition-colors"
        >
          <Printer class="w-4 h-4 text-brand-600" />
          <span>چاپ / خروجی PDF</span>
        </button>

        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-soft transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>مجموعه جدید</span>
        </button>
      </div>
    </div>

    <!-- بارگذاری -->
    <LoadingState v-if="isLoading" message="در حال بازخوانی دفترهای شعر..." />

    <template v-else>
      <!-- نوار برگه انتخاب مجموعه -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          v-for="col in collections"
          :key="col.id"
          @click="activeCollectionId = col.id"
          class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border"
          :class="activeCollectionId === col.id
            ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
            : 'bg-paper-light dark:bg-paper-surface border-ink-200/80 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:border-brand-500/50'"
        >
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: col.color || '#b87c2c' }"></span>
          <span>{{ col.title }}</span>
          <span
            class="text-[10px] px-1.5 py-0.5 rounded-full"
            :class="activeCollectionId === col.id ? 'bg-white/20 text-white' : 'bg-ink-100 dark:bg-paper-dark text-ink-500'"
          >
            {{ toPersianDigits(col.items.length) }}
          </span>
        </button>
      </div>

      <!-- نمایش جزئیات مجموعه فعال -->
      <div v-if="selectedCollection" class="space-y-6">
        <!-- توضیح مجموعه و دکمه حذف -->
        <div class="p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-ink-900 dark:text-ink-50">
              {{ selectedCollection.title }}
            </h3>
            <p v-if="selectedCollection.description" class="text-xs text-ink-500 mt-1">
              {{ selectedCollection.description }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-ink-400">
              تعداد اشعار: {{ toPersianDigits(selectedCollection.items.length) }}
            </span>
            <button
              v-if="collections.length > 1"
              @click="onDeleteCollection(selectedCollection.id!)"
              class="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="حذف این مجموعه"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- ابیات داخل مجموعه -->
        <div v-if="selectedCollection.items.length > 0" class="grid grid-cols-1 gap-4 print:block">
          <div
            v-for="(item, idx) in selectedCollection.items"
            :key="item.poemId + '-' + (item.coupletIndex || 0)"
            class="p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:shadow-soft transition-all flex flex-col justify-between group print:border-b print:rounded-none print:shadow-none print:mb-4"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between text-xs text-ink-500">
                <span class="font-bold text-brand-700 dark:text-brand-300">
                  {{ item.poetName }} » {{ item.poemTitle }}
                </span>
                <span v-if="item.coupletIndex !== undefined">
                  بیت {{ toPersianDigits(item.coupletIndex + 1) }}
                </span>
              </div>

              <!-- متن بیت -->
              <div class="text-sm sm:text-base font-medium text-ink-900 dark:text-ink-100 leading-loose text-center py-2">
                <div>« {{ item.verseFirst || item.firstMisra }} »</div>
                <div>« {{ item.verseSecond || item.secondMisra }} »</div>
              </div>
            </div>

            <!-- فوتر بیت: رفتن به شعر و حذف از مجموعه -->
            <div class="mt-4 pt-3 border-t border-ink-200/50 dark:border-paper-border flex items-center justify-between text-xs print:hidden">
              <router-link
                :to="`/poem/${item.poemId}${item.coupletIndex !== undefined ? '?couplet=' + item.coupletIndex : ''}`"
                class="font-bold text-brand-600 hover:text-brand-700 transition-colors"
              >
                مشاهده در شعر کامل
              </router-link>

              <button
                @click="onRemoveItem(selectedCollection.id!, item.poemId, item.coupletIndex)"
                class="text-rose-500 hover:text-rose-700 text-xs transition-colors"
              >
                حذف از این دفتر
              </button>
            </div>
          </div>
        </div>

        <!-- حالت خالی اگر بیتی در مجموعه نیست -->
        <div
          v-else
          class="p-12 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-center space-y-3"
        >
          <FolderPlus class="w-12 h-12 text-ink-300 mx-auto" />
          <h4 class="text-base font-bold text-ink-800 dark:text-ink-200">
            این دفتر هنوز شعری ندارد
          </h4>
          <p class="text-xs text-ink-500 max-w-sm mx-auto">
            در حین خواندن هر شعر، با کلیک بر روی بیت و انتخاب گزینه «افزودن به مجموعه‌ها» بیت‌های مورد علاقه خود را در این دفتر ذخیره کنید.
          </p>
        </div>
      </div>
    </template>

    <!-- مدال ایجاد مجموعه تازه -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div class="bg-paper-light dark:bg-paper-surface w-full max-w-md rounded-3xl border border-ink-200 dark:border-paper-border p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-ink-200/60 dark:border-paper-border">
          <h3 class="text-base font-bold text-ink-900 dark:text-ink-50">
            ساخت دفتر و مجموعه جدید
          </h3>
          <button @click="showCreateModal = false" class="text-ink-400 hover:text-ink-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-1">
              عنوان مجموعه (مثلاً: شعرهای بهاری، برای سفر):
            </label>
            <input
              v-model="newTitle"
              type="text"
              placeholder="عنوان مجموعه..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-xs font-vazir outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-1">
              توضیح کوتاه (اختیاری):
            </label>
            <textarea
              v-model="newDesc"
              rows="2"
              placeholder="توضیحاتی درباره این مجموعه..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/50 dark:bg-paper-dark text-ink-900 dark:text-ink-100 text-xs font-vazir outline-hidden focus:ring-2 focus:ring-brand-500"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            @click="submitCreateCollection"
            :disabled="!newTitle.trim()"
            class="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-xs transition-colors"
          >
            ایجاد مجموعه
          </button>
          <button
            @click="showCreateModal = false"
            class="py-2.5 px-4 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-paper-warm dark:hover:bg-paper-dark text-ink-700 dark:text-ink-300 font-medium text-xs transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { collectionService } from '../services/CollectionService';
import type { UserCollection } from '../types/user';
import { toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import {
  BookmarkCheck,
  Plus,
  Printer,
  Trash2,
  FolderPlus,
  X
} from 'lucide-vue-next';

var isLoading = ref<boolean>(true);
var collections = ref<UserCollection[]>([]);
var activeCollectionId = ref<number | undefined>(undefined);

var showCreateModal = ref<boolean>(false);
var newTitle = ref<string>('');
var newDesc = ref<string>('');

var selectedCollection = computed(function () {
  return collections.value.find(function (c) {
    return c.id === activeCollectionId.value;
  });
});

onMounted(async function () {
  await loadCollections();
});

async function loadCollections() {
  isLoading.value = true;
  try {
    collections.value = await collectionService.getCollections();
    if (collections.value.length > 0 && !activeCollectionId.value) {
      activeCollectionId.value = collections.value[0].id;
    }
  } finally {
    isLoading.value = false;
  }
}

async function submitCreateCollection() {
  if (!newTitle.value.trim()) return;
  var id = await collectionService.createCollection(newTitle.value, newDesc.value);
  showCreateModal.value = false;
  newTitle.value = '';
  newDesc.value = '';
  await loadCollections();
  activeCollectionId.value = id;
}

async function onDeleteCollection(colId: number) {
  if (confirm('آیا از حذف این مجموعه اطمینان دارید؟')) {
    await collectionService.deleteCollection(colId);
    activeCollectionId.value = undefined;
    await loadCollections();
  }
}

async function onRemoveItem(colId: number, poemId: number, coupletIndex?: number) {
  await collectionService.removeItemFromCollection(colId, poemId, coupletIndex);
  await loadCollections();
}

function printCollection() {
  if (selectedCollection.value) {
    collectionService.exportCollectionToPdf(selectedCollection.value);
  }
}
</script>
