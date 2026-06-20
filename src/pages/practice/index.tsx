import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '@/store/useUserStore';
import { exercises } from '@/data/exercises';
import { categoryNames, difficultyNames, difficultyColors } from '@/data/userProgress';
import styles from './index.module.scss';

type CategoryType = 'basic' | 'dense' | 'cross-panel' | 'handwritten';
type DifficultyType = 'all' | 'easy' | 'medium' | 'hard';

const categories: { key: CategoryType; icon: string; name: string }[] = [
  { key: 'basic', icon: '📝', name: '基础' },
  { key: 'dense', icon: '💬', name: '密集' },
  { key: 'cross-panel', icon: '📖', name: '跨格' },
  { key: 'handwritten', icon: '✏️', name: '拟声' }
];

const difficulties: { key: DifficultyType; name: string }[] = [
  { key: 'all', name: '全部' },
  { key: 'easy', name: '入门' },
  { key: 'medium', name: '进阶' },
  { key: 'hard', name: '挑战' }
];

const PracticePage: React.FC = () => {
  const { progress } = useUserStore();
  const [activeCategory, setActiveCategory] = useState<CategoryType>('basic');
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyType>('all');

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const categoryMatch = ex.category === activeCategory;
      const difficultyMatch = activeDifficulty === 'all' || ex.difficulty === activeDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }, [activeCategory, activeDifficulty]);

  const handleCategoryClick = (category: CategoryType) => {
    const isUnlocked = progress.unlockedCategories.includes(category);
    if (!isUnlocked) {
      Taro.showToast({
        title: '继续打卡解锁此题型',
        icon: 'none'
      });
      return;
    }
    setActiveCategory(category);
  };

  const handleExerciseClick = (exerciseId: string, unlockDays: number) => {
    const isUnlocked = progress.checkInDays >= unlockDays;
    if (!isUnlocked) {
      Taro.showToast({
        title: `累计打卡${unlockDays}天解锁`,
        icon: 'none'
      });
      return;
    }
    useUserStore.getState().setCurrentExercise(exerciseId);
    Taro.navigateTo({
      url: `/pages/exercise/index?id=${exerciseId}`
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {categories.map((cat) => {
          const isUnlocked = progress.unlockedCategories.includes(cat.key);
          return (
            <View
              key={cat.key}
              className={classnames(
                styles.tab,
                activeCategory === cat.key && styles.active,
                !isUnlocked && styles.locked
              )}
              onClick={() => handleCategoryClick(cat.key)}
            >
              <Text className={styles.tabIcon}>{cat.icon}</Text>
              <Text>{cat.name}</Text>
            </View>
          );
        })}
      </View>

      <View className={styles.content}>
        <View className={styles.difficultyFilter}>
          {difficulties.map((diff) => (
            <Button
              key={diff.key}
              className={classnames(styles.filterBtn, activeDifficulty === diff.key && styles.active)}
              onClick={() => setActiveDifficulty(diff.key)}
            >
              {diff.name}
            </Button>
          ))}
        </View>

        <View className={styles.exerciseList}>
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => {
              const isUnlocked = progress.checkInDays >= exercise.unlockDays;
              return (
                <View
                  key={exercise.id}
                  className={classnames(styles.exerciseCard, !isUnlocked && styles.locked)}
                  onClick={() => handleExerciseClick(exercise.id, exercise.unlockDays)}
                >
                  <View className={styles.cardImage}>
                    <Image
                      src={exercise.imageUrl}
                      mode='aspectFill'
                      style={{ width: '100%', height: '100%', borderRadius: '12rpx' }}
                    />
                    {!isUnlocked && (
                      <View className={styles.lockOverlay}>
                        <Text className={styles.lockIcon}>🔒</Text>
                      </View>
                    )}
                  </View>
                  <View className={styles.cardContent}>
                    <Text className={styles.cardTitle}>{exercise.title}</Text>
                    <View className={styles.cardTags}>
                      <View
                        className={classnames(styles.cardTag, styles.difficulty)}
                        style={{ background: difficultyColors[exercise.difficulty] }}
                      >
                        <Text>{difficultyNames[exercise.difficulty]}</Text>
                      </View>
                      <View
                        className={styles.cardTag}
                        style={{ background: 'rgba(78, 205, 196, 0.15)', color: '#4ECDC4' }}
                      >
                        <Text>{categoryNames[exercise.category]}</Text>
                      </View>
                    </View>
                    <View className={styles.cardMeta}>
                      <View className={styles.metaItem}>
                        <Text className={styles.metaIcon}>💭</Text>
                        <Text>{exercise.bubbles.length}个气泡</Text>
                      </View>
                      <View className={styles.metaItem}>
                        <Text className={styles.metaIcon}>📝</Text>
                        <Text>{exercise.dialogues.length}句台词</Text>
                      </View>
                    </View>
                    <Text className={styles.cardDesc}>
                      练习将对白拖入正确气泡，设置排版属性
                    </Text>
                    {!isUnlocked && (
                      <Text className={styles.unlockHint}>
                        🔒 累计打卡{exercise.unlockDays}天解锁
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>暂无符合条件的练习</Text>
              <Text className={styles.emptyHint}>试试切换其他筛选条件</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default PracticePage;
