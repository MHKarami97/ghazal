<template>
  <div class="space-y-8 pb-16">
    <!-- سربرگ گویش‌ها -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50 flex items-center gap-2">
          <Globe2 class="w-6 h-6 text-brand-600" />
          شعر در گویش‌ها و زبان‌ها
        </h2>
        <p class="text-xs text-ink-500 mt-1">
          کاوش در آثار، منظومه‌ها و دوبیتی‌های سروده‌شده به زبان‌ها و گویش‌های گوناگون این بوم و بر
        </p>
      </div>

      <!-- برچسب راست‌به‌چپ و فونت وزیرمتن -->
      <div class="flex items-center gap-2 text-xs text-ink-500 bg-paper-warm dark:bg-paper-dark px-3 py-1.5 rounded-xl border border-ink-200/60 dark:border-paper-border self-start">
        <Languages class="w-4 h-4 text-brand-600" />
        <span>پشتیبانی کامل RTL و نویسه‌های خاص محلی (Vazirmatn)</span>
      </div>
    </div>

    <!-- فیلتر سریع زبان‌ها -->
    <div class="flex flex-wrap items-center gap-2 pb-2">
      <button
        @click="selectedLangKey = 'all'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
        :class="selectedLangKey === 'all'
          ? 'bg-brand-600 text-white shadow-soft'
          : 'bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-ink-700 dark:text-ink-300'"
      >
        همهٔ گویش‌ها ({{ toPersianDigits(dialectsList.length) }})
      </button>

      <button
        v-for="d in dialectsList"
        :key="d.key"
        @click="selectedLangKey = d.key"
        class="px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
        :class="selectedLangKey === d.key
          ? 'bg-brand-600 text-white shadow-soft'
          : 'bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-ink-700 dark:text-ink-300'"
      >
        {{ d.title }}
      </button>
    </div>

    <!-- شبکه کارت‌های گویش‌ها -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="dialect in filteredDialects"
        :key="dialect.key"
        class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border hover:border-brand-500/50 hover:shadow-soft transition-all flex flex-col justify-between group"
      >
        <div class="space-y-4">
          <!-- هدر گویش -->
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-ink-900 dark:text-ink-50 group-hover:text-brand-600 transition-colors">
                  {{ dialect.title }}
                </h3>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono">
                  {{ dialect.tag }}
                </span>
              </div>
              <p class="text-xs text-ink-400 mt-1 font-sans">
                {{ dialect.region }}
              </p>
            </div>
            <span class="text-2xl p-2.5 rounded-2xl bg-paper-warm dark:bg-paper-dark border border-ink-200/40 dark:border-paper-border">
              {{ dialect.icon }}
            </span>
          </div>

          <!-- توضیح فرهنگی و تاریخی -->
          <p class="text-xs text-ink-600 dark:text-ink-400 leading-relaxed">
            {{ dialect.description }}
          </p>

          <!-- نمونه شعر در این گویش -->
          <div class="p-4 rounded-2xl bg-paper-warm/50 dark:bg-paper-dark/50 border border-ink-200/40 dark:border-paper-border space-y-2">
            <div class="text-[11px] font-bold text-brand-700 dark:text-brand-300 flex items-center justify-between">
              <span>نمونه شعر:</span>
              <span class="font-normal text-ink-400">{{ dialect.samplePoet }}</span>
            </div>
            <div class="text-xs text-ink-800 dark:text-ink-100 font-medium leading-loose text-center font-vazir dir-rtl">
              « {{ dialect.sampleText }} »
            </div>
            <div v-if="dialect.sampleTranslation" class="text-[11px] text-ink-500 border-t border-ink-200/40 dark:border-paper-border pt-2 leading-relaxed text-center">
              معنی: {{ dialect.sampleTranslation }}
            </div>
          </div>

          <!-- شاعران یا آثار مشهور -->
          <div class="flex flex-wrap gap-1.5 items-center">
            <span class="text-[11px] text-ink-400 ml-1">آثار و شاعران شاخص:</span>
            <span
              v-for="poet in dialect.notablePoets"
              :key="poet"
              class="text-[11px] px-2.5 py-0.5 rounded-lg bg-ink-100 dark:bg-paper-dark text-ink-700 dark:text-ink-300"
            >
              {{ poet }}
            </span>
          </div>
        </div>

        <!-- دکمه‌های جست‌وجو یا کاوش -->
        <div class="mt-6 pt-4 border-t border-ink-200/60 dark:border-paper-border flex items-center justify-between">
          <router-link
            :to="`/search?q=${encodeURIComponent(dialect.searchKeyword)}`"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
          >
            <span>جست‌وجوی اشعار و آثار</span>
            <ArrowLeft class="w-3.5 h-3.5" />
          </router-link>

          <span class="text-[11px] text-ink-400">
            {{ dialect.scriptType }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { toPersianDigits } from '../utils/persianNormalizer';
import { Globe2, Languages, ArrowLeft } from 'lucide-vue-next';

var selectedLangKey = ref<string>('all');

interface DialectItem {
  key: string;
  title: string;
  tag: string;
  region: string;
  icon: string;
  description: string;
  samplePoet: string;
  sampleText: string;
  sampleTranslation?: string;
  notablePoets: string[];
  searchKeyword: string;
  scriptType: string;
}

var dialectsList = ref<DialectItem[]>([
  {
    key: 'tabari',
    title: 'مازندرانی (طبری)',
    tag: 'کاسپین و البرز',
    region: 'مازندران، گلستان، نواحی سوادکوه و طبرستان کهن',
    icon: '🌿',
    description: 'یکی از کهن‌ترین زبان‌های ایرانی بازمانده از زبان پهلوی اشکانی با غنای فوق‌العاده در ترانه‌ها، کنوس‌کنی‌ها و دیوان روجای نیما یوشیج و امیر پازواری.',
    samplePoet: 'نیما یوشیج (دیوان روجا)',
    sampleText: 'می دل تو دنی کاجه بورده؟ / بهار بورده، مـه دل تازه بمرده',
    sampleTranslation: 'دل من، تو می‌دانی به کجا رفته است؟ بهار رفت و دل من دوباره پژمرد.',
    notablePoets: ['نیما یوشیج (مجموعه روجا)', 'امیر پازواری', 'نصاب طبری'],
    searchKeyword: 'روجا',
    scriptType: 'خط فارسی-عربی (RTL)'
  },
  {
    key: 'azeri',
    title: 'ترکی آذربایجانی',
    tag: 'شمال‌غرب ایران',
    region: 'تبریز، ارومیه، اردبیل، زنجان و قفقاز',
    icon: '🏔️',
    description: 'زبان پرشور منظومه‌های جاودانی چون حیدربابایه سلام شهریار و غزلیات عارفانه عمادالدین نسیمی، فضولی و شاه اسماعیل خطایی.',
    samplePoet: 'استاد شهریار (حیدر بابا)',
    sampleText: 'حیدربابا ، ایلدیریملار شاشاندا / سئللر ، سولاّار ، شاقّیلدییوب آشاندا',
    sampleTranslation: 'حیدربابا، آنگاه که آذرخش‌ها برق می‌زنند و سیلاب‌ها غران جاری می‌شوند...',
    notablePoets: ['محمدحسین شهریار', 'فضولی', 'عمادالدین نسیمی', 'شاه اسماعیل خطایی'],
    searchKeyword: 'حیدربابا',
    scriptType: 'خط فارسی-عربی (RTL)'
  },
  {
    key: 'kurdish',
    title: 'کردی (کرمانجی، سورانی و هورامی)',
    tag: 'زاگرس',
    region: 'کردستان، کرمانشاه، آذربایجان غربی، ایلام و شمال خراسان',
    icon: '🦅',
    description: 'شعر کردی سرشار از موسیقی طبیعی کوهستان، منظومه‌های حماسی و عاشقانه‌ای چون مم و زین احمد خانی و اشعار ملای جزیری و مستوره اردلان.',
    samplePoet: 'مستوره کردستانی',
    sampleText: 'گه‌ر له‌ ده‌س هیجرانی تـۆ مه‌حزوون و غه‌مبارم، مه‌که‌س / چونکه‌ زانم وه‌سلی تـۆ ده‌رمانی ده‌ردی کـۆنه‌مه‌',
    sampleTranslation: 'اگر از رنج جدایی تو اندوهگینم خورده مگیر، چرا که وصال تو درمان دردهای دیرین من است.',
    notablePoets: ['مستوره اردلان', 'ملای جزیری', 'احمد خانی', 'نالی'],
    searchKeyword: 'کردی',
    scriptType: 'خط کردی (RTL)'
  },
  {
    key: 'fahlavi',
    title: 'فهلویات و رازی (پهلوی کهن)',
    tag: 'ایران میانه',
    region: 'همدان، لرستان، ری، اصفهان و پارس',
    icon: '📜',
    description: 'ترانه‌ها و دوبیتی‌های سروده‌شده به گویش‌های پهلوی غرب و مرکز ایران (فهلویات) که با سوز درون و موسیقی سه‌تار پیوندی ناگسستنی دارند.',
    samplePoet: 'باباطاهر عریان',
    sampleText: 'ز دست دیده و دل هر دو فریاد / که هر چه دیده بیند دل کند یاد',
    sampleTranslation: 'دوبیتی‌های لری و رازی کهن',
    notablePoets: ['باباطاهر عریان', 'بندار رازی', 'عین‌القضات همدانی'],
    searchKeyword: 'باباطاهر',
    scriptType: 'خط فارسی (RTL)'
  },
  {
    key: 'arabic',
    title: 'عربی (شعر عربی شاعران پارسی‌گوی)',
    tag: 'ادب مشترک',
    region: 'حوزه‌های ادبی خراسان، فارس، عراق عجم و خوزستان',
    icon: '✨',
    description: 'شعر و ملمعات عربی از شاعران بزرگ فارسی‌زبان از جمله سعدی شیرازی، حافظ و مولانا که تسلط بی‌مانندشان بر هر دو ادب را نشان می‌دهد.',
    samplePoet: 'سعدی شیرازی',
    sampleText: 'حبستُ بجفنی حطّةَ الدمع فاستوت / ففاضت کطوفانٍ و جلّت بلائی',
    sampleTranslation: 'اشک را در مژگانم نگه داشتم تا آرام گیرد، اما چون طوفان طغیان کرد و بلایم افزون شد.',
    notablePoets: ['سعدی (قصاید و ملمعات عربی)', 'حافظ', 'منوچهری دامغانی'],
    searchKeyword: 'ملمع',
    scriptType: 'خط عربی (RTL)'
  },
  {
    key: 'gilaki',
    title: 'گیلکی',
    tag: 'گیلان و کرانه‌های خزر',
    region: 'رشت، لاهیجان، انزلی، فومن و رودبار',
    icon: '🌊',
    description: 'سروده‌ها و ترانه‌های مردمی با واژگان زنده و سرشار از عطر برنج‌زارها، جنگل و دریا با لحنی صمیمی و دلنشین.',
    samplePoet: 'شیون فومنی',
    sampleText: 'تی تی بزه داران و سرسبز بوبو دشت / امسال دوباره فصل باهار بومه به گیلان',
    sampleTranslation: 'درختان شکوفه زدند و دشت سرسبز شد، امسال دوباره بهار به گیلان آمد.',
    notablePoets: ['شیون فومنی', 'ترانه‌های محلی گیلان'],
    searchKeyword: 'گیلکی',
    scriptType: 'خط فارسی-عربی (RTL)'
  }
]);

var filteredDialects = computed(function () {
  if (selectedLangKey.value === 'all') {
    return dialectsList.value;
  }
  return dialectsList.value.filter(function (d) {
    return d.key === selectedLangKey.value;
  });
});
</script>
