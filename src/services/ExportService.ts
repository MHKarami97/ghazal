import { db } from '../db/GhazalDB';
import { DATA_COMMIT_SHA } from '../config/dataConfig';
import type { UserDataBackup } from '../types/user';

export interface ImportResult {
  success: boolean;
  importedBookmarks: number;
  importedCards: number;
  importedDecks: number;
  missingPoemsCount: number;
  missingPoemIds: number[];
  errorMessage?: string;
}

export class ExportService {
  /**
   * استخراج کلیه داده‌های کاربر به قالب فایل JSON
   */
  async exportUserData(): Promise<string> {
    var bookmarks = await db.userBookmarks.toArray();
    var history = await db.userHistory.toArray();
    var decks = await db.memorizeDecks.toArray();
    var cards = await db.memorizeCards.toArray();

    var backup: UserDataBackup = {
      version: '1.0.0',
      dataCommitSha: DATA_COMMIT_SHA,
      exportedAt: new Date().toISOString(),
      bookmarks: bookmarks,
      history: history,
      decks: decks,
      cards: cards
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * بازیابی اطلاعات کاربر از فایل JSON و بررسی اشعار ناموجود
   */
  async importUserData(jsonString: string): Promise<ImportResult> {
    try {
      var data: UserDataBackup = JSON.parse(jsonString);

      if (!data.bookmarks && !data.cards && !data.decks) {
        return {
          success: false,
          importedBookmarks: 0,
          importedCards: 0,
          importedDecks: 0,
          missingPoemsCount: 0,
          missingPoemIds: [],
          errorMessage: 'ساختار فایل پشتیبان معتبر نیست.'
        };
      }

      var missingPoemIds: number[] = [];
      var installedPoems = new Set((await db.poems.toArray()).map(function (p) { return p.Id; }));

      // بررسی اشعار نشانک‌ها و کارت‌ها
      if (data.bookmarks) {
        for (var b = 0; b < data.bookmarks.length; b++) {
          var pId = data.bookmarks[b].poemId;
          if (!installedPoems.has(pId) && !missingPoemIds.includes(pId)) {
            missingPoemIds.push(pId);
          }
        }
      }

      if (data.cards) {
        for (var c = 0; c < data.cards.length; c++) {
          var cPoemId = data.cards[c].poemId;
          if (!installedPoems.has(cPoemId) && !missingPoemIds.includes(cPoemId)) {
            missingPoemIds.push(cPoemId);
          }
        }
      }

      // درج دسته‌ها و کارت‌ها در IndexedDB
      if (data.decks && data.decks.length) {
        await db.memorizeDecks.bulkPut(data.decks);
      }
      if (data.cards && data.cards.length) {
        await db.memorizeCards.bulkPut(data.cards);
      }
      if (data.bookmarks && data.bookmarks.length) {
        await db.userBookmarks.bulkPut(data.bookmarks);
      }
      if (data.history && data.history.length) {
        await db.userHistory.bulkPut(data.history);
      }

      return {
        success: true,
        importedBookmarks: data.bookmarks?.length || 0,
        importedCards: data.cards?.length || 0,
        importedDecks: data.decks?.length || 0,
        missingPoemsCount: missingPoemIds.length,
        missingPoemIds: missingPoemIds
      };
    } catch (err: any) {
      return {
        success: false,
        importedBookmarks: 0,
        importedCards: 0,
        importedDecks: 0,
        missingPoemsCount: 0,
        missingPoemIds: [],
        errorMessage: `خطا در بازخوانی فایل: ${err.message}`
      };
    }
  }

  /**
   * تولید کارت گرافیکی تصویری از بیت شعر روی Canvas
   */
  generatePoemCardCanvas(
    firstMisra: string,
    secondMisra: string,
    poetName: string,
    poemTitle?: string
  ): HTMLCanvasElement {
    var canvas = document.createElement('canvas');
    var width = 1080;
    var height = 1080;
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // ۱. پس‌زمینه کرم/کاغذی با گرادینت ملایم
    var grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#fdfbf7');
    grad.addColorStop(1, '#f3ece0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // ۲. حاشیه تزیینی اسلیمی
    ctx.strokeStyle = '#b87c2c';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    ctx.strokeStyle = 'rgba(184, 124, 44, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(55, 55, width - 110, height - 110);

    // ۳. عنوان برند در بالا
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillStyle = '#b87c2c';
    ctx.font = 'bold 34px Vazirmatn, sans-serif';
    ctx.fillText('« غـــــزل »', width / 2, 160);

    // ۴. متن ابیات
    ctx.fillStyle = '#1e293b';
    ctx.font = '500 46px Vazirmatn, sans-serif';

    // مصرع اول
    ctx.fillText(firstMisra, width / 2, height / 2 - 40);

    // نشانگر پیوند
    ctx.fillStyle = 'rgba(184, 124, 44, 0.6)';
    ctx.font = '30px Vazirmatn, sans-serif';
    ctx.fillText('✦', width / 2, height / 2 + 30);

    // مصرع دوم
    ctx.fillStyle = '#1e293b';
    ctx.font = '500 46px Vazirmatn, sans-serif';
    ctx.fillText(secondMisra, width / 2, height / 2 + 100);

    // ۵. نام شاعر و عنوان در پایین
    ctx.fillStyle = '#7a471e';
    ctx.font = 'bold 36px Vazirmatn, sans-serif';
    ctx.fillText(poetName, width / 2, height - 180);

    if (poemTitle) {
      ctx.fillStyle = '#64748b';
      ctx.font = '28px Vazirmatn, sans-serif';
      ctx.fillText(poemTitle, width / 2, height - 130);
    }

    return canvas;
  }
}

export const exportService = new ExportService();
