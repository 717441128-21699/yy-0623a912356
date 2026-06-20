import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Achievement } from '@/types';
import styles from './index.module.scss';

interface AchievementBadgeProps {
  achievement: Achievement;
  onClick?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, onClick }) => {
  const progressPercent = Math.round((achievement.progress / achievement.target) * 100);

  return (
    <View
      className={classnames(styles.badge, !achievement.unlocked && styles.locked)}
      onClick={onClick}
    >
      <View className={styles.badgeIcon}>
        <Text>{achievement.icon}</Text>
      </View>
      <Text className={styles.badgeName}>{achievement.name}</Text>
      <Text className={styles.badgeDesc}>{achievement.description}</Text>
      {!achievement.unlocked && (
        <>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Text className={styles.progressText}>
            {achievement.progress}/{achievement.target}
          </Text>
        </>
      )}
    </View>
  );
};

export default AchievementBadge;
