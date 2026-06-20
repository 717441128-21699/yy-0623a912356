import { create } from 'zustand';
import { UserProgress, ScoreResult } from '@/types';
import { initialUserProgress } from '@/data/userProgress';
import dayjs from 'dayjs';
import Taro from '@tarojs/taro';

const STORAGE_KEY_PROGRESS = 'comic_lettering_progress';

const loadProgressFromStorage = (): UserProgress => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY_PROGRESS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          checkInDays: parsed.checkInDays ?? 0,
          continuousDays: parsed.continuousDays ?? 0,
          totalExercises: parsed.totalExercises ?? 0,
          averageScore: parsed.averageScore ?? 0,
          unlockedCategories: Array.isArray(parsed.unlockedCategories) ? parsed.unlockedCategories : ['basic'],
          achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
          checkInHistory: Array.isArray(parsed.checkInHistory) ? parsed.checkInHistory : []
        };
      }
    }
  } catch (e) {
    console.warn('[UserStore] 读取本地存储失败', e);
  }
  return initialUserProgress;
};

const saveProgressToStorage = (progress: UserProgress) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.warn('[UserStore] 保存本地存储失败', e);
  }
};

interface UserState {
  progress: UserProgress;
  todayCheckedIn: boolean;
  currentExerciseId: string | null;
  lastScore: ScoreResult | null;
  checkIn: () => boolean;
  setCurrentExercise: (id: string) => void;
  setLastScore: (score: ScoreResult) => void;
  completeExercise: (score: number) => void;
  isTodayCheckedIn: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  progress: loadProgressFromStorage(),
  todayCheckedIn: false,
  currentExerciseId: null,
  lastScore: null,

  checkIn: () => {
    const state = get();
    const today = dayjs().format('YYYY-MM-DD');

    if (state.progress.checkInHistory.includes(today)) {
      console.log('[UserStore] 今日已打卡');
      return false;
    }

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const isContinuous = state.progress.checkInHistory.includes(yesterday);

    const newProgress: UserProgress = {
      ...state.progress,
      checkInDays: state.progress.checkInDays + 1,
      continuousDays: isContinuous ? state.progress.continuousDays + 1 : 1,
      checkInHistory: [...state.progress.checkInHistory, today]
    };

    const checkInDays = newProgress.checkInDays;
    if (checkInDays >= 3 && !newProgress.achievements.includes('three-days')) {
      newProgress.achievements.push('three-days');
    }
    if (checkInDays >= 7 && !newProgress.achievements.includes('seven-days')) {
      newProgress.achievements.push('seven-days');
    }

    if (checkInDays >= 3 && !newProgress.unlockedCategories.includes('dense')) {
      newProgress.unlockedCategories.push('dense');
    }
    if (checkInDays >= 5 && !newProgress.unlockedCategories.includes('handwritten')) {
      newProgress.unlockedCategories.push('handwritten');
    }
    if (checkInDays >= 7 && !newProgress.unlockedCategories.includes('cross-panel')) {
      newProgress.unlockedCategories.push('cross-panel');
    }

    saveProgressToStorage(newProgress);

    set({
      progress: newProgress,
      todayCheckedIn: true
    });

    console.log('[UserStore] 打卡成功', { checkInDays: newProgress.checkInDays });
    return true;
  },

  setCurrentExercise: (id: string) => {
    set({ currentExerciseId: id });
  },

  setLastScore: (score: ScoreResult) => {
    set({ lastScore: score });
  },

  completeExercise: (score: number) => {
    const state = get();
    const newTotal = state.progress.totalExercises + 1;
    const newAverage = Math.round(
      (state.progress.averageScore * state.progress.totalExercises + score) / newTotal
    );

    const newProgress: UserProgress = {
      ...state.progress,
      totalExercises: newTotal,
      averageScore: newAverage
    };

    if (score >= 95 && !newProgress.achievements.includes('perfect-score')) {
      newProgress.achievements.push('perfect-score');
    }
    if (newTotal >= 10 && !newProgress.achievements.includes('ten-exercises')) {
      newProgress.achievements.push('ten-exercises');
    }
    if (newProgress.unlockedCategories.length >= 4 && !newProgress.achievements.includes('all-categories')) {
      newProgress.achievements.push('all-categories');
    }

    saveProgressToStorage(newProgress);

    set({ progress: newProgress });
    console.log('[UserStore] 练习完成', { score, newAverage, newTotal });
  },

  isTodayCheckedIn: () => {
    const state = get();
    const today = dayjs().format('YYYY-MM-DD');
    return state.progress.checkInHistory.includes(today);
  }
}));
