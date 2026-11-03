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
    init,
    loadDecks,
    selectDeck,
    createDeck,
    deleteDeck,
    loadCards,
    loadDueCards,
    findCard,
    addCardToDeck,
    deleteCard,
    clearDeck,
    reviewCard,
    reviewCardById
  };
});
