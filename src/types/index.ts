export interface Bubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'speech' | 'thought' | 'narration' | 'sound';
  isVertical?: boolean;
  fontSize?: number;
  letterSpacing?: number;
}

export interface DialogueLine {
  id: string;
  text: string;
  originalText?: string;
  targetBubbleId: string;
  mood?: string;
  punctuation?: string[];
}

export interface Exercise {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basic' | 'dense' | 'cross-panel' | 'handwritten';
  imageUrl: string;
  bubbles: Bubble[];
  dialogues: DialogueLine[];
  correctAnswers: {
    dialogueId: string;
    bubbleId: string;
    isVertical: boolean;
    fontSize: number;
    letterSpacing: number;
    lineBreak?: number[];
  }[];
  exampleNotes: {
    dialogueId: string;
    reason: string;
    tips: string;
  }[];
  unlockDays: number;
}

export interface UserAnswer {
  dialogueId: string;
  bubbleId: string;
  x: number;
  y: number;
  isVertical: boolean;
  fontSize: number;
  letterSpacing: number;
}

export interface ScoreItem {
  category: string;
  score: number;
  maxScore: number;
  issues: {
    bubbleId: string;
    message: string;
  }[];
}

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  level: 'excellent' | 'good' | 'improve';
  items: ScoreItem[];
  problemBubbles: string[];
}

export interface UserProgress {
  checkInDays: number;
  continuousDays: number;
  totalExercises: number;
  averageScore: number;
  unlockedCategories: string[];
  achievements: string[];
  checkInHistory: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface PlacedText {
  dialogueId: string;
  bubbleId: string;
  x: number;
  y: number;
  text: string;
  isVertical: boolean;
  fontSize: number;
  letterSpacing: number;
}
