import { db } from '../db/GhazalDB';
import { fuzzyMatch, normalizePersian } from '../utils/persianNormalizer';
import { groupVersesIntoCouplets, getPoemMetreRhythm } from '../utils/formatters';
import { randomInt, shuffle } from '../utils/random';
import { spacedRepetitionService } from './SpacedRepetitionService';
import type { QuizMode, QuizQuestion } from '../types/quiz';
import type { MemorizeCard } from '../types/user';
import type { GanjoorPoem, GanjoorLiteraryDevice } from '../types/ganjoor';

interface CoupletItem {
  cardId?: number;
  poemId: number;
  poetName: string;
  poemTitle: string;
  coupletIndex: number;
  textFirst: string;
  textSecond: string;
}

var OPTION_COUNT = 4;
var POEM_SAMPLE_SIZE = 80;
var POEM_SAMPLE_CHUNKS = 4;
var MIN_DISTRACTOR_POOL = 8;
var PUNCTUATION = /[.,،؛:!؟?«»()\[\]]/g;
var FALLBACK_WORDS = ['دل', 'عشق', 'یار', 'جان', 'چشم', 'گل', 'می', 'ساقی', 'جام', 'شب'];
var FALLBACK_POETS = ['حافظ', 'سعدی', 'مولانا', 'فردوسی', 'خیام', 'عطار', 'نظامی', 'شهریار'];
var CARD_MODES: QuizMode[] = ['cloze', 'reorder', 'multiple_choice', 'typing', 'word_hiding'];

export class QuizService {
  /**
   * تولید سؤالات آزمون. حالت‌های مبتنی بر کارت از فهرست حفظ (یا فقط کارت‌های سررسید) ساخته می‌شوند
   * و در نبود کارت، از اشعار دانلودشده نمونه‌گیری می‌شود.
   */
  async generateQuestions(mode: QuizMode, count = 10, deckId?: number, dueOnly = false): Promise<QuizQuestion[]> {
    if (CARD_MODES.indexOf(mode) !== -1) {
      return this.generateCardQuestions(mode, count, deckId, dueOnly);
    }
    return this.generatePoemQuestions(mode, count);
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

  // ───────────── حالت‌های مبتنی بر کارت ─────────────

  private async generateCardQuestions(mode: QuizMode, count: number, deckId?: number, dueOnly = false): Promise<QuizQuestion[]> {
    var items = await this.loadCardItems(deckId, dueOnly);
    if (items.length === 0 && !dueOnly) {
      items = this.poemsToCouplets(await this.samplePoems(POEM_SAMPLE_SIZE));
    }
    if (items.length === 0) return [];

    var pool = items;
    if (items.length < MIN_DISTRACTOR_POOL && mode !== 'typing' && mode !== 'word_hiding' && mode !== 'reorder') {
      pool = items.concat(this.poemsToCouplets(await this.samplePoems(30)));
    }

    var vocabulary = mode === 'cloze' ? this.buildVocabulary(pool) : [];
    var selected = shuffle(items).slice(0, count);
    var questions: QuizQuestion[] = [];

    for (var i = 0; i < selected.length; i++) {
      var id = `${mode}-${questions.length}`;
      var question = this.buildCardQuestion(mode, id, selected[i], pool, vocabulary);
      if (question) questions.push(question);
    }
    return questions;
  }

  private buildCardQuestion(mode: QuizMode, id: string, item: CoupletItem, pool: CoupletItem[], vocabulary: string[]): QuizQuestion | null {
    switch (mode) {
      case 'cloze':
        return this.buildCloze(id, item, vocabulary);
      case 'reorder':
        return this.buildReorder(id, item);
      case 'multiple_choice':
        return this.buildMultipleChoice(id, item, pool);
      case 'typing':
        return this.buildTyping(id, item);
      case 'word_hiding':
        return this.buildWordHiding(id, item);
      default:
        return null;
    }
  }

  private baseQuestion(id: string, mode: QuizMode, item: CoupletItem): QuizQuestion {
    return {
      id: id,
      mode: mode,
      cardId: item.cardId,
      poemId: item.poemId,
      poetName: item.poetName,
      poemTitle: item.poemTitle,
      coupletIndex: item.coupletIndex,
      prompt: '',
      firstMisra: item.textFirst,
      secondMisra: item.textSecond,
      answer: ''
    };
  }

  private buildCloze(id: string, item: CoupletItem, vocabulary: string[]): QuizQuestion | null {
    var useFirst = Math.random() < 0.5;
    var misra = useFirst ? item.textFirst : item.textSecond;
    var words = misra.split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      useFirst = !useFirst;
      misra = useFirst ? item.textFirst : item.textSecond;
      words = misra.split(/\s+/).filter(Boolean);
      if (words.length < 3) return null;
    }

    var candidates: number[] = [];
    for (var w = 0; w < words.length; w++) {
      if (this.cleanWord(words[w]).length >= 2) candidates.push(w);
    }
    if (candidates.length === 0) return null;

    var targetIndex = candidates[randomInt(candidates.length)];
    var answer = this.cleanWord(words[targetIndex]);
    var blanked = words.map(function (word, idx) {
      return idx === targetIndex ? '(___)' : word;
    }).join(' ');

    var options = [answer].concat(this.pickWordDistractors(answer, vocabulary));
    var question = this.baseQuestion(id, 'cloze', item);
    question.prompt = useFirst ? `${blanked} / ${item.textSecond}` : `${item.textFirst} / ${blanked}`;
    question.options = shuffle(options);
    question.answer = answer;
    return question;
  }

  private buildReorder(id: string, item: CoupletItem): QuizQuestion | null {
    var words = `${item.textFirst} ${item.textSecond}`.split(/\s+/).filter(Boolean);
    if (words.length < 2) return null;

    var scrambled = shuffle(words);
    for (var attempt = 0; attempt < 5 && scrambled.join(' ') === words.join(' '); attempt++) {
      scrambled = shuffle(words);
    }

    var question = this.baseQuestion(id, 'reorder', item);
    question.prompt = 'کلمات بیت زیر را به ترتیب صحیح مرتب کنید:';
    question.fullCouplet = `${item.textFirst} * ${item.textSecond}`;
    question.scrambledItems = scrambled;
    question.answer = words.join(' ');
    return question;
  }

  private buildMultipleChoice(id: string, item: CoupletItem, pool: CoupletItem[]): QuizQuestion | null {
    var seen = new Set<string>([normalizePersian(item.textSecond, true)]);
    var distractors: string[] = [];
    var candidates = shuffle(pool);

    for (var i = 0; i < candidates.length && distractors.length < OPTION_COUNT - 1; i++) {
      var text = candidates[i].textSecond;
      var key = normalizePersian(text, true);
      if (!text || seen.has(key)) continue;
      seen.add(key);
      distractors.push(text);
    }
    if (distractors.length < OPTION_COUNT - 1) return null;

    var question = this.baseQuestion(id, 'multiple_choice', item);
    question.prompt = `مصرع دوم این بیت کدام است؟\n«${item.textFirst}»`;
    question.options = shuffle([item.textSecond].concat(distractors));
    question.answer = item.textSecond;
    return question;
  }

  private buildTyping(id: string, item: CoupletItem): QuizQuestion {
    var question = this.baseQuestion(id, 'typing', item);
    question.prompt = `مصرع دوم را از حفظ تایپ کنید:\n«${item.textFirst}»`;
    question.answer = item.textSecond;
    return question;
  }

  private buildWordHiding(id: string, item: CoupletItem): QuizQuestion {
    var question = this.baseQuestion(id, 'word_hiding', item);
    question.prompt = 'تمرین محوشدن تدریجی کلمات برای مرور در ذهن:';
    question.answer = `${item.textFirst} * ${item.textSecond}`;
    return question;
  }

  // ───────────── حالت‌های مبتنی بر شعر ─────────────

  private async generatePoemQuestions(mode: QuizMode, count: number): Promise<QuizQuestion[]> {
    if (mode === 'guess_device') {
      return this.generateGuessDevice(count);
    }

    var poems = await this.samplePoems(POEM_SAMPLE_SIZE);
    if (poems.length === 0) return [];

    switch (mode) {
      case 'guess_poet':
        return this.generateGuessPoet(poems, count);
      case 'guess_metre':
        return this.generateGuessMetre(poems, count);
      case 'next_couplet':
        return this.generateNextCouplet(poems, count);
      case 'rhyme_match':
        return this.generateRhymeMatch(poems, count);
      default:
        return [];
    }
  }

  private generateGuessPoet(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var poetNames = this.uniqueStrings(poems.map((p) => this.poetNameOf(p)));
    var items = shuffle(this.poemsToCouplets(poems));
    var questions: QuizQuestion[] = [];

    for (var i = 0; i < items.length && questions.length < count; i++) {
      var item = items[i];
      if (!item.poetName) continue;

      var others = shuffle(poetNames.concat(FALLBACK_POETS)).filter(function (name) {
        return name !== item.poetName;
      });
      var distractors = this.uniqueStrings(others).slice(0, OPTION_COUNT - 1);

      var question = this.baseQuestion(`guess_poet-${questions.length}`, 'guess_poet', item);
      question.cardId = undefined;
      question.prompt = `این بیت سرودهٔ کدام شاعر است؟\n\n«${item.textFirst} / ${item.textSecond}»`;
      question.options = shuffle([item.poetName].concat(distractors));
      question.answer = item.poetName;
      questions.push(question);
    }
    return questions;
  }

  private generateGuessMetre(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var withRhythm = poems.filter((p) => getPoemMetreRhythm(p) !== '');
    var rhythms = this.uniqueStrings(withRhythm.map((p) => getPoemMetreRhythm(p)));
    if (rhythms.length < 2) return [];

    var questions: QuizQuestion[] = [];
    var shuffled = shuffle(withRhythm);

    for (var i = 0; i < shuffled.length && questions.length < count; i++) {
      var poem = shuffled[i];
      var couplet = this.randomCoupletOf(poem);
      if (!couplet) continue;

      var answer = getPoemMetreRhythm(poem);
      var distractors = shuffle(rhythms).filter(function (r) {
        return r !== answer;
      }).slice(0, OPTION_COUNT - 1);

      var question = this.baseQuestion(`guess_metre-${questions.length}`, 'guess_metre', couplet);
      question.cardId = undefined;
      question.prompt = `این بیت در چه وزنی سروده شده است؟\n\n«${couplet.textFirst} / ${couplet.textSecond}»`;
      question.options = shuffle([answer].concat(distractors));
      question.answer = answer;
      questions.push(question);
    }
    return questions;
  }

  private generateNextCouplet(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var allItems = this.poemsToCouplets(poems);
    var questions: QuizQuestion[] = [];
    var shuffled = shuffle(poems);

    for (var p = 0; p < shuffled.length && questions.length < count; p++) {
      var couplets = this.poemsToCouplets([shuffled[p]]);
      if (couplets.length < 3) continue;

      var index = randomInt(couplets.length - 1);
      var current = couplets[index];
      var next = couplets[index + 1];
      var answer = this.formatCouplet(next);

      var sameLine = couplets.filter(function (_c, idx) {
        return idx !== index && idx !== index + 1;
      });
      var distractors = this.pickDistinctCouplets(shuffle(sameLine).concat(shuffle(allItems)), [current, next], OPTION_COUNT - 1);
      if (distractors.length < OPTION_COUNT - 1) continue;

      var question = this.baseQuestion(`next_couplet-${questions.length}`, 'next_couplet', current);
      question.cardId = undefined;
      question.prompt = `بیت بعدی این شعر کدام است؟\n\n«${this.formatCouplet(current)}»`;
      question.options = shuffle([answer].concat(distractors.map((c) => this.formatCouplet(c))));
      question.answer = answer;
      questions.push(question);
    }
    return questions;
  }

  /**
   * هم‌قافیه بودن با تطبیق حروف پایانی آخرین کلمهٔ مصرع دوم تشخیص داده می‌شود (روش تقریبی)
   */
  private generateRhymeMatch(poems: GanjoorPoem[], count: number): QuizQuestion[] {
    var items = this.poemsToCouplets(poems);
    var groups = new Map<string, CoupletItem[]>();
    for (var i = 0; i < items.length; i++) {
      var key = this.rhymeKey(items[i]);
      if (key.length < 2) continue;
      var group = groups.get(key) || [];
      group.push(items[i]);
      groups.set(key, group);
    }

    var questions: QuizQuestion[] = [];
    var shuffled = shuffle(items);

    for (var j = 0; j < shuffled.length && questions.length < count; j++) {
      var target = shuffled[j];
      var targetKey = this.rhymeKey(target);
      var matches = (groups.get(targetKey) || []).filter((c) => c !== target);
      if (targetKey.length < 2 || matches.length === 0) continue;

      var others = shuffled.filter((c) => this.rhymeKey(c) !== targetKey);
      var distractors = this.pickDistinctCouplets(others, [target], OPTION_COUNT - 1);
      if (distractors.length < OPTION_COUNT - 1) continue;

      var answer = this.formatCouplet(matches[randomInt(matches.length)]);
      var question = this.baseQuestion(`rhyme_match-${questions.length}`, 'rhyme_match', target);
      question.cardId = undefined;
      question.prompt = `کدام بیت با بیت زیر هم‌قافیه است (پایان: «${targetKey}»)؟\n\n«${this.formatCouplet(target)}»`;
      question.options = shuffle([answer].concat(distractors.map((c) => this.formatCouplet(c))));
      question.answer = answer;
      questions.push(question);
    }
    return questions;
  }

  private async generateGuessDevice(count: number): Promise<QuizQuestion[]> {
    var record = await db.baseMeta.get('devices');
    var devices: GanjoorLiteraryDevice[] = record?.data || [];
    if (devices.length < 2) return [];

    var deviceMap = new Map<number, GanjoorLiteraryDevice>();
    for (var d = 0; d < devices.length; d++) {
      deviceMap.set(devices[d].Id, devices[d]);
    }

    var tagged = await db.poems
      .filter(function (p) {
        return !!p.LiteraryTags && p.LiteraryTags.length > 0;
      })
      .limit(60)
      .toArray();

    var questions: QuizQuestion[] = [];
    var shuffled = shuffle(tagged);

    for (var i = 0; i < shuffled.length && questions.length < count; i++) {
      var poem = shuffled[i];
      var tags = shuffle(poem.LiteraryTags || []);
      var tag = tags.find(function (t) {
        return deviceMap.has(t.DeviceId);
      });
      if (!tag) continue;

      var pair = groupVersesIntoCouplets(poem.Verses).find(function (c) {
        return c.coupletIndex === tag!.CoupletIndex;
      });
      if (!pair || !pair.rightVerse || !pair.leftVerse) continue;

      var device = deviceMap.get(tag.DeviceId)!;
      var coupletText = `${pair.rightVerse.Text} / ${pair.leftVerse.Text}`;
      var distractors = shuffle(devices).filter(function (dev) {
        return dev.Name !== device.Name;
      }).slice(0, OPTION_COUNT - 1).map(function (dev) {
        return dev.Name;
      });

      questions.push({
        id: `guess_device-${questions.length}`,
        mode: 'guess_device',
        poemId: poem.Id,
        poetName: this.poetNameOf(poem),
        poemTitle: poem.Title,
        coupletIndex: tag.CoupletIndex,
        prompt: `در بیت زیر کدام آرایهٔ ادبی به کار رفته است؟\n\n«${coupletText}»`,
        fullCouplet: coupletText,
        literaryDeviceName: device.Name,
        literaryExplanation: device.Definition,
        options: shuffle([device.Name].concat(distractors)),
        answer: device.Name
      });
    }
    return questions;
  }

  // ───────────── ابزارهای داخلی ─────────────

  private async loadCardItems(deckId?: number, dueOnly = false): Promise<CoupletItem[]> {
    var cards: MemorizeCard[];
    if (dueOnly) {
      cards = await spacedRepetitionService.getDueCards(deckId);
    } else if (deckId !== undefined) {
      cards = await db.memorizeCards.where('deckId').equals(deckId).toArray();
    } else {
      cards = await db.memorizeCards.toArray();
    }

    return cards
      .filter(function (c) {
        return !!c.textFirst && !!c.textSecond;
      })
      .map(function (c) {
        return {
          cardId: c.id,
          poemId: c.poemId,
          poetName: c.poetName,
          poemTitle: c.poemTitle,
          coupletIndex: c.coupletIndex,
          textFirst: c.textFirst,
          textSecond: c.textSecond
        };
      });
  }

  /**
   * نمونه‌گیری تصادفی از چند بازهٔ جدول اشعار به‌جای بارگذاری کل جدول در حافظه
   */
  private async samplePoems(size: number): Promise<GanjoorPoem[]> {
    var total = await db.poems.count();
    if (total === 0) return [];

    var chunkSize = Math.ceil(size / POEM_SAMPLE_CHUNKS);
    var requests: Promise<GanjoorPoem[]>[] = [];
    for (var c = 0; c < POEM_SAMPLE_CHUNKS; c++) {
      var start = randomInt(Math.max(1, total - chunkSize + 1));
      requests.push(db.poems.offset(start).limit(chunkSize).toArray());
    }

    var chunks = await Promise.all(requests);
    var byId = new Map<number, GanjoorPoem>();
    chunks.forEach(function (chunk) {
      chunk.forEach(function (poem) {
        byId.set(poem.Id, poem);
      });
    });
    return Array.from(byId.values());
  }

  private poemsToCouplets(poems: GanjoorPoem[]): CoupletItem[] {
    var items: CoupletItem[] = [];
    for (var i = 0; i < poems.length; i++) {
      var poem = poems[i];
      var pairs = groupVersesIntoCouplets(poem.Verses || []);
      for (var j = 0; j < pairs.length; j++) {
        var pair = pairs[j];
        if (!pair.rightVerse?.Text || !pair.leftVerse?.Text) continue;
        items.push({
          poemId: poem.Id,
          poetName: this.poetNameOf(poem),
          poemTitle: poem.Title,
          coupletIndex: pair.coupletIndex,
          textFirst: pair.rightVerse.Text,
          textSecond: pair.leftVerse.Text
        });
      }
    }
    return items;
  }

  private randomCoupletOf(poem: GanjoorPoem): CoupletItem | null {
    var couplets = this.poemsToCouplets([poem]);
    return couplets.length ? couplets[randomInt(couplets.length)] : null;
  }

  private pickDistinctCouplets(candidates: CoupletItem[], excluded: CoupletItem[], limit: number): CoupletItem[] {
    var seen = new Set<string>(excluded.map((c) => this.formatCouplet(c)));
    var result: CoupletItem[] = [];
    for (var i = 0; i < candidates.length && result.length < limit; i++) {
      var text = this.formatCouplet(candidates[i]);
      if (seen.has(text)) continue;
      seen.add(text);
      result.push(candidates[i]);
    }
    return result;
  }

  private buildVocabulary(items: CoupletItem[]): string[] {
    var words = new Set<string>();
    for (var i = 0; i < items.length; i++) {
      var tokens = `${items[i].textFirst} ${items[i].textSecond}`.split(/\s+/);
      for (var j = 0; j < tokens.length; j++) {
        var word = this.cleanWord(tokens[j]);
        if (word.length >= 2) words.add(word);
      }
    }
    return Array.from(words);
  }

  private pickWordDistractors(answer: string, vocabulary: string[]): string[] {
    var normalizedAnswer = normalizePersian(answer, true);
    var pool = shuffle(vocabulary).filter(function (word) {
      return normalizePersian(word, true) !== normalizedAnswer;
    });

    var similar = pool.filter(function (word) {
      return Math.abs(word.length - answer.length) <= 2;
    });
    var rest = pool.filter(function (word) {
      return similar.indexOf(word) === -1;
    });

    var fallback = FALLBACK_WORDS.filter(function (word) {
      return normalizePersian(word, true) !== normalizedAnswer;
    });

    return this.uniqueStrings(similar.concat(rest, shuffle(fallback))).slice(0, OPTION_COUNT - 1);
  }

  private rhymeKey(item: CoupletItem): string {
    var words = item.textSecond.split(/\s+/).filter(Boolean);
    var last = normalizePersian(this.cleanWord(words[words.length - 1] || ''), true);
    return last.slice(-2);
  }

  private formatCouplet(item: CoupletItem): string {
    return `${item.textFirst} / ${item.textSecond}`;
  }

  private cleanWord(word: string): string {
    return word.replace(PUNCTUATION, '').trim();
  }

  private poetNameOf(poem: GanjoorPoem): string {
    return poem.FullTitle?.split('»')?.[0]?.trim() || '';
  }

  private uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
  }
}

export const quizService = new QuizService();
