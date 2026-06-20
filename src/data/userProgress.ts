import { UserProgress, Achievement } from '@/types';

export const initialUserProgress: UserProgress = {
  checkInDays: 3,
  continuousDays: 3,
  totalExercises: 5,
  averageScore: 85,
  unlockedCategories: ['basic', 'dense'],
  achievements: ['first-checkin', 'three-days'],
  checkInHistory: ['2026-06-18', '2026-06-19', '2026-06-20']
};

export const achievementsList: Achievement[] = [
  {
    id: 'first-checkin',
    name: '初次见面',
    description: '完成首次打卡',
    icon: '🌸',
    unlocked: true,
    progress: 1,
    target: 1
  },
  {
    id: 'three-days',
    name: '三天坚持',
    description: '连续打卡3天',
    icon: '⭐',
    unlocked: true,
    progress: 3,
    target: 3
  },
  {
    id: 'seven-days',
    name: '一周达人',
    description: '连续打卡7天',
    icon: '🏆',
    unlocked: false,
    progress: 3,
    target: 7
  },
  {
    id: 'perfect-score',
    name: '完美嵌字',
    description: '获得一次满分',
    icon: '💯',
    unlocked: false,
    progress: 0,
    target: 1
  },
  {
    id: 'ten-exercises',
    name: '练习狂魔',
    description: '完成10次练习',
    icon: '📚',
    unlocked: false,
    progress: 5,
    target: 10
  },
  {
    id: 'all-categories',
    name: '全能选手',
    description: '解锁所有题型',
    icon: '🎯',
    unlocked: false,
    progress: 2,
    target: 4
  }
];

export const categoryNames: Record<string, string> = {
  basic: '基础练习',
  dense: '密集对白',
  'cross-panel': '跨格独白',
  handwritten: '手写拟声'
};

export const difficultyNames: Record<string, string> = {
  easy: '入门',
  medium: '进阶',
  hard: '挑战'
};

export const difficultyColors: Record<string, string> = {
  easy: '#00B894',
  medium: '#FDCB6E',
  hard: '#FF7675'
};
