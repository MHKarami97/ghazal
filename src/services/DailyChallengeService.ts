import { db } from '../db/GhazalDB';
import type { DailyChallengeRecord } from '../types/user';
import { toLocalDateString } from '../utils/dateUtils';
import { shuffle } from '../utils/random';

var DEFAULT_SCORE = 15;

export interface DailyChallengeStatus {
  todayRecord: DailyChallengeRecord;
  hasAnsweredToday: boolean;
  streakDays: number;
  totalScore: number;
}

export class DailyChallengeService {
  /**
   * دریافت یا تولید چالش روزانه برای تاریخ امروز
   */
  async getTodayChallenge(): Promise<DailyChallengeStatus> {
    var self = this;
    var todayStr = toLocalDateString();

    var record = await db.transaction('rw', db.dailyChallenges, async function () {
      var existing = await db.dailyChallenges.where('date').equals(todayStr).first();
      if (existing) return existing;

      var created = self.generateChallengeForDate(todayStr);
      created.id = await db.dailyChallenges.add(created);
      return created;
    });

    var allRecords = await db.dailyChallenges.toArray();
    var byDate = new Map<string, DailyChallengeRecord>();
    var totalScore = 0;
    allRecords.forEach(function (r) {
      byDate.set(r.date, r);
      if (r.isCorrect) totalScore += r.score || DEFAULT_SCORE;
    });

    return {
      todayRecord: record,
      hasAnsweredToday: !!record.answeredAt,
      streakDays: this.countStreak(byDate, record),
      totalScore: totalScore
    };
  }

  /**
   * تعداد روزهای متوالیِ درست‌پاسخ‌داده‌شده؛ اگر امروز هنوز پاسخ داده نشده، از دیروز شمرده می‌شود
   */
  private countStreak(byDate: Map<string, DailyChallengeRecord>, today: DailyChallengeRecord): number {
    if (today.answeredAt && !today.isCorrect) return 0;

    var cursor = new Date();
    if (!today.isCorrect) cursor.setDate(cursor.getDate() - 1);

    var streak = 0;
    while (byDate.get(toLocalDateString(cursor))?.isCorrect) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  /**
   * ثبت پاسخ کاربر به چالش روزانه (هر چالش فقط یک‌بار پاسخ‌پذیر است)
   */
  async submitAnswer(challengeId: number, answer: string): Promise<{ isCorrect: boolean; scoreEarned: number }> {
    var record = await db.dailyChallenges.get(challengeId);
    if (!record) return { isCorrect: false, scoreEarned: 0 };
    if (record.answeredAt) return { isCorrect: !!record.isCorrect, scoreEarned: 0 };

    var isCorrect = record.correctAnswer.trim() === answer.trim();
    var score = isCorrect ? DEFAULT_SCORE : 0;

    await db.dailyChallenges.update(challengeId, {
      userAnswer: answer,
      isCorrect: isCorrect,
      score: score,
      answeredAt: new Date().toISOString()
    });

    return { isCorrect: isCorrect, scoreEarned: score };
  }

  private generateChallengeForDate(dateStr: string): DailyChallengeRecord {
    // مجموعه‌ای غنی از سوالات شاهکارهای شعر پارسی
    var challengePool = [
      {
        poetName: 'حافظ',
        poemTitle: 'غزل ۱',
        verseFirst: 'الا یا ایها الساقی ادر کأسا و ناولها',
        verseSecond: 'که عشق آسان نمود اول ولی افتاد مشکل‌ها',
        question: 'کلمه پایانی مصرع اول این بیت مشهور چیست؟',
        options: ['ناولها', 'کأسا', 'مشکل‌ها', 'ساقی'],
        correctAnswer: 'ناولها'
      },
      {
        poetName: 'سعدی',
        poemTitle: 'گلستان',
        verseFirst: 'بنی آدم اعضای یکدیگرند',
        verseSecond: 'که در آفرینش ز یک گوهرند',
        question: 'مصرع دوم این بیت شیخ اجل سعدی کدام است؟',
        options: [
          'که در آفرینش ز یک گوهرند',
          'چو عضوی به درد آورد روزگار',
          'دگر عضوها را نماند قرار',
          'تو کز محنت دیگران بی‌غمی'
        ],
        correctAnswer: 'که در آفرینش ز یک گوهرند'
      },
      {
        poetName: 'فردوسی',
        poemTitle: 'شاهنامه (دیباچه)',
        verseFirst: 'به نام خداوند جان و خرد',
        verseSecond: 'کزین برتر اندیشه برنگذرد',
        question: 'وزن حماسی این شاهکار فردوسی طوسی کدام است؟',
        options: [
          'فعولن فعولن فعولن فعل (متقارب)',
          'فاعلاتن فاعلاتن فاعلن (رمل)',
          'مفاعیلن مفاعیلن فعولن (هزج)',
          'مستفعلن مستفعلن مستفعلن (رجز)'
        ],
        correctAnswer: 'فعولن فعولن فعولن فعل (متقارب)'
      },
      {
        poetName: 'مولانا',
        poemTitle: 'مثنوی معنوی (نی‌نامه)',
        verseFirst: 'بشنو این نی چون شکایت می‌کند',
        verseSecond: 'از جدایی‌ها حکایت می‌کند',
        question: 'در این مطلع مثنوی، «نی» نماد و استعاره از چیست؟',
        options: [
          'انسان کامل و روح دورافتاده از عالم معنا',
          'ساز موسیقی در محفل سماع',
          'طبیعت بهاری و نیزار',
          'نویسنده و قلم نی'
        ],
        correctAnswer: 'انسان کامل و روح دورافتاده از عالم معنا'
      },
      {
        poetName: 'خیام',
        poemTitle: 'رباعیات',
        verseFirst: 'ابر آمد و زار بر سر سبزه گریست',
        verseSecond: 'بی باده گلرنگ نمی‌شاید زیست',
        question: 'در مصرع اول، چه آرایه ادبی نهفته است؟',
        options: [
          'تشخیص (جان‌بخشی به ابر)',
          'ایهام و تناسب',
          'جناس تام',
          'تجاهل‌العارف'
        ],
        correctAnswer: 'تشخیص (جان‌بخشی به ابر)'
      },
      {
        poetName: 'حافظ',
        poemTitle: 'غزل ۱۸۴',
        verseFirst: 'دوش دیدم که ملائک در میخانه زدند',
        verseSecond: 'گل آدم بسرشتند و به پیمانه زدند',
        question: 'کدام شاعر این غزل عارفانه را سروده است؟',
        options: ['حافظ', 'سعدی', 'عطار', 'مولانا'],
        correctAnswer: 'حافظ'
      },
      {
        poetName: 'نظامی',
        poemTitle: 'مخزن‌الاسرار',
        verseFirst: 'ای نام تو بهترین سرآغاز',
        verseSecond: 'بی‌نام تو نامه کی کنم باز',
        question: 'قالب شعری اثر گرانبهای «مخزن‌الاسرار» نظامی چیست؟',
        options: ['مثنوی', 'غزل', 'قصیده', 'ترجیع‌بند'],
        correctAnswer: 'مثنوی'
      }
    ];

    // انتخاب سوال بر اساس عدد روز
    var dateParts = dateStr.split('-').map(Number);
    var dayNum = Math.floor(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]) / 86400000);
    var item = challengePool[dayNum % challengePool.length];

    return {
      date: dateStr,
      poemId: 9000 + (dayNum % 100),
      poetName: item.poetName,
      poemTitle: item.poemTitle,
      verseFirst: item.verseFirst,
      verseSecond: item.verseSecond,
      question: item.question,
      options: shuffle(item.options),
      correctAnswer: item.correctAnswer,
      score: 15
    };
  }

  /**
   * دریافت تاریخچه چالش‌های پاسخ‌داده‌شده
   */
  async getChallengeHistory(): Promise<DailyChallengeRecord[]> {
    return await db.dailyChallenges.orderBy('date').reverse().limit(30).toArray();
  }
}

export const dailyChallengeService = new DailyChallengeService();
