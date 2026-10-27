<template>
  <div class="max-w-3xl mx-auto space-y-8 pb-16">
    <div>
      <h2 class="text-2xl font-black text-ink-900 dark:text-ink-50">
        تنظیمات و مدیریت داده‌ها
      </h2>
      <p class="text-xs text-ink-500 mt-1">
        مدیریت حافظه، بسته‌های آفلاین، نسخه داده‌های گنجور، پشتیبان‌گیری و تم
      </p>
    </div>

    <!-- بخش ۱: نسخه داده‌ها و وضعیت سازگاری -->
    <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="flex items-center gap-2 pb-3 border-b border-ink-200/60 dark:border-paper-border">
        <Database class="w-5 h-5 text-brand-600" />
        <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
          اطلاعات نسخه و سازگاری داده‌ها
        </h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3.5 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <span class="text-ink-400 block mb-1">نسخه Commit پین‌شده برنامه:</span>
          <code class="font-mono text-brand-700 dark:text-brand-300 font-bold break-all">
            {{ dataStore.versionStatus?.appCommitSha || DATA_COMMIT_SHA }}
          </code>
        </div>

        <div class="p-3.5 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
          <span class="text-ink-400 block mb-1">نسخه Schema مورد انتظار:</span>
          <span class="font-bold text-ink-800 dark:text-ink-200">
            نسخه {{ toPersianDigits(dataStore.versionStatus?.appSchemaVersion || 4) }} (ایندکس ابیات از ۰)
          </span>
        </div>
      </div>

      <!-- هشدار نسخه یا آپدیت موجود -->
      <div
        v-if="dataStore.versionStatus?.errorMessage"
        class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs leading-relaxed"
      >
        {{ dataStore.versionStatus.errorMessage }}
      </div>

      <div
        v-else-if="dataStore.versionStatus?.hasUpdates"
        class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between"
      >
        <span>برای {{ toPersianDigits(dataStore.versionStatus.outdatedPackagesCount) }} بستهٔ نصب‌شده، نسخهٔ جدیدتری موجود است.</span>
      </div>

      <!-- وضعیت ماندگاری حافظه مرورگر -->
      <div class="flex items-center justify-between pt-2 text-xs">
        <div>
          <span class="font-bold text-ink-800 dark:text-ink-200 block">مجوز ذخیره‌سازی پایدار (Persistent Storage):</span>
          <span class="text-[11px] text-ink-500">جلوگیری از پاک‌شدن خودکار داده‌های آفلاین توسط مرورگر در کمبود حافظه</span>
        </div>
        <button
          @click="requestPersistence"
          class="px-3.5 py-1.5 rounded-xl border border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors"
        >
          {{ isPersisted ? 'فعال است ✓' : 'درخواست مجوز' }}
        </button>
      </div>
    </div>

    <!-- بخش ۲: مدیریت بسته‌های آفلاین نصب‌شده -->
    <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-ink-200/60 dark:border-paper-border">
        <div class="flex items-center gap-2">
          <HardDrive class="w-5 h-5 text-brand-600" />
          <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
            بسته‌های داده محلی ({{ toPersianDigits(dataStore.installedPackages.length) }})
          </h3>
        </div>

        <!-- دانلود بسته پایه -->
        <button
          v-if="!dataStore.isBasePackageInstalled()"
          @click="downloadBasePackage"
          class="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
        >
          <Download class="w-3.5 h-3.5" />
          دانلود بسته پایه (آرایه‌ها و اشخاص)
        </button>
      </div>

      <div v-if="dataStore.installedPackages.length > 0" class="space-y-3">
        <div
          v-for="pkg in dataStore.installedPackages"
          :key="pkg.id"
          class="p-4 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border flex items-center justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-ink-900 dark:text-ink-100">{{ pkg.title }}</span>
              <span
                v-if="pkg.status === 'update_available'"
                class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
              >
                به‌روزرسانی موجود است
              </span>
            </div>
            <div class="text-[11px] text-ink-400 mt-1 flex gap-3">
              <span>حجم: {{ formatBytes(pkg.sizeBytes) }}</span>
              <span v-if="pkg.totalPoems">تعداد اشعار: {{ toPersianDigits(pkg.totalPoems) }}</span>
              <span>SHA: {{ pkg.commitSha?.slice(0, 7) }}</span>
            </div>
          </div>

          <button
            @click="removePackage(pkg.id)"
            class="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            title="حذف بسته و آزادسازی حافظه"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-else class="text-center py-6 text-xs text-ink-400 italic">
        هنوز هیچ بسته‌ای برای استفادهٔ آفلاین دانلود نشده است.
      </div>
    </div>

    <!-- بخش ۳: پشتیبان‌گیری و بازیابی داده‌های کاربر (JSON) -->
    <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="flex items-center gap-2 pb-3 border-b border-ink-200/60 dark:border-paper-border">
        <ShieldCheck class="w-5 h-5 text-brand-600" />
        <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
          پشتیبان‌گیری و بازیابی داده‌های کاربر
        </h3>
      </div>

      <p class="text-xs text-ink-500 leading-relaxed">
        همهٔ نشانک‌ها، یادداشت‌های شخصی و پیشرفت کارت‌های حفظ شعر شما تنها در همین دستگاه نگهداری می‌شوند. می‌توانید یک نسخهٔ پشتیبان JSON دریافت کرده و در دستگاهی دیگر بازیابی کنید:
      </p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <!-- دکمه خروجی بکاپ -->
        <button
          @click="exportBackup"
          class="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors"
        >
          <Download class="w-4 h-4" />
          دریافت فایل پشتیبان (Export JSON)
        </button>

        <!-- دکمه بارگذاری بکاپ -->
        <label
          class="py-2.5 px-5 rounded-xl border border-ink-200 dark:border-paper-border hover:bg-ink-100 dark:hover:bg-paper-dark text-ink-800 dark:text-ink-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Upload class="w-4 h-4" />
          بازیابی فایل پشتیبان (Import JSON)
          <input type="file" accept=".json" @change="handleFileImport" class="hidden" />
        </label>
      </div>

      <!-- گزارش نتیجه بازیابی -->
      <div
        v-if="importResult"
        class="p-4 rounded-2xl text-xs leading-relaxed border"
        :class="importResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'"
      >
        <div class="font-bold mb-1">
          {{ importResult.success ? 'بازیابی با موفقیت انجام شد:' : 'خطا در بازیابی:' }}
        </div>
        <div v-if="importResult.success">
          تعداد {{ toPersianDigits(importResult.importedBookmarks) }} نشانک و {{ toPersianDigits(importResult.importedCards) }} کارت حفظ بازیابی شد.
          <div v-if="importResult.missingPoemsCount > 0" class="mt-1 text-amber-600 dark:text-amber-400">
            توجه: تعداد {{ toPersianDigits(importResult.missingPoemsCount) }} شعر مربوط به نشانک‌ها هنوز روی این دستگاه دانلود نشده است.
          </div>
        </div>
        <div v-else>{{ importResult.errorMessage }}</div>
      </div>
    </div>

    <!-- بخش ۴: تم و اعلان‌ها -->
    <div class="p-6 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-4">
      <div class="flex items-center gap-2 pb-3 border-b border-ink-200/60 dark:border-paper-border">
        <Bell class="w-5 h-5 text-brand-600" />
        <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
          شخصی‌سازی و اعلان‌ها
        </h3>
      </div>

      <!-- تغییر تم -->
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold text-ink-800 dark:text-ink-200">پوستهٔ برنامه:</span>
        <div class="flex bg-ink-200/60 dark:bg-paper-dark p-1 rounded-xl">
          <button
            @click="appStore.applyTheme('light')"
            class="px-3 py-1.5 rounded-lg font-bold transition-all"
            :class="appStore.theme === 'light' ? 'bg-paper-light shadow-xs text-amber-600' : 'text-ink-600 dark:text-ink-400'"
          >
            روشن
          </button>
          <button
            @click="appStore.applyTheme('dark')"
            class="px-3 py-1.5 rounded-lg font-bold transition-all"
            :class="appStore.theme === 'dark' ? 'bg-paper-surface shadow-xs text-blue-400' : 'text-ink-600 dark:text-ink-400'"
          >
            تاریک
          </button>
          <button
            @click="appStore.applyTheme('system')"
            class="px-3 py-1.5 rounded-lg font-bold transition-all"
            :class="appStore.theme === 'system' ? 'bg-paper-light dark:bg-paper-surface shadow-xs text-ink-900 dark:text-ink-100' : 'text-ink-600 dark:text-ink-400'"
          >
            خودکار
          </button>
        </div>
      </div>

      <!-- اعلان روزانه -->
      <div class="flex items-center justify-between text-xs pt-3 border-t border-ink-200/60 dark:border-paper-border">
        <div>
          <span class="font-bold text-ink-800 dark:text-ink-200 block">یادآور روزانهٔ مرور ابیات:</span>
          <span class="text-[11px] text-ink-500">ارسال اعلان برای ابیاتی که سررسید مرور آنها فرا رسیده است</span>
        </div>
        <button
          @click="toggleNotification"
          class="px-4 py-1.5 rounded-xl border border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors"
        >
          {{ notificationService.hasPermission() ? 'مجوز داده شده ✓' : 'فعال‌سازی اعلان' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { db } from '../db/GhazalDB';
import { DATA_COMMIT_SHA } from '../config/dataConfig';
import { exportService, type ImportResult } from '../services/ExportService';
import { notificationService } from '../services/NotificationService';
import { formatBytes } from '../utils/formatters';
import { toPersianDigits } from '../utils/persianNormalizer';
import {
  Database,
  HardDrive,
  ShieldCheck,
  Bell,
  Trash2,
  Download,
  Upload
} from 'lucide-vue-next';

var appStore = useAppStore();
var dataStore = useDataStore();

var isPersisted = ref<boolean>(false);
var importResult = ref<ImportResult | null>(null);

onMounted(async function () {
  await dataStore.init();
  if (navigator.storage && navigator.storage.persisted) {
    isPersisted.value = await navigator.storage.persisted();
  }
});

async function requestPersistence() {
  isPersisted.value = await db.requestPersistence();
  if (isPersisted.value) {
    alert('ذخیره‌سازی پایدار با موفقیت فعال شد.');
  }
}

async function removePackage(pkgId: string) {
  if (confirm('آیا از حذف این بسته و آزادسازی حافظه مطمئن هستید؟')) {
    await dataStore.removePackage(pkgId);
  }
}

async function downloadBasePackage() {
  await dataStore.downloadBasePackage();
}

async function exportBackup() {
  var json = await exportService.exportUserData();
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = `ghazal-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleFileImport(e: Event) {
  var target = e.target as HTMLInputElement;
  var file = target.files?.[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = async function (evt) {
    var content = evt.target?.result as string;
    importResult.value = await exportService.importUserData(content);
  };
  reader.readAsText(file);
}

async function toggleNotification() {
  var granted = await notificationService.requestPermission();
  if (granted) {
    alert('مجوز اعلان مرور با موفقیت داده شد.');
  }
}
</script>
