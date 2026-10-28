import { db } from '../db/GhazalDB';
import { fuzzyMatch, normalizePersian } from '../utils/persianNormalizer';
import type { QuizMode, QuizQuestion } from '../types/quiz';
import type { MemorizeCard } from '../types/user';
import type { GanjoorPoem, GanjoorLiteraryDevice } from '../types/ganjoor';

export class QuizService {
  /**
   * تولید سؤالات آزمون بر اساس حالت انتخابی
   */
  async generateQuestions(mode: QuizMode, count = 10, deckId?: number): Promise<QuizQuestion[]> {
    var cards: MemorizeCard[] = [];
    if (deckId !== undefined) {
      cards = await db.memorizeCards.where('deckId').equals(deckId).toArray();
    } else {
      cards = await db.memorizeCards.toArray();
    }

    // اگر کارتی در حفظ نبود، از اشعار دانلود شده استفاده کن
    var allPoems = await db.poems.toArray();

    switch (mode) {
      case 'cloze':
        return this.generateClozeQuestions(cards, allPoems, count);
      case 'reorder':
        return this.generateReorderQuestions(cards, allPoems, count);
      case 'multiple_choice':
        return this.generateMultipleChoiceQuestions(cards, allPoems, count);
      case 'typing':
        return this.generateTypingQuestions(cards, allPoems, count);
      case 'guess_poet':
        return this.generateGuessPoetQuestions(allPoems, count);
      case 'guess_device':
        return this.generateGuessDeviceQuestions(allPoems, count);
      case 'guess_metre':
        return this.generateGuessMetreQuestions(allPoems, count);
      case 'next_couplet':
        return this.generateNextCoupletQuestions(allPoems, count);
      case 'rhyme_match':
        return this.generateRhymeMatchQuestions(allPoems, count);
      case 'word_hiding':
        return this.generateWordHidingQuestions(cards, allPoems, count);
      default:
        return [];
    }
  }

  private generateClozeQuestions(cards: MemorizeCard[], poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = cards.length >= 3 ? cards : this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      var text = item.textFirst || item.textSecond;
      var words = text.split(/\s+/).filter(Boolean);
      if (words.length < 3) continue;

      var targetIndex = Math.floor(Math.random() * words.length);
      var answer = words[targetIndex].replace(/[.,،؛:!؟?]/g, '');
      var prompt = words.map(function (w, idx) {
        return idx === targetIndex ? '(___)' : w;
      }).join(' ');

      // گزینه‌های ساختگی
      var options = [answer];
      var distractorPool = ['دل', 'عشق', 'یار', 'جان', 'چشم', 'گل', 'می', 'ساقی', 'جام', 'شب'];
      for (var d = 0; d < distractorPool.length && options.length < 4; d++) {
        var word = distractorPool[d];
        if (!options.includes(word)) options.push(word);
      }
      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `cloze-${i}`,
        mode: 'cloze',
        cardId: item.id,
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: prompt,
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        options: options,
        answer: answer
      });
    }

    return questions;
  }

  private generateReorderQuestions(cards: MemorizeCard[], poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = cards.length >= 3 ? cards : this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      var fullCouplet = `${item.textFirst} * ${item.textSecond}`;
      var words = `${item.textFirst} ${item.textSecond}`.split(/\s+/).filter(Boolean);
      var scrambled = [...words].sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `reorder-${i}`,
        mode: 'reorder',
        cardId: item.id,
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: 'کلمات بیت زیر را به ترتیب صحیح مرتب کنید:',
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        fullCouplet: fullCouplet,
        scrambledItems: scrambled,
        answer: `${item.textFirst} ${item.textSecond}`
      });
    }

    return questions;
  }

  private generateMultipleChoiceQuestions(cards: MemorizeCard[], poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = cards.length >= 3 ? cards : this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      var answer = item.textSecond;
      var options = [answer];

      // انتخاب ۳ گزینه انحرافی از سایر ابیات
      for (var j = 0; j < pool.length && options.length < 4; j++) {
        var other = pool[j];
        if (other.poemId !== item.poemId && other.textSecond && !options.includes(other.textSecond)) {
          options.push(other.textSecond);
        }
      }

      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `mc-${i}`,
        mode: 'multiple_choice',
        cardId: item.id,
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: `مصرع دوم این بیت کدام است؟\n«${item.textFirst}»`,
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        options: options,
        answer: answer
      });
    }

    return questions;
  }

  private generateTypingQuestions(cards: MemorizeCard[], poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = cards.length >= 3 ? cards : this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      questions.push({
        id: `type-${i}`,
        mode: 'typing',
        cardId: item.id,
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: `مصرع دوم را از حفظ تایپ کنید:\n«${item.textFirst}»`,
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        answer: item.textSecond
      });
    }

    return questions;
  }

  private generateGuessPoetQuestions(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    var poetNamesPool = ['حافظ', 'سعدی', 'مولانا', 'فردوسی', 'خیام', 'عطار', 'نظامی', 'شهریار'];

    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      var poetName = item.poetName || 'حافظ';
      var v1 = item.textFirst || '';
      var v2 = item.textSecond || '';

      var options = [poetName];
      for (var p = 0; p < poetNamesPool.length && options.length < 4; p++) {
        var opt = poetNamesPool[p];
        if (!options.includes(opt)) options.push(opt);
      }
      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `poet-${i}`,
        mode: 'guess_poet',
        poemId: item.poemId,
        poetName: poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: `این بیت سرودهٔ کدام شاعر است؟\n\n«${v1} / ${v2}»`,
        firstMisra: v1,
        secondMisra: v2,
        options: options,
        answer: poetName
      });
    }

    return questions;
  }

  private async generateGuessDeviceQuestions(poems: GanjoorPoem[], count: number): Promise<QuizQuestion[]> {
    var questions: QuizQuestion[] = [];
    var devicesRecord = await db.baseMeta.get('devices');
    var devices: GanjoorLiteraryDevice[] = devicesRecord?.data || [];
    var deviceMap = new Map<number, GanjoorLiteraryDevice>();
    for (var d = 0; d < devices.length; d++) {
      deviceMap.set(devices[d].Id, devices[d]);
    }

    // جست‌وجوی اشعار دارای برچسب آرایه
    var taggedPoems = poems.filter(function (p) {
      return p.LiteraryTags && p.LiteraryTags.length > 0;
    });

    for (var i = 0; i < Math.min(count, taggedPoems.length); i++) {
      var poem = taggedPoems[i];
      var tag = poem.LiteraryTags![0];
      var device = deviceMap.get(tag.DeviceId);
      var deviceName = device?.Name || 'تشبیه';

      var coupletIndex = tag.CoupletIndex;
      var verses = poem.Verses.filter(function (v) {
        return v.CoupletIndex === coupletIndex;
      });
      var coupletText = verses.map(function (v) { return v.Text; }).join(' / ');

      var options = [deviceName];
      for (var k = 0; k < devices.length && options.length < 4; k++) {
        var dev = devices[k];
        if (!options.includes(dev.Name)) options.push(dev.Name);
      }
      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `device-${i}`,
        mode: 'guess_device',
        poemId: poem.Id,
        poetName: poem.FullTitle?.split('»')?.[0]?.trim() || '',
        poemTitle: poem.Title,
        coupletIndex: coupletIndex,
        prompt: `در بیت زیر کدام آرایهٔ ادبی به کار رفته است؟\n\n«${coupletText}»`,
        fullCouplet: coupletText,
        literaryDeviceName: deviceName,
        literaryExplanation: device?.Definition,
        options: options,
        answer: deviceName
      });
    }

    return questions;
  }

  private generateWordHidingQuestions(cards: MemorizeCard[], poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = cards.length >= 3 ? cards : this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      questions.push({
        id: `hiding-${i}`,
        mode: 'word_hiding',
        cardId: item.id,
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: 'تمرین محوشدن تدریجی کلمات برای مرور در ذهن:',
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        answer: `${item.textFirst} * ${item.textSecond}`
      });
    }

    return questions;
  }

  private generateGuessMetreQuestions(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var namedMetresPool = [
      { name: 'متقارب مثمن محذوف (وزن شاهنامه و بوستان)', rhythm: 'فعولن فعولن فعولن فعل' },
      { name: 'هزج مسدس محذوف (وزن دوبیتی و فهلویات)', rhythm: 'مفاعیلن مفاعیلن فعولن' },
      { name: 'رمل مسدس محذوف (وزن مثنوی معنوی)', rhythm: 'فاعلاتن فاعلاتن فاعلن' },
      { name: 'مجتث مثمن مخبون محذوف (غزلیات حافظ و سعدی)', rhythm: 'مفاعلن فعلاتن مفاعلن فعلن' },
      { name: 'هزج مسدس مقصور (وزن خسرو و شیرین)', rhythm: 'مفاعیلن مفاعیلن مفاعیل' },
      { name: 'رجز مثمن مطوی (دیوان شمس مولانا)', rhythm: 'مفتعلن مفتعلن مفتعلن مفتعلن' },
      { name: 'رمل مثمن مخبون محذوف', rhythm: 'فاعلاتن فعلاتن فعلاتن فعلن' },
      { name: 'مضارع مثمن اخرب مکفوف محذوف', rhythm: 'مفعول فاعلات مفاعیل فاعلن' }
    ];

    var pool = this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      // انتخاب تصادفی یک وزن نام‌دار برای سوال یا از متادیتای شعر
      var targetMetre = namedMetresPool[i % namedMetresPool.length];
      var answer = `${targetMetre.name} [${targetMetre.rhythm}]`;

      var options = [answer];
      for (var m = 0; m < namedMetresPool.length && options.length < 4; m++) {
        var opt = `${namedMetresPool[m].name} [${namedMetresPool[m].rhythm}]`;
        if (!options.includes(opt)) options.push(opt);
      }
      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `metre-${i}`,
        mode: 'guess_metre',
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: `این بیت در چه وزنی سروده شده است؟\n\n«${item.textFirst} / ${item.textSecond}»`,
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        options: options,
        answer: answer
      });
    }

    return questions;
  }

  private generateNextCoupletQuestions(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      var nextIndex = (i + 1) % shuffled.length;
      var nextCouplet = shuffled[nextIndex];
      var answer = `${nextCouplet.textFirst} / ${nextCouplet.textSecond}`;

      var options = [answer];
      for (var j = 0; j < shuffled.length && options.length < 4; j++) {
        var other = shuffled[j];
        var opt = `${other.textFirst} / ${other.textSecond}`;
        if (!options.includes(opt) && opt !== `${item.textFirst} / ${item.textSecond}`) {
          options.push(opt);
        }
      }
      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `next-${i}`,
        mode: 'next_couplet',
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: `بیت بعدی این شعر کدام است؟\n\n«${item.textFirst} / ${item.textSecond}»`,
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        options: options,
        answer: answer
      });
    }

    return questions;
  }

  private generateRhymeMatchQuestions(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var questions: QuizQuestion[] = [];
    var pool = this.convertPoemsToCardPool(poems);
    if (!pool.length) return [];

    var shuffled = [...pool].sort(function () { return 0.5 - Math.random(); });
    for (var i = 0; i < Math.min(count, shuffled.length); i++) {
      var item = shuffled[i];
      // استخراج حروف پایانی مصرع دوم به عنوان نشانه قافیه
      var lastWord = item.textSecond.trim().replace(/[.,،؛:!؟?]/g, '').split(/\s+/).pop() || '';
      var rhymeEnding = lastWord.slice(-2);

      // بیت هم‌قافیه (دارای همان هجاهای پایانی) یا بیت بعدی همان شاعر
      var answerItem = shuffled[(i + 1) % shuffled.length];
      var answer = `${answerItem.textFirst} / ${answerItem.textSecond}`;

      var options = [answer];
      for (var j = 0; j < shuffled.length && options.length < 4; j++) {
        var other = shuffled[j];
        var opt = `${other.textFirst} / ${other.textSecond}`;
        if (!options.includes(opt) && opt !== `${item.textFirst} / ${item.textSecond}`) {
          options.push(opt);
        }
      }
      options.sort(function () { return 0.5 - Math.random(); });

      questions.push({
        id: `rhyme-${i}`,
        mode: 'rhyme_match',
        poemId: item.poemId,
        poetName: item.poetName,
        poemTitle: item.poemTitle,
        coupletIndex: item.coupletIndex,
        prompt: `کدام بیت با بیت زیر هم‌قافیه است (قافیه: «${rhymeEnding}»)?\n\n«${item.textFirst} / ${item.textSecond}»`,
        firstMisra: item.textFirst,
        secondMisra: item.textSecond,
        options: options,
        answer: answer
      });
    }

    return questions;
  }

  /**
   * ارزیابی پاسخ کاربر با نرمال‌سازی و انطباق فازی
   */
  evaluateAnswer(question: QuizQuestion, userAnswer: string): boolean {
    if (question.mode === 'typing') {
      return fuzzyMatch(userAnswer, question.answer, 0.82);
    }
    return normalizePersian(userAnswer, true) === normalizePersian(question.answer, true);
  }

  private convertPoemsToCardPool(poems: GanjoorPoem[]): MemorizeCard[] {
    var cards: MemorizeCard[] = [];
    for (var i = 0; i < poems.length; i++) {
      var p = poems[i];
      if (p.Verses && p.Verses.length >= 2) {
        cards.push({
          deckId: 0,
          poemId: p.Id,
          coupletIndex: 0,
          poemTitle: p.Title,
          poetName: p.FullTitle?.split('»')?.[0]?.trim() || '',
          textFirst: p.Verses[0]?.Text || '',
          textSecond: p.Verses[1]?.Text || '',
          status: 'new',
          repCount: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          dueDate: new Date().toISOString().split('T')[0]
        });
      }
    }

    // در صورتی که دیتابیس خالی باشد، یک مجموعه نمونه از شاهکارهای ادبیات فراهم کن
    if (cards.length === 0) {
      var sampleVerses = [
        { poet: 'حافظ', title: 'غزل ۱', v1: 'الا یا ایها الساقی ادر کأسا و ناولها', v2: 'که عشق آسان نمود اول ولی افتاد مشکل‌ها' },
        { poet: 'سعدی', title: 'گلستان', v1: 'بنی آدم اعضای یکدیگرند', v2: 'که در آفرینش ز یک گوهرند' },
        { poet: 'مولانا', title: 'مثنوی معنوی', v1: 'بشنو این نی چون شکایت می‌کند', v2: 'از جدایی‌ها حکایت می‌کند' },
        { poet: 'فردوسی', title: 'شاهنامه', v1: 'توانا بود هر که دانا بود', v2: 'ز دانش دل پیر برنا بود' },
        { poet: 'حافظ', title: 'غزل ۱۸۴', v1: 'دوش دیدم که ملائک در میخانه زدند', v2: 'گل آدم بسرشتند و به پیمانه زدند' },
        { poet: 'سعدی', title: 'دیوان اشعار', v1: 'تن آدمی شریف است به جان آدمیت', v2: 'نه همین لباس زیباست نشان آدمیت' },
        { poet: 'خیام', title: 'رباعیات', v1: 'ابر آمد و زار بر سر سبزه گریست', v2: 'بی بادهٔ گلرنگ نمی‌شاید زیست' },
        { poet: 'نظامی', title: 'مخزن‌الاسرار', v1: 'ای نام تو بهترین سرآغاز', v2: 'بی‌نام تو نامه کی کنم باز' }
      ];

      for (var s = 0; s < sampleVerses.length; s++) {
        var sv = sampleVerses[s];
        cards.push({
          deckId: 0,
          poemId: 1000 + s,
          coupletIndex: 0,
          poemTitle: sv.title,
          poetName: sv.poet,
          textFirst: sv.v1,
          textSecond: sv.v2,
          status: 'new',
          repCount: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          dueDate: new Date().toISOString().split('T')[0]
        });
      }
    }

    return cards;
  }
}

export const quizService = new QuizService();
