import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { getTodayExercise } from '@/data/exercises';
import { categoryNames, difficultyNames, difficultyColors } from '@/data/userProgress';
import CheckInCard from '@/components/CheckInCard';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const { progress, checkIn, isTodayCheckedIn } = useUserStore();
  const [todayChecked, setTodayChecked] = useState(false);
  const todayExercise = getTodayExercise();

  useEffect(() => {
    setTodayChecked(isTodayCheckedIn());
  }, [isTodayCheckedIn]);

  useDidShow(() => {
    setTodayChecked(isTodayCheckedIn());
  });

  const handleCheckIn = () => {
    const success = checkIn();
    if (success) {
      setTodayChecked(true);
      Taro.showToast({
        title: '打卡成功！',
        icon: 'success'
      });
    } else {
      Taro.showToast({
        title: '今日已打卡',
        icon: 'none'
      });
    }
  };

  const handleStartExercise = () => {
    useUserStore.getState().setCurrentExercise(todayExercise.id);
    Taro.navigateTo({
      url: `/pages/exercise/index?id=${todayExercise.id}`
    });
  };

  const handleViewExample = () => {
    useUserStore.getState().setCurrentExercise(todayExercise.id);
    Taro.navigateTo({
      url: `/pages/example/index?id=${todayExercise.id}`
    });
  };

  const categories = [
    { key: 'basic', icon: '📝', name: '基础练习' },
    { key: 'dense', icon: '💬', name: '密集对白' },
    { key: 'handwritten', icon: '✏️', name: '手写拟声' },
    { key: 'cross-panel', icon: '📖', name: '跨格独白' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerContent}>
          <Text className={styles.title}>漫画嵌字练习</Text>
          <Text className={styles.subtitle}>
            {dayjs().format('YYYY年MM月DD日 dddd')}
          </Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <CheckInCard
            continuousDays={progress.continuousDays}
            totalDays={progress.checkInDays}
            checkInHistory={progress.checkInHistory}
            isCheckedIn={todayChecked}
            onCheckIn={handleCheckIn}
          />
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>今日练习</Text>
          <View className={styles.todayExercise} onClick={handleStartExercise}>
            <Image
              className={styles.exerciseImage}
              src={todayExercise.imageUrl}
              mode='aspectFill'
            />
            <View className={styles.exerciseInfo}>
              <Text className={styles.exerciseTitle}>{todayExercise.title}</Text>
              <View className={styles.tags}>
                <View
                  className={classnames(styles.tag, styles.difficulty)}
                  style={{ background: difficultyColors[todayExercise.difficulty] }}
                >
                  <Text>{difficultyNames[todayExercise.difficulty]}</Text>
                </View>
                <View className={classnames(styles.tag, styles.category)}>
                  <Text>{categoryNames[todayExercise.category]}</Text>
                </View>
              </View>
              <Text className={styles.exerciseDesc}>
                共{todayExercise.bubbles.length}个气泡，{todayExercise.dialogues.length}句台词
              </Text>
              <Button className={styles.startButton} onClick={handleStartExercise}>
                开始练习
              </Button>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.quickActions}>
            <Button
              className={classnames(styles.actionButton, styles.primary)}
              onClick={handleStartExercise}
            >
              开始练习
            </Button>
            <Button
              className={classnames(styles.actionButton, styles.secondary)}
              onClick={handleViewExample}
            >
              优秀示例
            </Button>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>题型解锁进度</Text>
          <View className={styles.progressGrid}>
            {categories.map((cat) => {
              const isUnlocked = progress.unlockedCategories.includes(cat.key);
              return (
                <View
                  key={cat.key}
                  className={classnames(styles.progressCard, !isUnlocked && styles.locked)}
                >
                  <Text className={styles.progressIcon}>
                    {isUnlocked ? cat.icon : '🔒'}
                  </Text>
                  <Text className={styles.progressName}>{cat.name}</Text>
                  <Text className={styles.progressStatus}>
                    {isUnlocked ? '已解锁' : '敬请期待'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

export default HomePage;
