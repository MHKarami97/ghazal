import { db } from '../db/GhazalDB';
import type { MemorizeCard, CardStatus } from '../types/user';
import { addDaysToToday, toLocalDateString } from '../utils/dateUtils';

export type ReviewGrade = 0 | 3 | 4 | 5; // 0: دوباره (Again), 3: سخت (Hard), 4: خوب (Good), 5: آسان (Easy)

export interface ReviewResult {
  card: MemorizeCard;
  nextIntervalDays: number;
  nextDueDate: string;
}

var MASTERED_REP_COUNT = 5;
var MIN_EASE_FACTOR = 1.3;
var DEFAULT_EASE_FACTOR = 2.5;

export class SpacedRepetitionService {
  /**
   * محاسبه وضعیت بعدی کارت بر اساس الگوریتم SM-2 (Wozniak, 1990)
   */
  calculateNextSchedule(card: MemorizeCard, grade: ReviewGrade): ReviewResult {
    var repCount = card.repCount || 0;
    var intervalDays = card.intervalDays || 1;
    var easeFactor = card.easeFactor || DEFAULT_EASE_FACTOR;
    var status: CardStatus = card.status;

    if (grade < 3) {
      // طبق SM-2: بدون تغییر E-Factor، تکرارها از ابتدا شروع می‌شوند
      repCount = 0;
      intervalDays = 1;
      status = 'learning';
    } else {
      if (repCount === 0) {
        intervalDays = 1;
      } else if (repCount === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.ceil(intervalDays * easeFactor);
      }

      repCount++;
      status = repCount >= MASTERED_REP_COUNT ? 'mastered' : 'review';
      easeFactor = this.nextEaseFactor(easeFactor, grade);
    }

    var nextDueDate = addDaysToToday(intervalDays);

    var updatedCard: MemorizeCard = {
      ...card,
      repCount: repCount,
      intervalDays: intervalDays,
      easeFactor: Number(easeFactor.toFixed(2)),
      status: status,
      dueDate: nextDueDate,
      lastReviewDate: new Date().toISOString()
    };

    return {
      card: updatedCard,
      nextIntervalDays: intervalDays,
      nextDueDate: nextDueDate
    };
  }

  /**
   * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) با کف ۱.۳
   */
  private nextEaseFactor(easeFactor: number, grade: number): number {
    var distance = 5 - grade;
    var next = easeFactor + (0.1 - distance * (0.08 + distance * 0.02));
    return Math.max(MIN_EASE_FACTOR, next);
  }

  /**
   * دریافت کارت‌های نیازمند مرور تا امروز (به وقت محلی کاربر)
   */
  async getDueCards(deckId?: number): Promise<MemorizeCard[]> {
    var collection = db.memorizeCards.where('dueDate').belowOrEqual(toLocalDateString());
    if (deckId !== undefined) {
      collection = collection.and(function (card) {
        return card.deckId === deckId;
      });
    }
    return collection.toArray();
  }

  async reviewCard(card: MemorizeCard, grade: ReviewGrade): Promise<MemorizeCard> {
    var result = this.calculateNextSchedule(card, grade);
    if (card.id !== undefined) {
      await db.memorizeCards.update(card.id, result.card);
    }
    return result.card;
  }

  /**
   * ثبت نتیجه مرور با شناسهٔ کارت؛ همیشه آخرین نسخهٔ کارت را از دیتابیس می‌خواند
   */
  async reviewCardById(cardId: number, grade: ReviewGrade): Promise<MemorizeCard | null> {
    var card = await db.memorizeCards.get(cardId);
    if (!card) return null;
    return this.reviewCard(card, grade);
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
