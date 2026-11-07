import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db/GhazalDB';
import { spacedRepetitionService, type ReviewGrade } from '../services/SpacedRepetitionService';
import type { MemorizeDeck, MemorizeCard } from '../types/user';
import { notificationService } from '../services/NotificationService';
import { toLocalDateString } from '../utils/dateUtils';

export type AddCardResult = 'added' | 'exists';

export interface AddCardParams {
  deckId?: number;
  poemId: number;
  coupletIndex: number;
  poemTitle: string;
  poetName: string;
  textFirst: string;
  textSecond: string;
}

export const useMemorizeStore = defineStore('memorize', () => {
  var decks = ref<MemorizeDeck[]>([]);
  var activeDeckId = ref<number | null>(null);
  var cards = ref<MemorizeCard[]>([]);
  var dueCards = ref<MemorizeCard[]>([]);
  var isLoading = ref<boolean>(false);
  var hasNotifiedThisSession = false;

  var totalCardsCount = computed(function () {
    return cards.value.length;
  });

  var masteredCardsCount = computed(function () {
    return cards.value.filter(function (c) {
      return c.status === 'mastered';
    }).length;
  });

  var learningCardsCount = computed(function () {
    return cards.value.filter(function (c) {
      return c.status === 'learning' || c.status === 'new';
    }).length;
  });

  var reviewCardsCount = computed(function () {
    return cards.value.filter(function (c) {
      return c.status === 'review';
    }).length;
  });

  var memorizedCoupletKeys = computed(function () {
    var set = new Set<string>();
    for (var i = 0; i < cards.value.length; i++) {
      var c = cards.value[i];
      set.add(`${c.poemId}_${c.coupletIndex}`);
    }
    return set;
  });

  var memorizedPoemIds = computed(function () {
    var set = new Set<number>();
    for (var i = 0; i < cards.value.length; i++) {
      set.add(cards.value[i].poemId);
    }
    return set;
  });

  var groupedByPoem = computed(function () {
    var map = new Map<number, { poemId: number; poemTitle: string; poetName: string; cards: MemorizeCard[] }>();
    for (var i = 0; i < cards.value.length; i++) {
      var c = cards.value[i];
      var group = map.get(c.poemId);
      if (!group) {
        group = {
          poemId: c.poemId,
          poemTitle: c.poemTitle,
          poetName: c.poetName,
          cards: []
        };
        map.set(c.poemId, group);
      }
      group.cards.push(c);
    }
    return Array.from(map.values()).sort(function (a, b) {
      return b.cards.length - a.cards.length;
    });
  });

  async function init() {
    isLoading.value = true;
    try {
      await loadDecks();
      await loadCards();
      await loadDueCards();
      notifyDueCardsOnce();
    } finally {
      isLoading.value = false;
    }
  }

  function notifyDueCardsOnce() {
    if (hasNotifiedThisSession || dueCards.value.length === 0) return;
    hasNotifiedThisSession = true;
    notificationService.sendReviewReminder(dueCards.value.length);
  }

  async function loadDecks() {
    decks.value = await db.memorizeDecks.toArray();
    if (decks.value.length === 0) {
      var defaultId = await db.memorizeDecks.add({
        title: 'فهرست اصلی حفظ',
        color: '#b87c2c',
        createdAt: new Date().toISOString()
      });
      decks.value = await db.memorizeDecks.toArray();
      activeDeckId.value = defaultId;
      return;
    }

    var activeStillExists = decks.value.some(function (d) {
      return d.id === activeDeckId.value;
    });
    if (!activeStillExists) {
      activeDeckId.value = decks.value[0].id ?? null;
    }
  }

  async function selectDeck(deckId: number) {
    activeDeckId.value = deckId;
    await loadCards();
    await loadDueCards();
  }

  async function createDeck(title: string, color = '#b87c2c'): Promise<number> {
    var id = await db.memorizeDecks.add({
      title: title,
      color: color,
      createdAt: new Date().toISOString()
    });
    await loadDecks();
    return id;
  }

  async function deleteDeck(deckId: number) {
    await db.transaction('rw', db.memorizeCards, db.memorizeDecks, async function () {
      await db.memorizeCards.where('deckId').equals(deckId).delete();
      await db.memorizeDecks.delete(deckId);
    });
    await loadDecks();
    await loadCards();
    await loadDueCards();
  }

  async function loadCards() {
    if (activeDeckId.value !== null) {
      cards.value = await db.memorizeCards.where('deckId').equals(activeDeckId.value).toArray();
    } else {
      cards.value = await db.memorizeCards.toArray();
    }
  }

  async function loadDueCards() {
    dueCards.value = await spacedRepetitionService.getDueCards(activeDeckId.value ?? undefined);
  }

  async function findCard(poemId: number, coupletIndex: number, deckId?: number): Promise<MemorizeCard | undefined> {
    var targetDeckId = deckId ?? activeDeckId.value;
    return db.memorizeCards
      .where('poemId')
      .equals(poemId)
      .and(function (c) {
        return c.coupletIndex === coupletIndex && (targetDeckId === null || c.deckId === targetDeckId);
      })
      .first();
  }

  async function addCardToDeck(params: AddCardParams): Promise<AddCardResult> {
    if (decks.value.length === 0) {
      await loadDecks();
    }

    var targetDeckId = params.deckId ?? activeDeckId.value ?? decks.value[0]?.id;
    if (targetDeckId === undefined || targetDeckId === null) {
      throw new Error('هیچ فهرست حفظی برای افزودن بیت وجود ندارد.');
    }

    var existing = await findCard(params.poemId, params.coupletIndex, targetDeckId);
    if (existing) return 'exists';

    await db.memorizeCards.add({
      deckId: targetDeckId,
      poemId: params.poemId,
      coupletIndex: params.coupletIndex,
      poemTitle: params.poemTitle,
      poetName: params.poetName,
      textFirst: params.textFirst,
      textSecond: params.textSecond,
      status: 'new',
      repCount: 0,
      intervalDays: 1,
      easeFactor: 2.5,
      dueDate: toLocalDateString()
    });

    await loadCards();
    await loadDueCards();
    return 'added';
  }

  async function deleteCard(cardId: number) {
    await db.memorizeCards.delete(cardId);
    await loadCards();
    await loadDueCards();
  }

  async function clearDeck(deckId: number) {
    await db.memorizeCards.where('deckId').equals(deckId).delete();
    await loadCards();
    await loadDueCards();
  }

  async function reviewCard(card: MemorizeCard, grade: ReviewGrade) {
    await spacedRepetitionService.reviewCard(card, grade);
    await loadCards();
    await loadDueCards();
  }

  async function reviewCardById(cardId: number, grade: ReviewGrade) {
    await spacedRepetitionService.reviewCardById(cardId, grade);
    await loadCards();
    await loadDueCards();
  }

  function isCoupletMemorized(poemId: number, coupletIndex: number): boolean {
    return memorizedCoupletKeys.value.has(`${poemId}_${coupletIndex}`);
  }

  function isPoemMemorized(poemId: number): boolean {
    return memorizedPoemIds.value.has(poemId);
  }

  async function toggleCoupletMemorize(params: AddCardParams): Promise<'added' | 'removed'> {
    var targetDeckId = params.deckId ?? activeDeckId.value ?? decks.value[0]?.id;
    var existing = await findCard(params.poemId, params.coupletIndex, targetDeckId);
    if (existing && existing.id !== undefined) {
      await deleteCard(existing.id);
      return 'removed';
    } else {
      await addCardToDeck(params);
      return 'added';
    }
  }

  async function deletePoemCards(poemId: number, deckId?: number): Promise<number> {
    var targetDeckId = deckId ?? activeDeckId.value;
    var cardsToDelete = await db.memorizeCards
      .where('poemId')
      .equals(poemId)
      .and(function (c) {
        return targetDeckId === null || targetDeckId === undefined || c.deckId === targetDeckId;
      })
      .toArray();

    var count = cardsToDelete.length;
    var ids = cardsToDelete.map(function (c) { return c.id!; }).filter(Boolean);
    if (ids.length > 0) {
      await db.memorizeCards.bulkDelete(ids);
      await loadCards();
      await loadDueCards();
    }
    return count;
  }

  async function addPoemCards(cardParamsList: AddCardParams[]): Promise<{ added: number; existed: number }> {
    if (decks.value.length === 0) {
      await loadDecks();
    }
    var targetDeckId = activeDeckId.value ?? decks.value[0]?.id;
    if (targetDeckId === undefined || targetDeckId === null) {
      throw new Error('هیچ فهرست حفظی برای افزودن شعر وجود ندارد.');
    }

    var added = 0;
    var existed = 0;
    var newCards: any[] = [];
    var today = toLocalDateString();

    for (var i = 0; i < cardParamsList.length; i++) {
      var p = cardParamsList[i];
      var key = `${p.poemId}_${p.coupletIndex}`;
      if (memorizedCoupletKeys.value.has(key)) {
        existed++;
      } else {
        newCards.push({
          deckId: targetDeckId,
          poemId: p.poemId,
          coupletIndex: p.coupletIndex,
          poemTitle: p.poemTitle,
          poetName: p.poetName,
          textFirst: p.textFirst,
          textSecond: p.textSecond,
          status: 'new',
          repCount: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          dueDate: today
        });
        added++;
      }
    }

    if (newCards.length > 0) {
      await db.memorizeCards.bulkAdd(newCards);
      await loadCards();
      await loadDueCards();
    }

    return { added: added, existed: existed };
  }

  return {
    decks,
    activeDeckId,
    cards,
    dueCards,
    isLoading,
    totalCardsCount,
    masteredCardsCount,
    learningCardsCount,
    reviewCardsCount,
    memorizedCoupletKeys,
    memorizedPoemIds,
    groupedByPoem,
    init,
    loadDecks,
    selectDeck,
    createDeck,
    deleteDeck,
    loadCards,
    loadDueCards,
    findCard,
    isCoupletMemorized,
    isPoemMemorized,
    toggleCoupletMemorize,
    addCardToDeck,
    deleteCard,
    deletePoemCards,
    addPoemCards,
    clearDeck,
    reviewCard,
    reviewCardById
  };
});
