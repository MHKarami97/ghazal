<template>
  <div class="space-y-6 pb-14">
    <!-- سربرگ صفحه ترانه‌ها -->
    <section class="p-5 sm:p-7 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-soft space-y-5">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div class="space-y-2 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <Disc3 class="w-3.5 h-3.5" />
            <span>گنجینهٔ موسیقی و تصنیف‌ها</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-ink-900 dark:text-ink-50">
            ترانه‌ها و آثار موسیقایی برگرفته از شعرها
          </h1>
          <p class="text-xs sm:text-sm text-ink-600 dark:text-ink-300 leading-relaxed">
            فهرست سروده‌هایی که خوانندگان و آهنگ‌سازان از آن‌ها ترانه یا تصنیف اجرا کرده‌اند. با مراجعه به هر شعر، ترانه‌های آن به‌صورت خودکار در حافظهٔ دستگاه شما نمایه می‌شوند و با اسکنر زیر می‌توانید یک‌جا همهٔ اشعار آهنگ‌دارِ شاعر یا دفتر دلخواهتان را کشف و فیلتر کنید.
          </p>
        </div>

        <!-- آمار خلاصه -->
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2.5 shrink-0">
          <div class="p-3 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark/60 border border-ink-200/60 dark:border-paper-border text-center">
            <span class="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 block">
              {{ toPersianDigits(catalogEntries.length) }}
            </span>
            <span class="text-[11px] text-ink-500">شعر آهنگ‌دار</span>
          </div>
          <div class="p-3 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark/60 border border-ink-200/60 dark:border-paper-border text-center">
            <span class="text-lg sm:text-xl font-black text-brand-700 dark:text-brand-300 block">
              {{ toPersianDigits(totalTracksCount) }}
            </span>
            <span class="text-[11px] text-ink-500">قطعه و اجرا</span>
          </div>
          <div class="p-3 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark/60 border border-ink-200/60 dark:border-paper-border text-center">
            <span class="text-lg sm:text-xl font-black text-ink-900 dark:text-ink-50 block">
              {{ toPersianDigits(poetOptions.length) }}
            </span>
            <span class="text-[11px] text-ink-500">شاعر دارای ترانه</span>
          </div>
          <div class="p-3 rounded-2xl bg-paper-warm/70 dark:bg-paper-dark/60 border border-ink-200/60 dark:border-paper-border text-center">
            <span class="text-lg sm:text-xl font-black text-ink-900 dark:text-ink-50 block">
              {{ toPersianDigits(artistOptions.length) }}
            </span>
            <span class="text-[11px] text-ink-500">خواننده و هنرمند</span>
          </div>
        </div>
      </div>

      <!-- اسکنر کشف ترانه‌های شاعران -->
      <div class="p-4 sm:p-5 rounded-2xl bg-paper-warm/60 dark:bg-paper-dark/60 border border-ink-200/70 dark:border-paper-border space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Radar class="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <h2 class="font-bold text-xs sm:text-sm text-ink-900 dark:text-ink-50">
              کشف خودکار اشعار آهنگ‌دارِ یک شاعر یا دیوان
            </h2>
          </div>
          <span class="text-[11px] text-ink-500">
            {{ toPersianDigits(inspectedPoemsCount) }} شعر تاکنون بررسی و کش شده است
          </span>
        </div>

        <p class="text-[11px] text-ink-500 leading-relaxed">
          پایگاه گنجور فهرست ترانه‌ها را در API عمومی برای هر شعر به‌طور جداگانه ارائه می‌دهد؛ بنابراین برای یافتن تمام شعرهای آهنگ‌دارِ یک شاعر (یا یکی از دفترهای او مانند «غزلیات»)، شاعر را انتخاب و دکمهٔ اسکن را بزنید تا نتایج برای همیشه در دستگاه شما ذخیره شوند.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-ink-600 dark:text-ink-400 mb-1">
              شاعر برای اسکن
            </label>
            <select
              v-model="scannerPoetSlug"
              :disabled="isScanning"
              class="w-full py-2 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-xs font-medium text-ink-900 dark:text-ink-100 outline-hidden focus:border-brand-500"
            >
              <option
                v-for="poet in allPoetsSorted"
                :key="poet.slug"
                :value="poet.slug"
              >
                {{ poet.nickname }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-ink-600 dark:text-ink-400 mb-1">
              محدوده یا دفتر شعر
            </label>
            <select
              v-model="scannerCatPath"
              :disabled="isScanning || isLoadingOverview"
              class="w-full py-2 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface text-xs font-medium text-ink-900 dark:text-ink-100 outline-hidden focus:border-brand-500"
            >
              <option value="">
                کل آثار شاعر ({{ isLoadingOverview ? 'در حال بارگذاری...' : 'همه دفترها' }})
              </option>
              <option
                v-for="cat in scannerChildCats"
                :key="cat.Id"
                :value="categoryUrlToCatPath(cat.FullUrl, scannerPoetSlug)"
              >
                {{ cat.Title }}
              </option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              v-if="!isScanning"
              type="button"
              @click="startRemotePoetScan"
              :disabled="!scannerPoetSlug"
              class="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>اسکن ترانه‌های شاعر از گنجور</span>
            </button>
            <button
              v-else
              type="button"
              @click="cancelActiveScan"
              class="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Square class="w-3.5 h-3.5" />
              <span>توقف اسکن</span>
            </button>
          </div>

          <div class="flex items-end">
            <button
              type="button"
              @click="startLocalDownloadedScan"
              :disabled="isScanning"
              class="w-full py-2 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-light dark:bg-paper-surface hover:border-brand-500/60 disabled:opacity-50 text-ink-800 dark:text-ink-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <HardDrive class="w-3.5 h-3.5 text-brand-600" />
              <span>اسکن دیوان‌های دانلودشده</span>
            </button>
          </div>
        </div>

        <!-- نوار پیشرفت اسکن -->
        <div
          v-if="scanProgress && (isScanning || scanStatusMessage)"
          class="p-3 rounded-xl bg-paper-light dark:bg-paper-surface border border-ink-200/70 dark:border-paper-border space-y-2 text-xs"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-bold text-ink-800 dark:text-ink-200 flex items-center gap-1.5">
              <Loader2 v-if="isScanning" class="w-3.5 h-3.5 animate-spin text-rose-600" />
              <span>
                <template v-if="scanProgress.phase === 'collecting'">
                  در حال جمع‌آوری فهرست اشعار... ({{ toPersianDigits(scanProgress.collectedPoems) }} شعر)
                </template>
                <template v-else-if="scanProgress.phase === 'scanning'">
                  بررسی {{ toPersianDigits(scanProgress.processedCount) }} از {{ toPersianDigits(scanProgress.totalCount) }} شعر
                  — {{ toPersianDigits(scanProgress.foundPoemsCount) }} شعر آهنگ‌دار ({{ toPersianDigits(scanProgress.foundTracksCount) }} اثر)
                </template>
                <template v-else-if="scanProgress.phase === 'cancelled'">
                  اسکن متوقف شد: {{ toPersianDigits(scanProgress.processedCount) }} شعر بررسی و {{ toPersianDigits(scanProgress.foundPoemsCount) }} شعر آهنگ‌دار کشف شد.
                </template>
                <template v-else>
                  اسکن کامل شد: {{ toPersianDigits(scanProgress.foundPoemsCount) }} شعر آهنگ‌دار با {{ toPersianDigits(scanProgress.foundTracksCount) }} قطعه شناسایی شد.
                </template>
              </span>
            </span>
            <span v-if="scanProgress.currentTitle && isScanning" class="text-[11px] text-ink-500 truncate max-w-xs">
              {{ scanProgress.currentTitle }}
            </span>
          </div>

          <div
            v-if="scanProgress.totalCount > 0"
            class="w-full h-2 rounded-full bg-paper-warm dark:bg-paper-dark overflow-hidden"
          >
            <div
              class="h-full bg-rose-600 transition-all duration-200"
              :style="{ width: `${Math.min(100, Math.round((scanProgress.processedCount / scanProgress.totalCount) * 100))}%` }"
            ></div>
          </div>

          <p v-if="scanStatusMessage && !isScanning" class="text-[11px] text-ink-500">
            {{ scanStatusMessage }}
          </p>
        </div>

        <!-- تاریخچه شاعران اسکن‌شده -->
        <div v-if="poetScanRecords.length > 0" class="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
          <span class="text-ink-500 font-bold">اسکن‌های ثبت‌شده:</span>
          <button
            v-for="rec in poetScanRecords.slice(0, 8)"
            :key="`${rec.poetSlug}-${rec.catPath}`"
            type="button"
            @click="filterPoet = rec.poetSlug"
            class="px-2.5 py-1 rounded-full border transition-colors inline-flex items-center gap-1"
            :class="filterPoet === rec.poetSlug
              ? 'bg-rose-600 border-rose-600 text-white font-bold'
              : 'bg-paper-light dark:bg-paper-surface border-ink-200 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:border-brand-500'"
          >
            <span>{{ rec.poetName }}</span>
            <span v-if="rec.catTitle && rec.catTitle !== rec.poetName" class="opacity-80">({{ rec.catTitle }})</span>
            <span class="opacity-80">· {{ toPersianDigits(rec.poemsWithSongsCount) }} شعر</span>
          </button>
        </div>
      </div>
    </section>

    <!-- نوار جست‌وجو، فیلتر و تغییر حالت نمایش -->
    <section class="p-4 sm:p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- جست‌وجوی متنی -->
        <div class="relative sm:col-span-2 lg:col-span-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="جست‌وجو در نام آهنگ، خواننده، آلبوم، عنوان شعر یا شاعر..."
            class="w-full py-2.5 pr-9 pl-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/40 dark:bg-paper-dark text-xs outline-hidden focus:border-brand-500"
          />
          <Search class="w-4 h-4 text-ink-400 absolute right-3 top-2.5" />
        </div>

        <!-- فیلتر شاعر -->
        <div>
          <select
            v-model="filterPoet"
            class="w-full py-2.5 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/40 dark:bg-paper-dark text-xs outline-hidden focus:border-brand-500"
          >
            <option value="">همه شاعران</option>
            <option
              v-for="p in poetFilterSelectOptions"
              :key="p.slug"
              :value="p.slug"
            >
              {{ p.name }} ({{ toPersianDigits(p.poemCount) }} شعر)
            </option>
          </select>
        </div>

        <!-- فیلتر خواننده -->
        <div>
          <select
            v-model="filterArtist"
            class="w-full py-2.5 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/40 dark:bg-paper-dark text-xs outline-hidden focus:border-brand-500"
          >
            <option value="">همه خوانندگان</option>
            <option
              v-for="a in artistFilterSelectOptions"
              :key="a.name"
              :value="a.name"
            >
              {{ a.name }} ({{ toPersianDigits(a.count) }})
            </option>
          </select>
        </div>

        <!-- فیلتر منبع/پلتفرم -->
        <div>
          <select
            v-model="filterPlatform"
            class="w-full py-2.5 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/40 dark:bg-paper-dark text-xs outline-hidden focus:border-brand-500"
          >
            <option value="">همه منابع و پلتفرم‌ها</option>
            <option
              v-for="pl in platformOptions"
              :key="pl.name"
              :value="pl.name"
            >
              {{ pl.name }} ({{ toPersianDigits(pl.count) }})
            </option>
          </select>
        </div>
      </div>

      <!-- ردیف حالت نمایش، مرتب‌سازی و چیپ‌های سریع -->
      <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-ink-200/50 dark:border-paper-border text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex p-1 rounded-xl bg-paper-warm dark:bg-paper-dark border border-ink-200/60 dark:border-paper-border">
            <button
              type="button"
              @click="viewMode = 'by-poem'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              :class="viewMode === 'by-poem'
                ? 'bg-paper-light dark:bg-paper-surface text-brand-700 dark:text-brand-300 shadow-2xs'
                : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'"
            >
              <BookOpen class="w-3.5 h-3.5" />
              <span>بر اساس شعر ({{ toPersianDigits(filteredPoemEntries.length) }})</span>
            </button>
            <button
              type="button"
              @click="viewMode = 'by-track'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              :class="viewMode === 'by-track'
                ? 'bg-paper-light dark:bg-paper-surface text-brand-700 dark:text-brand-300 shadow-2xs'
                : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'"
            >
              <Music class="w-3.5 h-3.5" />
              <span>بر اساس قطعه ({{ toPersianDigits(filteredTracks.length) }})</span>
            </button>
          </div>

          <select
            v-model="sortBy"
            class="py-1.5 px-3 rounded-xl border border-ink-200 dark:border-paper-border bg-paper-warm/40 dark:bg-paper-dark text-xs outline-hidden focus:border-brand-500"
          >
            <option value="recent">تازه‌ترین</option>
            <option value="most-tracks">بیشترین اجرای موسیقی</option>
            <option value="poet">بر اساس نام شاعر</option>
            <option value="title">بر اساس عنوان شعر</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="hasActiveFilters"
            type="button"
            @click="clearFilters"
            class="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-500/20 transition-colors"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </div>

      <!-- چیپ‌های سریع خوانندگان پُرکار -->
      <div v-if="artistOptions.length > 0" class="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span class="text-ink-500 font-bold ml-1">خوانندگان پرکار:</span>
        <button
          v-for="a in artistOptions.slice(0, 10)"
          :key="a.name"
          type="button"
          @click="filterArtist = filterArtist === a.name ? '' : a.name"
          class="px-2.5 py-1 rounded-full border transition-colors"
          :class="filterArtist === a.name
            ? 'bg-brand-600 border-brand-600 text-white font-bold'
            : 'bg-paper-warm/50 dark:bg-paper-dark border-ink-200/70 dark:border-paper-border text-ink-700 dark:text-ink-300 hover:border-brand-500'"
        >
          {{ a.name }} ({{ toPersianDigits(a.count) }})
        </button>
      </div>
    </section>

    <!-- حالت بارگذاری -->
    <LoadingState v-if="isLoadingCatalog" message="در حال بارگذاری گنجینه ترانه‌ها..." />

    <!-- وضعیت خالی برای کل یا فیلتر فعلی -->
    <section
      v-else-if="(viewMode === 'by-poem' && filteredPoemEntries.length === 0) || (viewMode === 'by-track' && filteredTracks.length === 0)"
      class="p-8 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border text-center space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
        <Disc3 class="w-6 h-6" />
      </div>
      <div class="space-y-1.5 max-w-lg mx-auto">
        <h3 class="font-bold text-base text-ink-900 dark:text-ink-50">
          <template v-if="catalogEntries.length === 0">
            هنوز ترانه‌ای در حافظهٔ محلی نمایه نشده است
          </template>
          <template v-else-if="filterPoet">
            برای «{{ selectedFilterPoetLabel }}» هنوز شعر آهنگ‌داری با این فیلترها پیدا نشد
          </template>
          <template v-else>
            موردی مطابق فیلترهای انتخاب‌شده یافت نشد
          </template>
        </h3>
        <p class="text-xs text-ink-500 leading-relaxed">
          با انتخاب شاعر در بخش «کشف خودکار اشعار آهنگ‌دار» در بالای همین صفحه (یا اسکن دیوان‌های دانلودشدهٔ دستگاه)، می‌توانید همهٔ شعرهای آهنگ‌دار را دریافت و اینجا فیلتر کنید.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2">
        <button
          v-if="filterPoet && !isScanning"
          type="button"
          @click="scanSpecificFilterPoet"
          class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
        >
          اسکن اشعار {{ selectedFilterPoetLabel }}
        </button>
        <button
          v-if="hasActiveFilters"
          type="button"
          @click="clearFilters"
          class="px-4 py-2 rounded-xl border border-ink-200 dark:border-paper-border text-xs font-bold text-ink-700 dark:text-ink-200 hover:border-brand-500 transition-colors"
        >
          نمایش همه ترانه‌ها
        </button>
      </div>
    </section>

    <!-- فهرست بر اساس شعر -->
    <section v-else-if="viewMode === 'by-poem'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="entry in paginatedPoemEntries"
          :key="entry.poemId"
          class="p-5 rounded-3xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border shadow-2xs flex flex-col justify-between gap-4"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    @click="filterPoet = entry.poetSlug"
                    class="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 text-[11px] font-bold hover:bg-brand-500/20 transition-colors"
                  >
                    {{ entry.poetName }}
                  </button>
                  <span class="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                    {{ toPersianDigits(entry.tracks.length) }} ترانه / اجرا
                  </span>
                </div>

                <router-link
                  :to="entry.poemRoute"
                  class="block font-bold text-sm sm:text-base text-ink-900 dark:text-ink-50 hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-7"
                >
                  {{ entry.poemTitle }}
                </router-link>
              </div>

              <router-link
                :to="entry.poemRoute"
                class="p-2 rounded-xl bg-paper-warm/70 dark:bg-paper-dark hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600 dark:text-brand-400 shrink-0 transition-colors"
                title="خواندن شعر کامل"
              >
                <ArrowLeft class="w-4 h-4" />
              </router-link>
            </div>

            <!-- لیست قطعات خوانده‌شده از این شعر -->
            <div class="space-y-2">
              <div
                v-for="track in entry.matchedTracks"
                :key="`${entry.poemId}-${track.id}-${track.trackName}-${track.artistName}`"
                class="p-3 rounded-2xl bg-paper-warm/50 dark:bg-paper-dark/60 border border-ink-200/50 dark:border-paper-border space-y-1.5"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <span class="font-bold text-xs text-ink-900 dark:text-ink-100 block">
                      {{ track.trackName }}
                    </span>
                    <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink-500 mt-0.5">
                      <button
                        type="button"
                        @click="filterArtist = track.artistName"
                        class="font-bold text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Mic2 class="w-3 h-3" />
                        <span>{{ track.artistName }}</span>
                      </button>
                      <span v-if="track.albumName">آلبوم: {{ track.albumName }}</span>
                    </div>
                  </div>

                  <span class="px-2 py-0.5 rounded-lg bg-paper-light dark:bg-paper-surface border border-ink-200/60 dark:border-paper-border text-[10px] font-bold text-ink-600 dark:text-ink-300 shrink-0">
                    {{ detectSongPlatformLabel(track) }}
                  </span>
                </div>

                <div v-if="primarySongUrl(track)" class="pt-1">
                  <a
                    :href="primarySongUrl(track)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline"
                  >
                    <ExternalLink class="w-3 h-3" />
                    <span>شنیدن یا مشاهده در منبع</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-ink-200/50 dark:border-paper-border text-[11px]">
            <router-link
              :to="entry.poemRoute"
              class="font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              <span>مطالعهٔ متن شعر در غزل</span>
              <ArrowLeft class="w-3 h-3" />
            </router-link>
            <router-link
              v-if="entry.poetSlug"
              :to="`/poet/${entry.poetSlug}`"
              class="text-ink-500 hover:text-ink-800 dark:hover:text-ink-200"
            >
              صفحهٔ شاعر
            </router-link>
          </div>
        </article>
      </div>

      <div v-if="filteredPoemEntries.length > visibleLimit" class="flex justify-center pt-2">
        <button
          type="button"
          @click="visibleLimit += 24"
          class="px-5 py-2.5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200 dark:border-paper-border hover:border-brand-500 text-xs font-bold text-ink-800 dark:text-ink-100 transition-colors"
        >
          نمایش موارد بیشتر ({{ toPersianDigits(filteredPoemEntries.length - visibleLimit) }} مورد باقی‌مانده)
        </button>
      </div>
    </section>

    <!-- فهرست بر اساس تک‌تک قطعات -->
    <section v-else class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <article
          v-for="item in paginatedTracks"
          :key="`${item.poemId}-${item.track.id}-${item.track.trackName}-${item.track.artistName}`"
          class="p-4 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200/80 dark:border-paper-border flex flex-col justify-between gap-3 shadow-2xs"
        >
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-xs sm:text-sm text-ink-900 dark:text-ink-50 leading-6">
                {{ item.track.trackName }}
              </h3>
              <span class="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold shrink-0">
                {{ item.platform }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
              <button
                type="button"
                @click="filterArtist = item.track.artistName"
                class="font-bold text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
              >
                <Mic2 class="w-3.5 h-3.5" />
                <span>{{ item.track.artistName }}</span>
              </button>
              <button
                type="button"
                @click="filterPoet = item.poetSlug"
                class="px-2 py-0.5 rounded-md bg-paper-warm dark:bg-paper-dark text-ink-600 dark:text-ink-300 font-bold hover:text-brand-600"
              >
                {{ item.poetName }}
              </button>
            </div>

            <router-link
              :to="item.poemRoute"
              class="block text-xs text-ink-700 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium line-clamp-2 pt-1"
            >
              شعر: {{ item.poemTitle }}
            </router-link>

            <p v-if="item.track.albumName" class="text-[11px] text-ink-500">
              آلبوم: {{ item.track.albumName }}
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-ink-200/50 dark:border-paper-border text-[11px]">
            <a
              v-if="primarySongUrl(item.track)"
              :href="primarySongUrl(item.track)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 hover:underline"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>شنیدن</span>
            </a>
            <span v-else class="text-ink-400">بدون پیوند مستقیم</span>

            <router-link
              :to="item.poemRoute"
              class="font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              <span>متن شعر</span>
              <ArrowLeft class="w-3 h-3" />
            </router-link>
          </div>
        </article>
      </div>

      <div v-if="filteredTracks.length > visibleLimit" class="flex justify-center pt-2">
        <button
          type="button"
          @click="visibleLimit += 24"
          class="px-5 py-2.5 rounded-2xl bg-paper-light dark:bg-paper-surface border border-ink-200 dark:border-paper-border hover:border-brand-500 text-xs font-bold text-ink-800 dark:text-ink-100 transition-colors"
        >
          نمایش قطعات بیشتر ({{ toPersianDigits(filteredTracks.length - visibleLimit) }} مورد باقی‌مانده)
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataStore } from '../stores/dataStore';
import {
  detectSongPlatformLabel,
  extractPoetSlugFromUrl,
  safeSongExternalUrl,
  type PoemSongTrack
} from '../services/SongService';
import {
  loadCachedSongCatalog,
  getLocalPoemScanRefs,
  loadPoetSongOverview,
  collectPoetCategoryRefs,
  scanPoemRefsForSongs,
  savePoetSongScanRecord,
  loadPoetSongScanRecords,
  categoryUrlToCatPath,
  type CatalogSongEntry,
  type PoetSongScanRecord,
  type SongScanProgress
} from '../services/SongCatalogService';
import { normalizePersian, toPersianDigits } from '../utils/persianNormalizer';
import LoadingState from '../components/common/LoadingState.vue';
import type { GanjoorCategoryRef } from '../types/ganjoor';
import {
  Disc3,
  Radar,
  Search,
  Sparkles,
  Square,
  HardDrive,
  Loader2,
  BookOpen,
  Music,
  Mic2,
  ExternalLink,
  ArrowLeft
} from 'lucide-vue-next';

interface FilteredPoemEntry extends CatalogSongEntry {
  matchedTracks: PoemSongTrack[];
}

interface FlattenedTrackItem {
  poemId: number;
  poemTitle: string;
  poemRoute: string;
  poetSlug: string;
  poetName: string;
  updatedAt: string;
  platform: string;
  track: PoemSongTrack;
}

var route = useRoute();
var router = useRouter();
var dataStore = useDataStore();

var isLoadingCatalog = ref<boolean>(true);
var catalogEntries = ref<CatalogSongEntry[]>([]);
var inspectedPoemsCount = ref<number>(0);
var poetScanRecords = ref<PoetSongScanRecord[]>([]);

var searchQuery = ref<string>(String(route.query.q || ''));
var filterPoet = ref<string>(String(route.query.poet || ''));
var filterArtist = ref<string>(String(route.query.artist || ''));
var filterPlatform = ref<string>('');
var viewMode = ref<'by-poem' | 'by-track'>('by-poem');
var sortBy = ref<'recent' | 'most-tracks' | 'poet' | 'title'>('recent');
var visibleLimit = ref<number>(24);

var scannerPoetSlug = ref<string>(String(route.query.poet || 'hafez'));
var scannerCatPath = ref<string>('');
var scannerChildCats = ref<GanjoorCategoryRef[]>([]);
var isLoadingOverview = ref<boolean>(false);

var isScanning = ref<boolean>(false);
var scanProgress = ref<SongScanProgress | null>(null);
var scanStatusMessage = ref<string>('');
var scanAbortController: AbortController | null = null;

var allPoetsSorted = computed(function () {
  var list = (dataStore.poets || []).map(function (p) {
    return {
      id: p.Id,
      nickname: p.Nickname,
      slug: extractPoetSlugFromUrl(p.FullUrl)
    };
  }).filter(function (item) {
    return !!item.slug;
  });

  list.sort(function (a, b) {
    return a.nickname.localeCompare(b.nickname, 'fa');
  });
  return list;
});

var totalTracksCount = computed(function () {
  var count = 0;
  for (var i = 0; i < catalogEntries.value.length; i++) {
    count += catalogEntries.value[i].tracks.length;
  }
  return count;
});

var poetOptions = computed(function () {
  var map = new Map<string, { slug: string; name: string; poemCount: number }>();
  for (var i = 0; i < catalogEntries.value.length; i++) {
    var entry = catalogEntries.value[i];
    var slug = entry.poetSlug || entry.poetName;
    if (!slug) continue;
    var existing = map.get(slug);
    if (existing) {
      existing.poemCount++;
    } else {
      map.set(slug, { slug: slug, name: entry.poetName, poemCount: 1 });
    }
  }
  var arr = Array.from(map.values());
  arr.sort(function (a, b) {
    return b.poemCount - a.poemCount;
  });
  return arr;
});

var poetFilterSelectOptions = computed(function () {
  var base = poetOptions.value.slice();
  if (filterPoet.value) {
    var exists = base.some(function (item) { return item.slug === filterPoet.value; });
    if (!exists) {
      var matched = allPoetsSorted.value.find(function (p) { return p.slug === filterPoet.value; });
      base.unshift({
        slug: filterPoet.value,
        name: matched ? matched.nickname : filterPoet.value,
        poemCount: 0
      });
    }
  }
  return base;
});

var artistOptions = computed(function () {
  var map = new Map<string, number>();
  for (var i = 0; i < catalogEntries.value.length; i++) {
    var tracks = catalogEntries.value[i].tracks;
    for (var j = 0; j < tracks.length; j++) {
      var aName = (tracks[j].artistName || '').trim();
      if (!aName) continue;
      map.set(aName, (map.get(aName) || 0) + 1);
    }
  }
  var arr: Array<{ name: string; count: number }> = [];
  map.forEach(function (count, name) {
    arr.push({ name: name, count: count });
  });
  arr.sort(function (a, b) {
    return b.count - a.count;
  });
  return arr;
});

var artistFilterSelectOptions = computed(function () {
  var base = artistOptions.value.slice();
  if (filterArtist.value) {
    var exists = base.some(function (item) { return item.name === filterArtist.value; });
    if (!exists) {
      base.unshift({ name: filterArtist.value, count: 0 });
    }
  }
  return base;
});

var platformOptions = computed(function () {
  var map = new Map<string, number>();
  for (var i = 0; i < catalogEntries.value.length; i++) {
    var tracks = catalogEntries.value[i].tracks;
    for (var j = 0; j < tracks.length; j++) {
      var label = detectSongPlatformLabel(tracks[j]);
      map.set(label, (map.get(label) || 0) + 1);
    }
  }
  var arr: Array<{ name: string; count: number }> = [];
  map.forEach(function (count, name) {
    arr.push({ name: name, count: count });
  });
  arr.sort(function (a, b) {
    return b.count - a.count;
  });
  return arr;
});

var selectedFilterPoetLabel = computed(function () {
  if (!filterPoet.value) return '';
  var opt = poetFilterSelectOptions.value.find(function (p) { return p.slug === filterPoet.value; });
  return opt ? opt.name : filterPoet.value;
});

var hasActiveFilters = computed(function () {
  return !!(searchQuery.value.trim() || filterPoet.value || filterArtist.value || filterPlatform.value);
});

var normalizedQuery = computed(function () {
  return normalizePersian(searchQuery.value || '', true).trim();
});

function doesTrackMatch(entry: CatalogSongEntry, track: PoemSongTrack): boolean {
  if (filterArtist.value && track.artistName !== filterArtist.value) {
    return false;
  }
  if (filterPlatform.value && detectSongPlatformLabel(track) !== filterPlatform.value) {
    return false;
  }
  if (normalizedQuery.value) {
    var combined = normalizePersian(
      [
        entry.poemTitle,
        entry.poetName,
        track.trackName,
        track.artistName,
        track.albumName || '',
        track.description || ''
      ].join(' '),
      true
    );
    if (combined.indexOf(normalizedQuery.value) === -1) {
      return false;
    }
  }
  return true;
}

var filteredPoemEntries = computed<FilteredPoemEntry[]>(function () {
  var list: FilteredPoemEntry[] = [];
  for (var i = 0; i < catalogEntries.value.length; i++) {
    var entry = catalogEntries.value[i];
    if (filterPoet.value && entry.poetSlug !== filterPoet.value && entry.poetName !== filterPoet.value) {
      continue;
    }
    var matchedTracks = entry.tracks.filter(function (t) {
      return doesTrackMatch(entry, t);
    });
    if (matchedTracks.length === 0) continue;
    list.push({
      ...entry,
      matchedTracks: matchedTracks
    });
  }

  list.sort(function (a, b) {
    if (sortBy.value === 'most-tracks') {
      if (b.matchedTracks.length !== a.matchedTracks.length) {
        return b.matchedTracks.length - a.matchedTracks.length;
      }
      return a.poemTitle.localeCompare(b.poemTitle, 'fa');
    }
    if (sortBy.value === 'poet') {
      var pc = a.poetName.localeCompare(b.poetName, 'fa');
      if (pc !== 0) return pc;
      return a.poemTitle.localeCompare(b.poemTitle, 'fa');
    }
    if (sortBy.value === 'title') {
      return a.poemTitle.localeCompare(b.poemTitle, 'fa');
    }
    var bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    var aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.matchedTracks.length - a.matchedTracks.length;
  });

  return list;
});

var filteredTracks = computed<FlattenedTrackItem[]>(function () {
  var out: FlattenedTrackItem[] = [];
  var poemList = filteredPoemEntries.value;
  for (var i = 0; i < poemList.length; i++) {
    var p = poemList[i];
    for (var j = 0; j < p.matchedTracks.length; j++) {
      var tr = p.matchedTracks[j];
      out.push({
        poemId: p.poemId,
        poemTitle: p.poemTitle,
        poemRoute: p.poemRoute,
        poetSlug: p.poetSlug,
        poetName: p.poetName,
        updatedAt: p.updatedAt,
        platform: detectSongPlatformLabel(tr),
        track: tr
      });
    }
  }
  return out;
});

var paginatedPoemEntries = computed(function () {
  return filteredPoemEntries.value.slice(0, visibleLimit.value);
});

var paginatedTracks = computed(function () {
  return filteredTracks.value.slice(0, visibleLimit.value);
});

function primarySongUrl(track: PoemSongTrack): string {
  return safeSongExternalUrl(track.trackUrl) || safeSongExternalUrl(track.albumUrl) || safeSongExternalUrl(track.artistUrl);
}

function clearFilters() {
  searchQuery.value = '';
  filterPoet.value = '';
  filterArtist.value = '';
  filterPlatform.value = '';
  visibleLimit.value = 24;
  router.replace({ query: {} });
}

async function refreshCatalog() {
  var result = await loadCachedSongCatalog(dataStore.poets);
  catalogEntries.value = result.entries;
  inspectedPoemsCount.value = result.inspectedPoemsCount;
  poetScanRecords.value = await loadPoetSongScanRecords();
}

async function loadScannerOverview(slug: string) {
  scannerCatPath.value = '';
  scannerChildCats.value = [];
  if (!slug) return;
  isLoadingOverview.value = true;
  try {
    var overview = await loadPoetSongOverview(slug);
    if (overview && scannerPoetSlug.value === slug) {
      scannerChildCats.value = overview.childCats;
    }
  } finally {
    isLoadingOverview.value = false;
  }
}

watch(scannerPoetSlug, function (newSlug) {
  loadScannerOverview(newSlug);
});

watch(
  function () { return [searchQuery.value, filterPoet.value, filterArtist.value, filterPlatform.value, viewMode.value]; },
  function () {
    visibleLimit.value = 24;
  }
);

watch(
  function () { return route.query; },
  function (q) {
    if (typeof q.poet === 'string') {
      filterPoet.value = q.poet;
      if (q.poet) scannerPoetSlug.value = q.poet;
    }
    if (typeof q.artist === 'string') {
      filterArtist.value = q.artist;
    }
    if (typeof q.q === 'string') {
      searchQuery.value = q.q;
    }
  }
);

function cancelActiveScan() {
  if (scanAbortController) {
    scanAbortController.abort();
  }
}

async function runScanWithRefs(
  refs: Array<any>,
  metaLabel: { poetSlug?: string; poetName?: string; catPath?: string; catTitle?: string }
) {
  if (!scanAbortController) {
    scanAbortController = new AbortController();
  }
  var signal = scanAbortController.signal;

  var summary = await scanPoemRefsForSongs(refs, {
    concurrency: 4,
    signal: signal,
    onProgress: function (prog) {
      scanProgress.value = prog;
    }
  });

  if (metaLabel.poetSlug && summary.processedCount > 0) {
    await savePoetSongScanRecord({
      poetSlug: metaLabel.poetSlug,
      poetName: metaLabel.poetName || metaLabel.poetSlug,
      catPath: metaLabel.catPath || '',
      catTitle: metaLabel.catTitle || metaLabel.poetName || metaLabel.poetSlug,
      scannedCount: summary.processedCount,
      poemsWithSongsCount: summary.foundPoemsCount,
      tracksCount: summary.foundTracksCount,
      updatedAt: new Date().toISOString()
    });
  }

  await refreshCatalog();
  if (metaLabel.poetSlug && summary.foundPoemsCount > 0) {
    filterPoet.value = metaLabel.poetSlug;
  }

  if (summary.cancelled) {
    scanStatusMessage.value = 'بخشی از اشعار پیش از توقف بررسی و در حافظه ذخیره شدند.';
  } else if (summary.foundPoemsCount === 0) {
    scanStatusMessage.value = 'در این محدوده قطعهٔ موسیقی ثبت‌شده‌ای در گنجور یافت نشد.';
  } else {
    scanStatusMessage.value = 'نتایج جدید به فهرست ترانه‌ها اضافه شد و به‌صورت آفلاین نیز در دسترس است.';
  }
}

async function startRemotePoetScan() {
  if (!scannerPoetSlug.value || isScanning.value) return;

  var slug = scannerPoetSlug.value;
  var poetObj = allPoetsSorted.value.find(function (p) { return p.slug === slug; });
  var poetName = poetObj?.nickname || slug;
  var catPath = scannerCatPath.value || '';
  var catObj = scannerChildCats.value.find(function (c) {
    return categoryUrlToCatPath(c.FullUrl, slug) === catPath;
  });
  var catTitle = catObj?.Title || poetName;

  isScanning.value = true;
  scanStatusMessage.value = '';
  scanAbortController = new AbortController();
  scanProgress.value = {
    phase: 'collecting',
    collectedPoems: 0,
    processedCount: 0,
    totalCount: 0,
    foundPoemsCount: 0,
    foundTracksCount: 0,
    currentTitle: catTitle
  };

  try {
    var refs = await collectPoetCategoryRefs(slug, poetName, poetObj?.id, catPath, {
      signal: scanAbortController.signal,
      onCollectProgress: function (count, title) {
        scanProgress.value = {
          phase: 'collecting',
          collectedPoems: count,
          processedCount: 0,
          totalCount: 0,
          foundPoemsCount: 0,
          foundTracksCount: 0,
          currentTitle: title
        };
      }
    });

    if (scanAbortController.signal.aborted) {
      scanProgress.value = {
        phase: 'cancelled',
        collectedPoems: refs.length,
        processedCount: 0,
        totalCount: refs.length,
        foundPoemsCount: 0,
        foundTracksCount: 0,
        currentTitle: ''
      };
      return;
    }

    if (refs.length === 0) {
      scanStatusMessage.value = 'فهرست اشعار این شاعر برای اسکن دریافت نشد. اتصال اینترنت را بررسی کنید.';
      return;
    }

    await runScanWithRefs(refs, {
      poetSlug: slug,
      poetName: poetName,
      catPath: catPath,
      catTitle: catTitle
    });
  } finally {
    isScanning.value = false;
    scanAbortController = null;
  }
}

async function startLocalDownloadedScan() {
  if (isScanning.value) return;
  isScanning.value = true;
  scanStatusMessage.value = '';
  scanAbortController = new AbortController();

  try {
    var refs = await getLocalPoemScanRefs(dataStore.poets);
    if (refs.length === 0) {
      scanStatusMessage.value = 'هنوز هیچ دیوان یا شعری به‌صورت آفلاین دانلود نشده است؛ از بخش «اسکن ترانه‌های شاعر از گنجور» استفاده کنید.';
      scanProgress.value = null;
      return;
    }
    await runScanWithRefs(refs, {});
  } finally {
    isScanning.value = false;
    scanAbortController = null;
  }
}

async function scanSpecificFilterPoet() {
  if (!filterPoet.value || isScanning.value) return;
  scannerPoetSlug.value = filterPoet.value;
  scannerCatPath.value = '';
  await startRemotePoetScan();
}

onMounted(async function () {
  await dataStore.init();
  if (!allPoetsSorted.value.some(function (p) { return p.slug === scannerPoetSlug.value; })) {
    if (allPoetsSorted.value.length > 0) {
      scannerPoetSlug.value = allPoetsSorted.value[0].slug;
    }
  }
  await refreshCatalog();
  isLoadingCatalog.value = false;
  loadScannerOverview(scannerPoetSlug.value);
});

onBeforeUnmount(function () {
  cancelActiveScan();
});
</script>
