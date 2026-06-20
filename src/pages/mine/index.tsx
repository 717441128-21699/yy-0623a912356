import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { achievementsList } from '@/data/userProgress';
import AchievementBadge from '@/components/AchievementBadge';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { progress } = useUserStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const userLevel = progress.checkInDays >= 21 ? '嵌字大师' : 
                    progress.checkInDays >= 14 ? '熟练嵌字师' : 
                    progress.checkInDays >= 7 ? '进阶嵌字者' : 
                    progress.checkInDays >= 3 ? '初级嵌字员' : '新手学习者';

  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    
    const days: { date: string | null; isToday: boolean; isChecked: boolean }[] = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, isToday: false, isChecked: false });
    }
    
    const today = dayjs();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentMonth.date(i);
      const dateStr = date.format('YYYY-MM-DD');
      days.push({
        date: dateStr,
        isToday: dateStr === today.format('YYYY-MM-DD'),
        isChecked: progress.checkInHistory.includes(dateStr)
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    const nextMonth = currentMonth.add(1, 'month');
    if (nextMonth.isBefore(dayjs().add(1, 'day'))) {
      setCurrentMonth(nextMonth);
    }
  };

  const handleViewExample = () => {
    Taro.navigateTo({
      url: `/pages/example/index?id=ex-001`
    });
  };

  const handleMenuItemClick = (title: string) => {
    Taro.showToast({
      title: `${title}功能开发中`,
      icon: 'none'
    });
  };

  const menuItems = [
    { icon: '📚', title: '嵌字教程', color: 'rgba(78, 205, 196, 0.15)' },
    { icon: '💡', title: '使用说明', color: 'rgba(255, 230, 109, 0.2)' },
    { icon: '⭐', title: '给个好评', color: 'rgba(253, 203, 110, 0.2)' },
    { icon: 'ℹ️', title: '关于我们', color: 'rgba(116, 185, 255, 0.2)' }
  ];

  const dataItems = [
    { icon: '📝', value: progress.totalExercises, label: '总练习数' },
    { icon: '📊', value: `${progress.averageScore}分`, label: '平均分' },
    { icon: '🔓', value: progress.unlockedCategories.length, label: '已解锁题型' },
    { icon: '🏆', value: progress.achievements.length, label: '获得成就' }
  ];

  const userAchievements = achievementsList.map(a => ({
    ...a,
    unlocked: progress.achievements.includes(a.id)
  }));

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>🎨</Text>
          </View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>嵌字爱好者</Text>
            <Text className={styles.userLevel}>Lv.{Math.floor(progress.checkInDays / 7) + 1} {userLevel}</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{progress.checkInDays}</Text>
            <Text className={styles.statLabel}>累计打卡</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{progress.continuousDays}</Text>
            <Text className={styles.statLabel}>连续打卡</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{Math.round(progress.checkInDays / 7 * 10) / 10}</Text>
            <Text className={styles.statLabel}>周均打卡</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>学习数据</Text>
          <View className={styles.dataGrid}>
            {dataItems.map((item, index) => (
              <View key={index} className={styles.dataCard}>
                <Text className={styles.dataIcon}>{item.icon}</Text>
                <Text className={styles.dataValue}>{item.value}</Text>
                <Text className={styles.dataLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>成就徽章</Text>
            <Text className={styles.sectionAction}>{userAchievements.filter(a => a.unlocked).length}/{userAchievements.length}</Text>
          </View>
          <View className={styles.achievementsGrid}>
            {userAchievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>打卡记录</Text>
          <View className={styles.calendar}>
            <View className={styles.calendarHeader}>
              <Text className={styles.calendarTitle}>
                {currentMonth.format('YYYY年MM月')}
              </Text>
              <View className={styles.calendarNav}>
                <View className={styles.navBtn} onClick={handlePrevMonth}>
                  <Text>‹</Text>
                </View>
                <View className={styles.navBtn} onClick={handleNextMonth}>
                  <Text>›</Text>
                </View>
              </View>
            </View>
            <View className={styles.weekDays}>
              {weekDays.map((day) => (
                <Text key={day} className={styles.weekDay}>{day}</Text>
              ))}
            </View>
            <View className={styles.daysGrid}>
              {calendarDays.map((day, index) => (
                <View
                  key={index}
                  className={
                    day.date
                      ? `dayCell ${day.isChecked ? 'checked' : ''} ${day.isToday ? 'today' : ''}`
                      : 'dayCell empty'
                  }
                  style={
                    day.date
                      ? {
                          borderRadius: '8rpx',
                          textAlign: 'center',
                          lineHeight: '40rpx',
                          fontSize: '24rpx'
                        }
                      : {}
                  }
                >
                  {day.date && <Text>{dayjs(day.date).date()}</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>更多功能</Text>
          <View className={styles.menuList}>
            <View className={styles.menuItem} onClick={handleViewExample}>
              <View className={styles.menuIcon} style={{ background: 'rgba(255, 107, 157, 0.15)' }}>
                <Text>👑</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>优秀示例</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
            {menuItems.map((item, index) => (
              <View key={index} className={styles.menuItem} onClick={() => handleMenuItemClick(item.title)}>
                <View className={styles.menuIcon} style={{ background: item.color }}>
                  <Text>{item.icon}</Text>
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuTitle}>{item.title}</Text>
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default MinePage;
