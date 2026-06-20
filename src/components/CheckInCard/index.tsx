import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

interface CheckInCardProps {
  continuousDays: number;
  totalDays: number;
  checkInHistory: string[];
  isCheckedIn: boolean;
  onCheckIn: () => void;
}

const CheckInCard: React.FC<CheckInCardProps> = ({
  continuousDays,
  totalDays,
  checkInHistory,
  isCheckedIn,
  onCheckIn
}) => {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = dayjs();
  const startOfWeek = today.startOf('week');

  const weekStatus = weekDays.map((_, index) => {
    const date = startOfWeek.add(index, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const isToday = dateStr === today.format('YYYY-MM-DD');
    const isChecked = checkInHistory.includes(dateStr);
    return { dateStr, isToday, isChecked };
  });

  return (
    <View className={styles.checkInCard}>
      <View className={styles.cardHeader}>
        <Text className={styles.title}>每日打卡</Text>
        <View className={styles.streakBadge}>
          <Text className={styles.streakIcon}>🔥</Text>
          <Text className={styles.streakText}>连续{continuousDays}天</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalDays}</Text>
          <Text className={styles.statLabel}>累计打卡</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{continuousDays}</Text>
          <Text className={styles.statLabel}>连续打卡</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{Math.round(totalDays / 7 * 10) / 10}</Text>
          <Text className={styles.statLabel}>周均打卡</Text>
        </View>
      </View>

      <Button
        className={classnames(styles.checkInButton, isCheckedIn && styles.checked)}
        onClick={onCheckIn}
      >
        {isCheckedIn ? '今日已打卡 ✓' : '立即打卡'}
      </Button>

      <View className={styles.weekDays}>
        {weekStatus.map((day, index) => (
          <View key={index} className={styles.dayItem}>
            <Text className={styles.dayName}>{weekDays[index]}</Text>
            <View
              className={classnames(
                styles.dayDot,
                day.isChecked && styles.active,
                day.isToday && styles.today
              )}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default CheckInCard;
