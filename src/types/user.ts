export type PackageStatus = 'ready' | 'downloading' | 'paused' | 'interrupted' | 'error' | 'update_available';

export interface DataPackage {
  id: string; // e.g. "poet:hafez" or "cat:24" or "base:meta"
  type: 'poet' | 'category' | 'base';
  slug: string;
  title: string;
  totalPoems: number;
  downloadedPoems: number;
  sizeBytes: number;
  commitSha: string;
  schemaVersion: number;
  installedAt: string;
  status: PackageStatus;
}

export interface UserBookmark {
  id?: number;
  poemId: number;
  coupletIndex?: number;
  poemTitle: string;
  poetName: string;
  fullUrl: string;
  note?: string;
  createdAt: string;
}

export interface UserHistoryItem {
  id?: number;
  poemId: number;
  poemTitle: string;
  poetName: string;
  fullUrl: string;
  type: 'read' | 'faal';
  viewedAt: string;
  faalNiat?: string;
}

export type CardStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface MemorizeDeck {
  id?: number;
  title: string;
  color?: string;
  createdAt: string;
}

export interface MemorizeCard {
  id?: number;
  deckId: number;
  poemId: number;
  coupletIndex: number;
  poemTitle: string;
  poetName: string;
  textFirst: string;
  textSecond: string;
  status: CardStatus;
  repCount: number;
  intervalDays: number;
  easeFactor: number; // SM-2 default 2.5
  dueDate: string; // YYYY-MM-DD
  lastReviewDate?: string;
}

export interface UserCollectionItem {
  poemId: number;
  coupletIndex?: number;
  poemTitle: string;
  poetName: string;
  fullUrl?: string;
  firstMisra?: string;
  secondMisra?: string;
  verseFirst?: string;
  verseSecond?: string;
  note?: string;
  addedAt?: string;
}

export interface UserCollection {
  id?: number;
  title: string;
  description?: string;
  color?: string;
  items: UserCollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyChallengeRecord {
  id?: number;
  date: string; // YYYY-MM-DD
  poemId: number;
  poetName: string;
  poemTitle: string;
  verseFirst: string;
  verseSecond: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  score: number;
  answeredAt?: string;
}

export interface CachedStatRecord {
  key: string;
  data: any;
  cachedAt: string;
  expiresAt?: string;
}

export interface UserDataBackup {
  version: string;
  dataCommitSha: string;
  exportedAt: string;
  bookmarks: UserBookmark[];
  history: UserHistoryItem[];
  decks: MemorizeDeck[];
  cards: MemorizeCard[];
  collections?: UserCollection[];
  dailyChallenges?: DailyChallengeRecord[];
}