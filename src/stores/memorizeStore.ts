import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db/GhazalDB';
import { spacedRepetitionService, type ReviewGrade } from '../services/SpacedRepetitionService';
import type { MemorizeDeck, MemorizeCard } from '../types/user';
import { notificationService } from '../services/NotificationService';

export const useMemorizeStore = defineStore('memorize', () => {
  var decks = ref<MemorizeDeck[]>([]);
  var activeDeckId = ref<number | null>(null);
  var cards = ref<MemorizeCard[]>([]);
  var dueCards = ref<MemorizeCard[]>([]);
  var isLoading = ref<boolean>(false);

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
    } finally {
      isLoading.value = false;
    }
  }

  async function loadDecks() {
    decks.value = await db.memorizeDecks.toArray();
    if (decks.value.length === 0) {
      // ایجاد دسته پیش‌فرض اولیه
      var defaultId = await db.memorizeDecks.add({
        title: 'فهرست اصلی حفظ',
        color: '#b87c2c',
        createdAt: new Date().toISOString()
      });
      decks.value = await db.memorizeDecks.toArray();
      activeDeckId.value = defaultId;
    } else if (activeDeckId.value === null) {
      activeDeckId.value = decks.value[0].id || null;
    }
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
    await db.memorizeCards.where('deckId').equals(deckId).delete();
    await db.memorizeDecks.delete(deckId);
    await loadDecks();
    if (activeDeckId.value === deckId) {
      activeDeckId.value = decks.value[0]?.id || null;
    }
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
    dueCards.value = await spacedRepetitionService.getDueCards(activeDeckId.value || undefined);
    // در صورت وجود کارت سررسید، اعلان ارسال کن
    if (dueCards.value.length > 0) {
      notificationService.sendReviewReminder(dueCards.value.length);
    }
  }

  async function addCardToDeck(params: {
    deckId?: number;
    poemId: number;
    coupletIndex: number;
    poemTitle: string;
    poetName: string;
    textFirst: string;
    textSecond: string;
  }): Promise<void> {
    var targetDeckId = params.deckId || activeDeckId.value || decks.value[0]?.id || 1;

    // بررسی عدم تکرار
    var existing = await db.memorizeCards
      .where('poemId')
      .equals(params.poemId)
      .and(function (c) {
        return c.coupletIndex === params.coupletIndex && c.deckId === targetDeckId;
      })
      .first();

    if (existing) return;

    var todayStr = new Date().toISOString().split('T')[0];
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
      dueDate: todayStr
    });

    await loadCards();
    await loadDueCards();
  }

  async function reviewCard(card: MemorizeCard, grade: ReviewGrade) {
    await spacedRepetitionService.reviewCard(card, grade);
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
    createDeck,
    deleteDeck,
    loadCards,
    loadDueCards,
    addCardToDeck,
    reviewCard
  };
});
