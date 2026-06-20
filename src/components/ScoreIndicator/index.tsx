import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { ScoreResult, ScoreItem } from '@/types';
import { getScoreColor, getScoreText } from '@/utils/scoring';
import styles from './index.module.scss';

interface ScoreIndicatorProps {
  result: ScoreResult;
  showIssues?: boolean;
}

const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ result, showIssues = true }) => {
  const percentage = Math.round((result.totalScore / result.maxScore) * 100);
  const levelColor = getScoreColor(result.level);

  const allIssues = result.items.reduce((acc, item) => {
    return [...acc, ...item.issues];
  }, [] as ScoreItem['issues']);

  return (
    <View className={styles.scoreIndicator}>
      <View className={styles.scoreHeader}>
        <Text className={styles.scoreValue} style={{ color: levelColor }}>
          {percentage}分
        </Text>
        <View className={classnames(styles.scoreLevel, styles[result.level])}>
          <Text>{getScoreText(result.level)}</Text>
        </View>
      </View>

      <View className={styles.scoreItems}>
        {result.items.map((item) => {
          const itemPercent = (item.score / item.maxScore) * 100;
          const itemColor = itemPercent >= 80 ? '#00B894' : itemPercent >= 60 ? '#FDCB6E' : '#FF7675';
          return (
            <View key={item.category} className={styles.scoreItem}>
              <Text className={styles.itemLabel}>{item.category}</Text>
              <View className={styles.itemBar}>
                <View
                  className={styles.itemFill}
                  style={{ width: `${itemPercent}%`, background: itemColor }}
                />
              </View>
              <Text className={styles.itemScore}>
                {item.score}/{item.maxScore}
              </Text>
            </View>
          );
        })}
      </View>

      {showIssues && allIssues.length > 0 && (
        <View className={styles.issuesList}>
          <Text className={styles.issuesTitle}>需要改进</Text>
          {allIssues.map((issue, index) => (
            <View key={index} className={styles.issueItem}>
              <Text className={styles.issueIcon}>⚠️</Text>
              <Text className={styles.issueText}>{issue.message}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default ScoreIndicator;
