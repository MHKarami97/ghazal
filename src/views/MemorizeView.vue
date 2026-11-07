<template>
  <div class="space-y-8 pb-12">
    <!-- بنر چالش روزانه -->
    <router-link
      to="/memorize/daily-challenge"
      class="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-brand-500/10 to-transparent border border-amber-500/30 shadow-soft flex items-center justify-between group hover:border-amber-500/50 transition-all"
    >
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
          <CalendarDays class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-base text-ink-900 dark:text-ink-50 group-hover:text-amber-600 transition-colors">
              چالش روزانه شعر پارسی
            </h3>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
              امروز فعال است
            </span>
          </div>
          <p class="text-xs text-ink-500 mt-1">
            هر روز یک بیت، یک سوال و ثبت زنجیرهٔ استمرار (Streak)
          </p>
        </div>
      </div>

      <div class="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-[-4px] transition-transform">
        <span>شرکت در چالش</span>
        <ArrowLeft class="w-4 h-4" />
      </div>
    </router-link>

    <!-- سربرگ و آمار کلی پیشرفت حفظ -->
    <div class="p-6 sm:p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
            حفظ شعر و جعبهٔ لایتنر (SM-2)
          </h2>
          <p class="text-xs text-ink-500 mt-1">
            سیستم هوشمند تکرار فاصله‌دار برای به خاطرسپاری ابیات فاخر ادبیات پارسی
          </p>
        </div>

        <!-- دکمه مرور کارت‌های امروز -->
        <router-link
          v-if="memorizeStore.dueCards.length > 0"
          :to="reviewLink"
          class="py-3 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          شروع جلسه مرور ({{ toPersianDigits(memorizeStore.dueCards.length) }} کارت)
        </router-link>
      </div>

      <!-- کارت‌های آماری -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="p-3.5 rounded-2xl bg-paper-warm/80 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-2xl font-black text-brand-600 dark:text-brand-400">
            {{ toPersianDigits(memorizeStore.totalCardsCount) }}
          </div>
          <div class="text-[11px] font-bold text-ink-500 mt-1">کل ابیات در حفظ</div>
        </div>

        <div class="p-3.5 rounded-2xl bg-paper-warm/80 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-2xl font-black text-emerald-600">
            {{ toPersianDigits(memorizeStore.masteredCardsCount) }}
          </div>
          <div class="text-[11px] font-bold text-ink-500 mt-1">تثبیت‌شده در حافظه</div>
        </div>

        <div class="p-3.5 rounded-2xl bg-paper-warm/80 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-2xl font-black text-amber-500">
            {{ toPersianDigits(memorizeStore.dueCards.length) }}
          </div>
          <div class="text-[11px] font-bold text-ink-500 mt-1">نیاز به مرور امروز</div>
        </div>

        <div class="p-3.5 rounded-2xl bg-paper-warm/80 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <div class="text-2xl font-black text-blue-500">
            {{ toPersianDigits(memorizeStore.learningCardsCount) }}
          </div>
          <div class="text-[11px] font-bold text-ink-500 mt-1">در حال یادگیری</div>
        </div>
      </div>
    </div>

    <!-- حالت‌های هفت‌گانه آزمون و تمرین -->
    <div>
      <h3 class="font-bold text-base text-ink-900 dark:text-ink-50 mb-4">
        انتخاب حالت تمرین و آزمون
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <router-link
          v-for="mode in quizModes"
          :key="mode.key"
          :to="quizLink(mode.key)"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-sm transition-all group flex items-start gap-3.5"
        >
          <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center font-bold transition-colors flex-shrink-0">
            <component :is="mode.icon" class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-sm text-ink-900 dark:text-ink-100 group-hover:text-brand-600 transition-colors">
              {{ mode.title }}
            </h4>
            <p class="text-[11px] text-ink-500 mt-1 leading-relaxed">
              {{ mode.desc }}
            </p>
          </div>
        </router-link>
      </div>
    </div>

    <!-- فهرست‌های حفظ و مدیریت اشعار و ابیات -->
    <div>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
            اشعار و ابیات در حال حفظ
          </h3>
          <p class="text-xs text-ink-500 mt-0.5">
            امکان مدیریت، تفکیک بر اساس شعر، مرور و حذف اشعار یا ابیات دلخواه
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- تغییر نمای شعرها / ابیات مجزا -->
          <div class="flex items-center p-1 rounded-xl bg-ink-200/50 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border text-xs">
            <button
              @click="viewMode = 'poems'"
              type="button"
              class="px-3 py-1.5 rounded-lg font-bold transition-all"
              :class="viewMode === 'poems' ? 'bg-paper-light dark:bg-paper-surface text-brand-600 dark:text-brand-400 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
            >
              نمای شعرها
            </button>
            <button
              @click="viewMode = 'verses'"
              type="button"
              class="px-3 py-1.5 rounded-lg font-bold transition-all"
              :class="viewMode === 'verses' ? 'bg-paper-light dark:bg-paper-surface text-brand-600 dark:text-brand-400 shadow-xs' : 'text-ink-600 dark:text-ink-400'"
            >
              نمای ابیات مجزا
            </button>
          </div>

          <button
            @click="showCreateDeck = true"
            class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            + ایجاد فهرست جدید
          </button>
        </div>
      </div>

      <!-- دیالوگ ایجاد فهرست جدید -->
      <div v-if="showCreateDeck" class="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-500/30 mb-4 flex items-center gap-3">
        <input
          v-model="newDeckTitle"
          type="text"
          placeholder="نام فهرست جدید (مثلاً: غزلیات برگزیده)..."
          class="flex-1 px-3.5 py-2 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-xs font-medium outline-hidden"
        />
        <button
          @click="onCreateDeck"
          class="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          ایجاد
        </button>
        <button
          @click="showCreateDeck = false"
          class="text-xs text-ink-500"
        >
          انصراف
        </button>
      </div>

      <!-- نوار انتخاب دسته و جستجو -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <!-- تب‌های دسته‌ها -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="deck in memorizeStore.decks"
            :key="deck.id"
            type="button"
            @click="deck.id !== undefined && memorizeStore.selectDeck(deck.id)"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
            :class="[
              memorizeStore.activeDeckId === deck.id
                ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                : 'bg-paper-light dark:bg-paper-surface border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300'
            ]"
          >
            {{ deck.title }}
          </button>

          <button
            v-if="canDeleteActiveDeck"
            type="button"
            @click="onDeleteActiveDeck"
            class="p-2 rounded-xl text-rose-600 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
            title="حذف کل این فهرست"
            aria-label="حذف کل این فهرست"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- فیلتر و جستجو -->
        <div v-if="memorizeStore.cards.length > 0" class="w-full sm:w-64">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="جستجو در اشعار و ابیات..."
              class="w-full py-2 pr-9 pl-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-xs outline-hidden focus:border-brand-500"
            />
            <Search class="w-4 h-4 text-ink-400 absolute right-3 top-2.5" />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute left-2.5 top-2.5 text-ink-400 hover:text-ink-700"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- وضعیت نمای ۱: گروه‌بندی بر اساس شعر -->
      <div v-if="viewMode === 'poems'">
        <div v-if="filteredPoemGroups.length > 0" class="space-y-4">
          <div
            v-for="group in filteredPoemGroups"
            :key="group.poemId"
            class="p-5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-xs hover:border-brand-500/40 transition-all"
          >
            <!-- سربرگ شعر: نام شاعر، عنوان شعر و اکشن‌های شعر -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-ink-200/60 dark:border-paper-border">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {{ group.poetName }}
                  </span>
                  <span class="text-ink-300 dark:text-ink-700">»</span>
                  <router-link
                    :to="`/poem/${group.poemId}`"
                    class="font-black text-base text-ink-900 dark:text-ink-50 hover:text-brand-600 transition-colors"
                  >
                    {{ group.poemTitle }}
                  </router-link>
                </div>
                <div class="text-[11px] text-ink-500 mt-1">
                  شامل {{ toPersianDigits(group.cards.length) }} بیت در جعبه حفظ
                </div>
              </div>

              <!-- اکشن‌های شعر: حذف کل شعر از حفظ، مطالعه کامل، تمرین -->
              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <router-link
                  :to="`/poem/${group.poemId}`"
                  class="px-3 py-1.5 rounded-xl border border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-paper-dark text-xs font-bold transition-colors flex items-center gap-1"
                  title="مطالعه شعر کامل در دیوان"
                >
                  <BookOpen class="w-3.5 h-3.5" />
                  <span>مشاهده شعر</span>
                </router-link>

                <button
                  type="button"
                  @click="onDeletePoem(group)"
                  class="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors flex items-center gap-1"
                  title="حذف کامل این شعر از فهرست حفظ"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>حذف شعر از حفظ</span>
                </button>
              </div>
            </div>

            <!-- پیش‌نمایش ابیات ذخیره‌شده از این شعر -->
            <div class="divide-y divide-ink-100 dark:divide-paper-border/60 mt-3">
              <div
                v-for="card in group.cards"
                :key="card.id"
                class="py-2.5 flex items-center justify-between text-xs group/couplet"
              >
                <div class="leading-relaxed text-ink-800 dark:text-ink-200 pr-2">
                  <span>{{ card.textFirst }}</span>
                  <span class="mx-2 text-ink-300">/</span>
                  <span>{{ card.textSecond }}</span>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="card.status === 'mastered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'"
                  >
                    {{ statusLabel(card.status) }}
                  </span>
                  <button
                    type="button"
                    @click="onDeleteCard(card)"
                    class="p-1 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="حذف این تک‌بیت"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EmptyState
          v-else-if="memorizeStore.cards.length > 0 && searchQuery"
          title="شعری منطبق با جستجو یافت نشد"
          description="کلمهٔ جستجو شده را بررسی کنید یا فیلتر را پاک نمایید."
          type="empty"
        />

        <EmptyState
          v-else
          title="کارت شعری در این فهرست وجود ندارد"
          description="هنگام خواندن هر شعر در دیوان، با کلیک روی نماد مغز کنار هر بیت یا دکمه «حفظ کامل شعر»، آن را به این فهرست حفظ اضافه کنید."
          type="empty"
        />
      </div>

      <!-- وضعیت نمای ۲: ابیات مجزا -->
      <div v-else>
        <div v-if="filteredCards.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border flex flex-col justify-between"
          >
            <div class="flex items-center justify-between text-xs text-ink-500 mb-2">
              <router-link
                :to="`/poem/${card.poemId}`"
                class="font-bold text-brand-700 dark:text-brand-300 hover:underline"
              >
                {{ card.poetName }} » {{ card.poemTitle }}
              </router-link>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="card.status === 'mastered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'"
                >
                  {{ statusLabel(card.status) }}
                </span>
                <button
                  type="button"
                  @click="onDeleteCard(card)"
                  class="p-1 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                  title="حذف این بیت از فهرست حفظ"
                  aria-label="حذف این بیت از فهرست حفظ"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="text-sm font-medium text-ink-900 dark:text-ink-100 leading-loose my-2">
              <div>{{ card.textFirst }}</div>
              <div>{{ card.textSecond }}</div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-ink-400 pt-2 border-t border-ink-200/60 dark:border-paper-border">
              <span>تکرار: {{ toPersianDigits(card.repCount) }} بار</span>
              <span>سررسید مرور: {{ toPersianDigits(card.dueDate) }}</span>
            </div>
          </div>
        </div>

        <EmptyState
          v-else-if="memorizeStore.cards.length > 0 && searchQuery"
          title="بیتی منطبق با جستجو یافت نشد"
          description="کلمهٔ جستجو شده را بررسی کنید یا فیلتر را پاک نمایید."
          type="empty"
        />

        <EmptyState
          v-else
          title="کارت شعری در این فهرست وجود ندارد"
          description="هنگام خواندن هر شعر، با کلیک روی نماد مغز کنار هر بیت، آن را به این فهرست حفظ اضافه کنید."
          type="empty"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMemorizeStore } from '../stores/memorizeStore';
import { toPersianDigits } from '../utils/persianNormalizer';
import EmptyState from '../components/common/EmptyState.vue';
import type { CardStatus, MemorizeCard } from '../types/user';
import {
  Brain,
  HelpCircle,
  Shuffle,
  CheckSquare,
  Keyboard,
  UserCheck,
  Sparkles,
  EyeOff,
  CalendarDays,
  ArrowLeft,
  Music,
  ArrowDownCircle,
  Trash2,
  BookOpen,
  Search,
  X
} from 'lucide-vue-next';

var memorizeStore = useMemorizeStore();
var showCreateDeck = ref<boolean>(false);
var newDeckTitle = ref<string>('');
var viewMode = ref<'poems' | 'verses'>('poems');
var searchQuery = ref<string>('');

onMounted(async function () {
  await memorizeStore.init();
});

var quizModes = [
  { key: 'cloze', title: 'تکمیل مصرع (جای خالی)', desc: 'کلمهٔ حذف‌شده از مصرع را از میان ۴ گزینه انتخاب کنید.', icon: HelpCircle },
  { key: 'reorder', title: 'ترتیب‌دهی کلمات بیت', desc: 'کلمات به‌هم‌ریخته را لمس کنید تا بیت کامل مرتب شود.', icon: Shuffle },
  { key: 'multiple_choice', title: 'انتخاب مصرع دوم', desc: 'با دیدن مصرع اول، مصرع دوم صحیح را انتخاب کنید.', icon: CheckSquare },
  { key: 'typing', title: 'تایپ بیت از حفظ', desc: 'مصرع دوم را تایپ کنید (با تحمل خطاهای تایپی و املایی).', icon: Keyboard },
  { key: 'guess_poet', title: 'حدس شاعر بیت', desc: 'با مشاهده بیت، سرایندهٔ آن را از میان گزینه‌ها برگزینید.', icon: UserCheck },
  { key: 'guess_metre', title: 'این شعر در چه وزنی است؟', desc: 'وزن و ریتم صحیح بیت را از میان گزینه‌های اوزان عروضی نام‌دار حدس بزنید.', icon: Music },
  { key: 'next_couplet', title: 'بیت بعدی کدام است؟', desc: 'با دیدن یک بیت از شعر، بیت پسین آن را به درستی پیدا کنید.', icon: ArrowDownCircle },
  { key: 'rhyme_match', title: 'بازی بیت‌های هم‌قافیه', desc: 'بیت‌هایی که دارای قافیه و آهنگ یکسان هستند را بیابید.', icon: Sparkles },
  { key: 'guess_device', title: 'تشخیص آرایه ادبی', desc: 'آرایه بلاغی برجسته‌شده در بیت را شناسایی کنید.', icon: Sparkles },
  { key: 'word_hiding', title: 'محوشدن تدریجی کلمات', desc: 'کلمات بیت به تدریج محو می‌شوند تا حافظه به چالش کشیده شود.', icon: EyeOff }
];

var CARD_BASED_MODES = ['cloze', 'reorder', 'multiple_choice', 'typing', 'word_hiding'];

var STATUS_LABELS: Record<CardStatus, string> = {
  new: 'جدید',
  learning: 'در حال یادگیری',
  review: 'در حال مرور',
  mastered: 'حفظ کامل'
};

var reviewLink = computed(function () {
  var query: Record<string, string> = { due: '1' };
  if (memorizeStore.activeDeckId !== null) query.deck = String(memorizeStore.activeDeckId);
  return { path: '/memorize/quiz/multiple_choice', query: query };
});

var canDeleteActiveDeck = computed(function () {
  return memorizeStore.decks.length > 1 && memorizeStore.activeDeckId !== null;
});

var filteredCards = computed(function () {
  var q = searchQuery.value.trim().toLowerCase();
  if (!q) return memorizeStore.cards;
  return memorizeStore.cards.filter(function (c) {
    return (
      c.poetName.toLowerCase().includes(q) ||
      c.poemTitle.toLowerCase().includes(q) ||
      c.textFirst.toLowerCase().includes(q) ||
      c.textSecond.toLowerCase().includes(q)
    );
  });
});

var filteredPoemGroups = computed(function () {
  var q = searchQuery.value.trim().toLowerCase();
  if (!q) return memorizeStore.groupedByPoem;
  return memorizeStore.groupedByPoem.filter(function (g) {
    var matchPoem = g.poetName.toLowerCase().includes(q) || g.poemTitle.toLowerCase().includes(q);
    if (matchPoem) return true;
    return g.cards.some(function (c) {
      return c.textFirst.toLowerCase().includes(q) || c.textSecond.toLowerCase().includes(q);
    });
  });
});

function quizLink(modeKey: string) {
  var query: Record<string, string> = {};
  var isCardBased = CARD_BASED_MODES.indexOf(modeKey) !== -1;
  if (isCardBased && memorizeStore.activeDeckId !== null) {
    query.deck = String(memorizeStore.activeDeckId);
  }
  return { path: `/memorize/quiz/${modeKey}`, query: query };
}

function statusLabel(status: CardStatus): string {
  return STATUS_LABELS[status] || STATUS_LABELS.learning;
}

async function onCreateDeck() {
  var title = newDeckTitle.value.trim();
  if (!title) return;

  var deckId = await memorizeStore.createDeck(title);
  await memorizeStore.selectDeck(deckId);
  newDeckTitle.value = '';
  showCreateDeck.value = false;
}

async function onDeleteCard(card: MemorizeCard) {
  if (card.id === undefined) return;
  if (!window.confirm('آیا این بیت از فهرست حفظ حذف شود؟')) return;
  await memorizeStore.deleteCard(card.id);
}

async function onDeletePoem(group: { poemId: number; poemTitle: string; poetName: string; cards: MemorizeCard[] }) {
  var msg = `آیا مایلید تمام ${toPersianDigits(group.cards.length)} بیت شعر «${group.poemTitle}» اثر ${group.poetName} از فهرست حفظ شما حذف شود؟`;
  if (!window.confirm(msg)) return;
  await memorizeStore.deletePoemCards(group.poemId);
}

async function onDeleteActiveDeck() {
  var deckId = memorizeStore.activeDeckId;
  if (deckId === null) return;
  if (!window.confirm('این فهرست و همهٔ ابیات داخل آن حذف شود؟ این کار قابل بازگشت نیست.')) return;
  await memorizeStore.deleteDeck(deckId);
}
</script>
