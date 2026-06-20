import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface BubbleCardProps {
  type: 'speech' | 'thought' | 'narration' | 'sound';
  text: string;
  placed?: boolean;
  onClick?: () => void;
}

const typeNames: Record<string, string> = {
  speech: '对白',
  thought: '心理',
  narration: '旁白',
  sound: '拟声'
};

const typeIcons: Record<string, string> = {
  speech: '💬',
  thought: '💭',
  narration: '📖',
  sound: '🔊'
};

const BubbleCard: React.FC<BubbleCardProps> = ({ type, text, placed, onClick }) => {
  return (
    <View
      className={classnames(styles.bubbleCard, placed && styles.placed)}
      onClick={onClick}
    >
      <View className={classnames(styles.bubbleIcon, styles[type])}>
        <Text>{typeIcons[type]}</Text>
      </View>
      <View className={styles.bubbleContent}>
        <Text className={styles.bubbleType}>{typeNames[type]}</Text>
        <Text className={styles.bubbleText}>{text}</Text>
      </View>
    </View>
  );
};

export default BubbleCard;
