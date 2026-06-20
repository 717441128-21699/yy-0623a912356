import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getExerciseById } from '@/data/exercises';
import { Exercise } from '@/types';
import styles from './index.module.scss';

const ExamplePage: React.FC = () => {
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
        title: '示例不存在',
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

  const handleStartPractice = () => {
    if (!exercise) return;
    Taro.redirectTo({
      url: `/pages/editor/index?id=${exercise.id}`
    });
  };

  const handleBack = () => {
    Taro.navigateBack();
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

  const getNoteForDialogue = (dialogueId: string) => {
    return exercise.exampleNotes.find(n => n.dialogueId === dialogueId);
  };

  const getCorrectAnswer = (dialogueId: string) => {
    return exercise.correctAnswers.find(a => a.dialogueId === dialogueId);
  };

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>优秀示例</Text>
          <Text className={styles.subtitle}>学习资深嵌字师的处理技巧</Text>
        </View>

        <View className={styles.imageSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>👑</Text>
            嵌字成品
          </Text>
          <View className={styles.imageWrapper}>
            <Image
              className={styles.comicImage}
              src={exercise.imageUrl}
              mode='widthFix'
              onLoad={handleImageLoad}
            />
            {imageLoaded && (
              <>
                <View className={styles.bubbleOverlay}>
                  {exercise.bubbles.map((bubble, index) => (
                    <View
                      key={bubble.id}
                      className={classnames(
                        styles.bubbleHighlight,
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
                <View className={styles.textOverlay}>
                  {exercise.dialogues.map((dialogue) => {
                    const answer = getCorrectAnswer(dialogue.id);
                    const bubble = exercise.bubbles.find(b => b.id === dialogue.targetBubbleId);
                    if (!answer || !bubble) return null;
                    const centerX = (bubble.x + bubble.width / 2) * scaleX;
                    const centerY = (bubble.y + bubble.height / 2) * scaleY;
                    return (
                      <View
                        key={dialogue.id}
                        className={styles.exampleText}
                        style={{
                          left: `${centerX}rpx`,
                          top: `${centerY}rpx`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <Text
                          className={classnames(
                            styles.exampleContent,
                            answer.isVertical && styles.vertical
                          )}
                          style={{
                            fontSize: `${answer.fontSize * 0.8}rpx`,
                            letterSpacing: `${answer.letterSpacing}rpx`
                          }}
                        >
                          {dialogue.text}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
          <View className={styles.tip}>
            <Text className={styles.tipIcon}>💡</Text>
            <Text className={styles.tipText}>
              点击图中的气泡框，可以查看下方对应的详细讲解。学习资深嵌字师为什么这样处理每一句台词。
            </Text>
          </View>
        </View>

        <View className={styles.notesSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            技巧讲解
          </Text>
          <View className={styles.notesList}>
            {exercise.dialogues.map((dialogue, index) => {
              const note = getNoteForDialogue(dialogue.id);
              const answer = getCorrectAnswer(dialogue.id);
              const bubble = exercise.bubbles.find(b => b.id === dialogue.targetBubbleId);
              if (!note || !answer) return null;
              return (
                <View
                  key={dialogue.id}
                  className={classnames(
                    styles.noteCard,
                    activeBubble === dialogue.targetBubbleId && styles.active
                  )}
                  onClick={() => handleBubbleClick(dialogue.targetBubbleId)}
                >
                  <View className={styles.noteHeader}>
                    <View className={styles.noteNumber}>
                      <Text>{index + 1}</Text>
                    </View>
                    <Text className={styles.noteText}>{dialogue.text}</Text>
                  </View>
                  <View className={styles.noteSettings}>
                    <View className={styles.settingTag}>
                      <Text>排版：</Text>
                      <Text className={styles.settingValue}>{answer.isVertical ? '竖排' : '横排'}</Text>
                    </View>
                    <View className={styles.settingTag}>
                      <Text>字号：</Text>
                      <Text className={styles.settingValue}>{answer.fontSize}px</Text>
                    </View>
                    <View className={styles.settingTag}>
                      <Text>字距：</Text>
                      <Text className={styles.settingValue}>{answer.letterSpacing}px</Text>
                    </View>
                    {bubble && (
                      <View className={styles.settingTag}>
                        <Text>类型：</Text>
                        <Text className={styles.settingValue}>
                          {bubble.type === 'speech' ? '对白' :
                           bubble.type === 'thought' ? '心理' :
                           bubble.type === 'narration' ? '旁白' : '拟声'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className={styles.noteReason}>
                    <Text className={styles.reasonLabel}>为什么这样处理？</Text>
                    <Text className={styles.reasonText}>{note.reason}</Text>
                  </View>
                  <View className={styles.noteTips}>
                    <Text className={styles.tipsLabel}>
                      <Text className={styles.tipsIcon}>💡</Text>
                      嵌字小贴士
                    </Text>
                    <Text className={styles.tipsText}>{note.tips}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleBack}>
          返回
        </Button>
        <Button className={styles.primaryBtn} onClick={handleStartPractice}>
          我也试试
        </Button>
      </View>
    </View>
  );
};

export default ExamplePage;
