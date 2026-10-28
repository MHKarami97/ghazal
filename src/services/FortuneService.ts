import { db } from '../db/GhazalDB';
import { cdnClient } from './CDNClient';
import type { GanjoorPoem } from '../types/ganjoor';

export interface FortuneResult {
  poem: GanjoorPoem;
  interpretation: string;
  intention?: string;
  savedHistoryId?: number;
}

var DEFAULT_FALLBACK_POEM: GanjoorPoem = {
  Id: 2130,
  CatId: 24,
  Title: 'غزل شمارهٔ ۱',
  FullTitle: 'حافظ » غزلیات » غزل شمارهٔ ۱',
  FullUrl: '/hafez/ghazal/sh1',
  Verses: [
    { VOrder: 1, Position: 'Right', CoupletIndex: 0, Text: 'الا یا ایها الساقی ادر کأسا و ناولها' },
    { VOrder: 2, Position: 'Left', CoupletIndex: 0, Text: 'که عشق آسان نمود اول ولی افتاد مشکل‌ها' }
  ]
};

export class FortuneService {
  /**
   * گرفتن فال حافظ پس از نیت کاربر
   * انتخاب کاملاً تصادفی از میان ۴۹۵ غزل دیوان حافظ با بررسی حافظه محلی و شبکه
   */
  async getFaalHafez(intention?: string): Promise<FortuneResult> {
    // ۱. تولید عدد تصادفی بین ۱ تا ۴۹۵ (تعداد کل غزلیات دیوان حافظ)
    var randomShNum = Math.floor(Math.random() * 495) + 1;
    var targetSlug = 'sh' + randomShNum;
    var targetFullUrl = `/hafez/ghazal/${targetSlug}`;

    var selectedPoem: GanjoorPoem = DEFAULT_FALLBACK_POEM;
    var found = false;

    // ۲. بررسی اینکه آیا این غزل قبلاً در پایگاه داده محلی ذخیره شده یا نه
    try {
      var localMatch = await db.poems.where('FullUrl').equals(targetFullUrl).first();
      if (!localMatch) {
        localMatch = await db.poems.filter(function (p) {
          return p.FullUrl.endsWith('/' + targetSlug);
        }).first();
      }
      if (localMatch && localMatch.Verses && localMatch.Verses.length > 0) {
        selectedPoem = localMatch;
        found = true;
      }
    } catch (eLocal) {
      console.warn('Local faal check error:', eLocal);
    }

    // ۳. اگر به صورت محلی نبود، از CDN دریافت کن
    if (!found) {
      try {
        var remotePoem = await cdnClient.getPoem('hafez', 'ghazal', targetSlug);
        if (remotePoem && remotePoem.Verses && remotePoem.Verses.length > 0) {
          await db.poems.put(JSON.parse(JSON.stringify(remotePoem)));
          selectedPoem = remotePoem;
          found = true;
        }
      } catch (eRemote) {
        console.warn(`Could not fetch remote ghazal ${targetSlug}:`, eRemote);
      }
    }

    // ۴. در صورت عدم دسترسی به شبکه و نبودن آن غزل خاص، از میان اشعار حافظ موجود در دستگاه به تصادف انتخاب کن
    if (!found) {
      var availableHafez = await db.poems.filter(function (p) {
        return p.FullUrl.includes('/hafez/ghazal') && p.Verses && p.Verses.length > 0;
      }).toArray();

      if (availableHafez.length > 0) {
        var randIdx = Math.floor(Math.random() * availableHafez.length);
        selectedPoem = availableHafez[randIdx];
        found = true;
      }
    }

    // ۵. اگر هنوز شعری یافت نشد، تلاش برای دریافت غزل ۱ یا اولین شعر موجود
    if (!found) {
      try {
        var fb = await cdnClient.getPoem('hafez', 'ghazal', 'sh1');
        if (fb && fb.Verses && fb.Verses.length > 0) {
          await db.poems.put(JSON.parse(JSON.stringify(fb)));
          selectedPoem = fb;
        }
      } catch (eFallback) {
        var anyPoem = await db.poems.toCollection().first();
        if (anyPoem && anyPoem.Verses && anyPoem.Verses.length > 0) {
          selectedPoem = anyPoem;
        }
      }
    }

    // تولید تعبیر دلنشین بر اساس غزل و نیت
    var interpretation = this.generateInterpretation(selectedPoem);

    // ثبت در تاریخچه فال‌ها
    var historyId: number | undefined;
    try {
      historyId = await db.userHistory.add({
        poemId: selectedPoem.Id,
        poemTitle: selectedPoem.Title,
        poetName: 'حافظ',
        fullUrl: selectedPoem.FullUrl,
        type: 'faal',
        viewedAt: new Date().toISOString(),
        faalNiat: intention?.trim() || 'نیت خیر'
      });
    } catch (eHistory) {
      console.warn('Could not save fortune to history:', eHistory);
    }

    return {
      poem: selectedPoem,
      interpretation: interpretation,
      intention: intention,
      savedHistoryId: historyId
    };
  }

  /**
   * دریافت شعر امروز
   * هر روز تقویمی یک شعر منحصربه‌فرد و متفاوت ارائه می‌دهد
   */
  async getPoemOfTheDay(): Promise<GanjoorPoem> {
    var now = new Date();
    // محاسبه عدد روز سال (۱ تا ۳۶۶)
    var startOfYear = new Date(now.getFullYear(), 0, 0);
    var diffMs = now.getTime() - startOfYear.getTime();
    var dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // الگوریتم چرخش روزانه: محاسبه عدد یکتای غزل برای هر روز با ضریب عدد اول ۱۷
    var targetNum = ((dayOfYear * 17 + 3) % 495) + 1;
    var targetSlug = 'sh' + targetNum;
    var targetFullUrl = `/hafez/ghazal/${targetSlug}`;

    // ۱. بررسی اشعار دانلودشده در دستگاه کاربر
    var allCached = await db.poems.filter(function (p) {
      return !!p.Verses && p.Verses.length >= 2;
    }).toArray();

    // اگر کاربر بسته کاملی دانلود کرده (بیش از ۲۰ شعر)، از میان اشعار دانلودشده‌اش شعر روز را انتخاب کن
    if (allCached.length >= 20) {
      var daySeed = (now.getFullYear() * 372) + ((now.getMonth() + 1) * 31) + now.getDate();
      var selectedIdx = Math.abs((daySeed * 7919 + 104729) % allCached.length);
      return allCached[selectedIdx];
    }

    // ۲. در غیر این صورت، غزل تعیین‌شده برای امروز را در حافظه محلی بررسی کن
    var cachedToday = allCached.find(function (p) {
      return p.FullUrl === targetFullUrl || p.FullUrl.endsWith('/' + targetSlug);
    });
    if (cachedToday) {
      return cachedToday;
    }

    // ۳. فراخوانی غزل امروز از CDN
    try {
      var remotePoem = await cdnClient.getPoem('hafez', 'ghazal', targetSlug);
      if (remotePoem && remotePoem.Verses && remotePoem.Verses.length > 0) {
        await db.poems.put(JSON.parse(JSON.stringify(remotePoem)));
        return remotePoem;
      }
    } catch (eRemote) {
      console.warn(`Could not fetch remote daily poem ${targetSlug}:`, eRemote);
    }

    // ۴. در صورت آفلاین بودن، از میان اشعار موجود در دستگاه بر اساس روز سال برگردان
    if (allCached.length > 0) {
      return allCached[dayOfYear % allCached.length];
    }

    // ۵. آخرین پشتیبان
    try {
      var fallback = await cdnClient.getPoem('hafez', 'ghazal', 'sh1');
      if (fallback && fallback.Verses && fallback.Verses.length > 0) {
        await db.poems.put(JSON.parse(JSON.stringify(fallback)));
        return fallback;
      }
    } catch (eFallback) {
      console.warn('Fallback poem error:', eFallback);
    }

    return DEFAULT_FALLBACK_POEM;
  }

  /**
   * دریافت تاریخچه فال‌های گذشته کاربر
   */
  async getFortuneHistory() {
    return await db.userHistory.where('type').equals('faal').reverse().sortBy('viewedAt');
  }

  private generateInterpretation(poem: GanjoorPoem): string {
    var interpretations = [
      'ای صاحب فال، نیت شما نیکوست و روزهای گشایش و شادمانی در پیش است. صبور باشید و از شتاب بی‌جا بپرهیزید، چرا که کارها به مراد دل شما پیش خواهد رفت.',
      'غم و اندوه گذشته را رها کن و با توکل بر پروردگار گام بردار. دوستی یا هم‌صحبتی پاک‌دل در مسیر شما قرار خواهد گرفت که چراغ راهتان خواهد بود.',
      'آرزویی که در دل داری به زودی محقق می‌شود، اما شرط آن استواری در عهد و راستی در کردار است. راز دل خود را با نامحرمان در میان مگذار.',
      'دوران سختی و دلتنگی رو به پایان است. دریچه‌های امید و برکت به روی شما گشوده می‌شود؛ شکرگزار باشید و به نیازمندان نیکی کنید.',
      'آنچه در جست‌وجوی آنی در نزدیکی توست. چشم دل باز کن و به داشته‌های ارزشمند زندگی‌ات توجه کن. موفقیتی درخور در انتظار شماست.',
      'در تصمیمی که گرفته‌ای تردید مکن، اما مشورت با خردمندان را فراموش ننما. بخت با تو یار است و ستارهٔ اقبالت رو به درخشش نهاده است.',
      'از طعنه و ملامت بدخواهان دلگیر مشو؛ نیت پاک تو سرانجام پیروز خواهد شد. بر اصول اخلاقی خود پایدار بمان تا سربلند شوی.',
      'سفری پرخیر یا دیداری دلنشین در پیش داری که مایهٔ آرامش روح و آسایش خاطر خواهد بود. گذشته را چون خوابی پندار و به آینده بنگر.',
      'همت بلند دار و به توانایی‌های درونی خود ایمان بیاور. اگر گرهی در کار افتاده، به زودی با تدبیر و عنایت حق گشوده خواهد شد.',
      'در عشق و دوستی وفادار باش و قدر گوهر محبت را بدان. گنجی که در طلب آنی در پاکی ضمیر و خدمت به خلق نهفته است.',
      'پاداش صبوری و شکیبایی‌ات را خواهی گرفت. مژده‌ای خوش در راه است که اندوه‌های دیرین را از صفحهٔ خاطرت خواهد شست.',
      'از افراط و تفریط پرهیز کن و راه میانه را برگزین. باری سنگین از دوشت برداشته خواهد شد و گام‌هایت استوارتر خواهد گردید.'
    ];

    var hash = 0;
    if (poem.Id) {
      hash += poem.Id;
    }
    if (poem.Title) {
      for (var i = 0; i < poem.Title.length; i++) {
        hash = (hash * 31 + poem.Title.charCodeAt(i)) & 0x7fffffff;
      }
    }
    return interpretations[Math.abs(hash) % interpretations.length];
  }
}

export const fortuneService = new FortuneService();
