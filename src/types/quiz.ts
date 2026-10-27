export type QuizMode =
  | 'cloze'
  | 'reorder'
  | 'multiple_choice'
  | 'typing'
  | 'guess_poet'
  | 'guess_device'
  | 'word_hiding';

export interface QuizQuestion {
  id: string;
  mode: QuizMode;
  cardId?: number;
  poemId: number;
  poetName: string;
  poemTitle: string;
  coupletIndex: number;
  prompt: string;
  firstMisra?: string;
  secondMisra?: string;
  fullCouplet?: string;
  options?: string[];
  answer: string;
  scrambledItems?: string[];
  literaryDeviceName?: string;
  literaryExplanation?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizSessionSummary {
  mode: QuizMode;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  startedAt: string;
  finishedAt: string;
  cardsReviewed: number[];
}
