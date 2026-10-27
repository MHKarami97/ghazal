import { db } from '../db/GhazalDB';
import { cdnClient } from './CDNClient';
import type { GanjoorPoem } from '../types/ganjoor';

export interface FortuneResult {
  poem: GanjoorPoem;
  interpretation: string;
  intention?: string;
  savedHistoryId?: number;
}

export class FortuneService {
  /**
   * گرفتن فال حافظ پس از نیت کاربر
   */
  async getFaalHafez(intention?: string): Promise<FortuneResult> {
    var hafezPoems = await db.poems.filter(function (p) {
      return p.FullUrl.includes('/hafez/ghazal');
    }).toArray();

    var selectedPoem: GanjoorPoem;

    if (hafezPoems.length > 0) {
      // انتخاب تصادفی از اشعار محلی دانلودشده
      var randIdx = Math.floor(Math.random() * hafezPoems.length);
      selectedPoem = hafezPoems[randIdx];
    } else {
      // در غیر این صورت لود مستقیم یک غزل تصادفی از CDN بین ۱ تا ۴۹۵
      var randomShNum = Math.floor(Math.random() * 495) + 1;
      try {
        selectedPoem = await cdnClient.getPoem('hafez', 'ghazal', `sh${randomShNum}`);
        // کش محلی غزل لودشده
        await db.poems.put(selectedPoem);
      } catch (e) {
        // بازگشت به شماره ۱ در صورت خطا
        selectedPoem = await cdnClient.getPoem('hafez', 'ghazal', 'sh1');
      }
    }

    // تولید تعبیر دلنشین بر اساس محتوای غزل
    var interpretation = this.generateInterpretation(selectedPoem);

    // ثبت در تاریخچه فال‌ها
    var historyId = await db.userHistory.add({
      poemId: selectedPoem.Id,
      poemTitle: selectedPoem.Title,
      poetName: 'حافظ',
      fullUrl: selectedPoem.FullUrl,
      type: 'faal',
      viewedAt: new Date().toISOString(),
      faalNiat: intention || 'نیت خیر'
    });

    return {
      poem: selectedPoem,
      interpretation: interpretation,
      intention: intention,
      savedHistoryId: historyId
    };
  }

  /**
   * دریافت شعر امروز (تصادفی بر اساس تاریخ روز)
   */
  async getPoemOfTheDay(): Promise<GanjoorPoem> {
    var cached = await db.poems.toArray();
    if (cached.length > 0) {
      // انتخاب بر اساس روز سال
      var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
      var index = dayOfYear % cached.length;
      return cached[index];
    }

    // در حالت پیش‌فرض غزل اول حافظ را دریافت کن
    var defaultPoem = await cdnClient.getPoem('hafez', 'ghazal', 'sh1');
    await db.poems.put(defaultPoem);
    return defaultPoem;
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
      'آنچه در جست‌وجوی آنی در نزدیکی توست. چشم دل باز کن و به داشته‌های ارزشمند زندگی‌ات توجه کن. موفقیتی درخور در انتظار شماست.'
    ];

    var hash = 0;
    for (var i = 0; i < poem.Title.length; i++) {
      hash += poem.Title.charCodeAt(i);
    }
    return interpretations[hash % interpretations.length];
  }
}

export const fortuneService = new FortuneService();
