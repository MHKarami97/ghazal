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

function stripId<T extends { id?: number }>(item: T): Omit<T, 'id'> {
  var copy: any = { ...item };
  delete copy.id;
  return copy;
}

function failedImport(message: string): ImportResult {
  return {
    success: false,
    importedBookmarks: 0,
    importedCards: 0,
    importedDecks: 0,
    missingPoemsCount: 0,
    missingPoemIds: [],
    errorMessage: message
  };
}

export class ExportService {
  /**
   * استخراج کلیه داده‌های کاربر به قالب فایل JSON
   */
  async exportUserData(): Promise<string> {
    var backup: UserDataBackup = {
      version: '1.1.0',
      dataCommitSha: DATA_COMMIT_SHA,
      exportedAt: new Date().toISOString(),
      bookmarks: await db.userBookmarks.toArray(),
      history: await db.userHistory.toArray(),
      decks: await db.memorizeDecks.toArray(),
      cards: await db.memorizeCards.toArray(),
      collections: await db.userCollections.toArray(),
      dailyChallenges: await db.dailyChallenges.toArray()
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * ادغام داده‌های فایل پشتیبان با داده‌های فعلی.
   * شناسه‌های فایل پشتیبان دوباره‌نگاشت می‌شوند تا روی داده‌های موجود نوشته نشوند، و موارد تکراری رد می‌شوند.
   */
  async importUserData(jsonString: string): Promise<ImportResult> {
    try {
      var data: UserDataBackup = JSON.parse(jsonString);
      var hasKnownSection = [data.bookmarks, data.cards, data.decks, data.collections].some(Array.isArray);
      if (!data || typeof data !== 'object' || !hasKnownSection) {
        return failedImport('ساختار فایل پشتیبان معتبر نیست.');
      }

      var counts = { decks: 0, cards: 0, bookmarks: 0 };
      var tables = [
        db.memorizeDecks,
        db.memorizeCards,
        db.userBookmarks,
        db.userHistory,
        db.userCollections,
        db.dailyChallenges
      ];

      await db.transaction('rw', tables, async function () {
        var deckIdMap = new Map<number, number>();
        var decks = await db.memorizeDecks.toArray();

        for (var d = 0; d < (data.decks || []).length; d++) {
          var deck = data.decks![d];
          var sameTitle = decks.find(function (x) { return x.title === deck.title; });
          if (sameTitle && sameTitle.id !== undefined) {
            if (deck.id !== undefined) deckIdMap.set(deck.id, sameTitle.id);
            continue;
          }
          var newDeckId = await db.memorizeDecks.add(stripId(deck));
          decks.push({ ...deck, id: newDeckId });
          if (deck.id !== undefined) deckIdMap.set(deck.id, newDeckId);
          counts.decks++;
        }

        var fallbackDeckId = decks.length ? decks[0].id : undefined;
        if (data.cards && data.cards.length && fallbackDeckId === undefined) {
          fallbackDeckId = await db.memorizeDecks.add({
            title: 'فهرست اصلی حفظ',
            color: '#b87c2c',
            createdAt: new Date().toISOString()
          });
        }

        var cardKeys = new Set<string>();
        (await db.memorizeCards.toArray()).forEach(function (c) {
          cardKeys.add(`${c.deckId}:${c.poemId}:${c.coupletIndex}`);
        });
        for (var c = 0; c < (data.cards || []).length; c++) {
          var card = data.cards![c];
          var targetDeckId = deckIdMap.get(card.deckId) ?? fallbackDeckId!;
          var cardKey = `${targetDeckId}:${card.poemId}:${card.coupletIndex}`;
          if (cardKeys.has(cardKey)) continue;
          cardKeys.add(cardKey);
          await db.memorizeCards.add({ ...stripId(card), deckId: targetDeckId });
          counts.cards++;
        }

        var bookmarkKeys = new Set<string>();
        (await db.userBookmarks.toArray()).forEach(function (b) {
          bookmarkKeys.add(`${b.poemId}:${b.coupletIndex ?? ''}`);
        });
        for (var b = 0; b < (data.bookmarks || []).length; b++) {
          var bookmark = data.bookmarks![b];
          var bookmarkKey = `${bookmark.poemId}:${bookmark.coupletIndex ?? ''}`;
          if (bookmarkKeys.has(bookmarkKey)) continue;
          bookmarkKeys.add(bookmarkKey);
          await db.userBookmarks.add(stripId(bookmark));
          counts.bookmarks++;
        }

        var historyKeys = new Set<string>();
        (await db.userHistory.toArray()).forEach(function (h) {
          historyKeys.add(`${h.type}:${h.poemId}:${h.viewedAt}`);
        });
        for (var h = 0; h < (data.history || []).length; h++) {
          var entry = data.history![h];
          var historyKey = `${entry.type}:${entry.poemId}:${entry.viewedAt}`;
          if (historyKeys.has(historyKey)) continue;
          historyKeys.add(historyKey);
          await db.userHistory.add(stripId(entry));
        }

        var collections = await db.userCollections.toArray();
        for (var k = 0; k < (data.collections || []).length; k++) {
          var collection = data.collections![k];
          var existing = collections.find(function (x) { return x.title === collection.title; });
          if (!existing || existing.id === undefined) {
            await db.userCollections.add(stripId(collection));
            continue;
          }
          var itemKeys = new Set(existing.items.map(function (i) { return `${i.poemId}:${i.coupletIndex ?? ''}`; }));
          var merged = existing.items.slice();
          collection.items.forEach(function (i) {
            var itemKey = `${i.poemId}:${i.coupletIndex ?? ''}`;
            if (!itemKeys.has(itemKey)) {
              itemKeys.add(itemKey);
              merged.push(i);
            }
          });
          await db.userCollections.update(existing.id, { items: merged, updatedAt: new Date().toISOString() });
        }

        var challengeDates = new Set((await db.dailyChallenges.toArray()).map(function (r) { return r.date; }));
        for (var r = 0; r < (data.dailyChallenges || []).length; r++) {
          var record = data.dailyChallenges![r];
          if (challengeDates.has(record.date)) continue;
          challengeDates.add(record.date);
          await db.dailyChallenges.add(stripId(record));
        }
      });

      var missingPoemIds = await this.findMissingPoemIds(data);

      return {
        success: true,
        importedBookmarks: counts.bookmarks,
        importedCards: counts.cards,
        importedDecks: counts.decks,
        missingPoemsCount: missingPoemIds.length,
        missingPoemIds: missingPoemIds
      };
    } catch (err: any) {
      return failedImport(`خطا در بازخوانی فایل: ${err.message}`);
    }
  }

  private async findMissingPoemIds(data: UserDataBackup): Promise<number[]> {
    var wanted = new Set<number>();
    (data.bookmarks || []).forEach(function (b) { wanted.add(b.poemId); });
    (data.cards || []).forEach(function (c) { wanted.add(c.poemId); });

    var ids = Array.from(wanted);
    var found = await db.poems.bulkGet(ids);
    return ids.filter(function (_id, index) { return !found[index]; });
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
