import { db } from '../db/GhazalDB';
import type { MemorizeCard, CardStatus } from '../types/user';

export type ReviewGrade = 0 | 3 | 4 | 5; // 0: دوباره (Again), 3: سخت (Hard), 4: خوب (Good), 5: آسان (Easy)

export interface ReviewResult {
  card: MemorizeCard;
  nextIntervalDays: number;
  nextDueDate: string;
}

export class SpacedRepetitionService {
  /**
   * محاسبه وضعیت بعدی کارت با الگوریتم تکرار فاصله‌دار SM-2
   */
  calculateNextSchedule(card: MemorizeCard, grade: ReviewGrade): ReviewResult {
    var repCount = card.repCount || 0;
    var intervalDays = card.intervalDays || 1;
    var easeFactor = card.easeFactor || 2.5;
    var status: CardStatus = card.status;

    if (grade < 3) {
      // پاسخ ناموفق: ریست دوره‌ها و تکرار در روز بعد
      repCount = 0;
      intervalDays = 1;
      status = 'learning';
    } else {
      // پاسخ موفق: محاسبه فواصل زمانی
      if (repCount === 0) {
        intervalDays = 1;
      } else if (repCount === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }

      repCount++;

      if (repCount >= 5) {
        status = 'mastered';
      } else {
        status = 'review';
      }
    }

    // به‌روزرسانی ضریب آسانی (Ease Factor) با فرمول استاندارد SM-2
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    var q = grade;
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    // محاسبه تاریخ سررسید بعدی (YYYY-MM-DD)
    var nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    var nextDueDateStr = nextDate.toISOString().split('T')[0];

    var updatedCard: MemorizeCard = {
      ...card,
      repCount: repCount,
      intervalDays: intervalDays,
      easeFactor: Number(easeFactor.toFixed(2)),
      status: status,
      dueDate: nextDueDateStr,
      lastReviewDate: new Date().toISOString()
    };

    return {
      card: updatedCard,
      nextIntervalDays: intervalDays,
      nextDueDate: nextDueDateStr
    };
  }

  /**
   * دریافت کارت‌های نیازمند مرور برای امروز
   */
  async getDueCards(deckId?: number): Promise<MemorizeCard[]> {
    var todayStr = new Date().toISOString().split('T')[0];
    var query = db.memorizeCards.where('dueDate').belowOrEqual(todayStr);

    var cards = await query.toArray();
    if (deckId !== undefined) {
      cards = cards.filter(function (c) {
        return c.deckId === deckId;
      });
    }

    return cards;
  }

  /**
   * ثبت نتیجه مرور یک کارت در دیتابیس
   */
  async reviewCard(card: MemorizeCard, grade: ReviewGrade): Promise<MemorizeCard> {
    var res = this.calculateNextSchedule(card, grade);
    if (card.id) {
      await db.memorizeCards.update(card.id, res.card);
    }
    return res.card;
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
