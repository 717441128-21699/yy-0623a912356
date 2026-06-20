import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getExerciseById } from '@/data/exercises';
import { Exercise } from '@/types';
import { categoryNames, difficultyNames, difficultyColors } from '@/data/userProgress';
import styles from './index.module.scss';

const typeNames: Record<string, string> = {
  speech: '对白',
  thought: '心理',
  narration: '旁白',
  sound: '拟声'
};

const moodNames: Record<string, string> = {
  happy: '开心',
  calm: '平静',
  hopeful: '期待',
  anxious: '焦急',
  apologetic: '歉意',
  urgent: '急切',
  angry: '愤怒',
  serious: '严肃',
  worried: '担忧',
  determined: '坚定',
  loud: '响亮',
  continuous: '持续',
  surprised: '惊讶',
  melancholic: '忧郁',
  mysterious: '神秘',
  confused: '困惑'
};

const ExercisePage: React.FC = () => {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [activeBubble, setActiveBubble] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const exerciseId = router.params.id || 'ex-001';

  useEffect(() => {
    const ex = getExerciseById(exerciseId as string);
    if (ex) {
      setExercise(ex);
    } else {
      Taro.showToast({
        title: '练习不存在',
        icon: 'none'
      });
    }
  }, [exerciseId]);

  const handleImageLoad = (e: any) => {
    const { width, height } = e.detail;
    setImageSize({ width, height });
    setImageLoaded(true);
  };

  const handleBubbleClick = (bubbleId: string) => {
    setActiveBubble(activeBubble === bubbleId ? null : bubbleId);
  };

  const handleStartEdit = () => {
    if (!exercise) return;
    Taro.navigateTo({
      url: `/pages/editor/index?id=${exercise.id}`
    });
  };

  const handleViewExample = () => {
    if (!exercise) return;
    Taro.navigateTo({
      url: `/pages/example/index?id=${exercise.id}`
    });
  };

  if (!exercise) {
    return (
      <View className={styles.page}>
        <View className={styles.content}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const scaleX = imageSize.width / 750;
  const scaleY = imageSize.height / 1000;

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.imageSection}>
          <Text className={styles.sectionTitle}>漫画原图</Text>
          <View className={styles.imageWrapper}>
            <Image
              className={styles.comicImage}
              src={exercise.imageUrl}
              mode='widthFix'
              onLoad={handleImageLoad}
            />
            {imageLoaded && (
              <View className={styles.bubbleOverlay}>
                {exercise.bubbles.map((bubble, index) => (
                  <View
                    key={bubble.id}
                    className={classnames(
                      styles.bubbleBox,
                      activeBubble === bubble.id && styles.active
                    )}
                    style={{
                      left: `${bubble.x * scaleX}rpx`,
                      top: `${bubble.y * scaleY}rpx`,
                      width: `${bubble.width * scaleX}rpx`,
                      height: `${bubble.height * scaleY}rpx`
                    }}
                    onClick={() => handleBubbleClick(bubble.id)}
                  >
                    <View className={styles.bubbleNumber}>
                      <Text>{index + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View className={styles.tip}>
            <Text className={styles.tipIcon}>💡</Text>
            <Text className={styles.tipText}>
              点击图中的气泡框，可以查看对应的台词。请先理解每句台词的语气和语境，再开始嵌字练习。
            </Text>
          </View>
        </View>

        <View className={styles.dialoguesSection}>
          <Text className={styles.sectionTitle}>中文台词</Text>
          <View className={styles.dialogueList}>
            {exercise.dialogues.map((dialogue, index) => {
              const bubble = exercise.bubbles.find(b => b.id === dialogue.targetBubbleId);
              return (
                <View
                  key={dialogue.id}
                  className={classnames(
                    styles.dialogueCard,
                    activeBubble === dialogue.targetBubbleId && styles.active
                  )}
                  onClick={() => handleBubbleClick(dialogue.targetBubbleId)}
                >
                  <View className={styles.dialogueHeader}>
                    <View className={styles.dialogueNumber}>
                      <Text>{index + 1}</Text>
                    </View>
                    {bubble && (
                      <View className={styles.dialogueType}>
                        <Text>{typeNames[bubble.type]}</Text>
                      </View>
                    )}
                    {dialogue.mood && moodNames[dialogue.mood] && (
                      <View className={styles.dialogueMood}>
                        <Text>{moodNames[dialogue.mood]}</Text>
                      </View>
                    )}
                  </View>
                  <View className={styles.dialogueText}>
                    <Text>{dialogue.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleViewExample}>
          看示例
        </Button>
        <Button className={styles.primaryBtn} onClick={handleStartEdit}>
          开始嵌字
        </Button>
      </View>
    </View>
  );
};

export default ExercisePage;
