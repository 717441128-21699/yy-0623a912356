import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, Button, Slider } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getExerciseById } from '@/data/exercises';
import { Exercise, UserAnswer, PlacedText } from '@/types';
import { calculateScore } from '@/utils/scoring';
import { useUserStore } from '@/store/useUserStore';
import BubbleCard from '@/components/BubbleCard';
import styles from './index.module.scss';

const EditorPage: React.FC = () => {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  const [placedTexts, setPlacedTexts] = useState<PlacedText[]>([]);
  const [textSettings, setTextSettings] = useState<Record<string, {
    isVertical: boolean;
    fontSize: number;
    letterSpacing: number;
  }>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const exerciseId = router.params.id || 'ex-001';

  useEffect(() => {
    const ex = getExerciseById(exerciseId as string);
    if (ex) {
      setExercise(ex);
      const initialSettings: Record<string, { isVertical: boolean; fontSize: number; letterSpacing: number }> = {};
      ex.dialogues.forEach(d => {
        initialSettings[d.id] = {
          isVertical: false,
          fontSize: 26,
          letterSpacing: 2
        };
      });
      setTextSettings(initialSettings);
    }
  }, [exerciseId]);

  const handleImageLoad = (e: any) => {
    const { width, height } = e.detail;
    setImageSize({ width, height });
  };

  const scaleX = imageSize.width / 750;
  const scaleY = imageSize.height / 1000;

  const handleDialogueSelect = (dialogueId: string) => {
    const placed = placedTexts.find(p => p.dialogueId === dialogueId);
    if (placed) {
      setSelectedDialogue(dialogueId);
    } else {
      setSelectedDialogue(dialogueId);
    }
  };

  const handleBubbleClick = (bubbleId: string) => {
    if (!selectedDialogue || !exercise) return;

    const bubble = exercise.bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    const dialogue = exercise.dialogues.find(d => d.id === selectedDialogue);
    if (!dialogue) return;

    const settings = textSettings[selectedDialogue] || { isVertical: false, fontSize: 26, letterSpacing: 2 };
    const centerX = (bubble.x + bubble.width / 2) * scaleX;
    const centerY = (bubble.y + bubble.height / 2) * scaleY;

    const existingIndex = placedTexts.findIndex(p => p.dialogueId === selectedDialogue);
    const newPlacedText: PlacedText = {
      dialogueId: selectedDialogue,
      bubbleId,
      x: centerX,
      y: centerY,
      text: dialogue.text,
      isVertical: settings.isVertical,
      fontSize: settings.fontSize,
      letterSpacing: settings.letterSpacing
    };

    if (existingIndex >= 0) {
      const updated = [...placedTexts];
      updated[existingIndex] = newPlacedText;
      setPlacedTexts(updated);
    } else {
      setPlacedTexts([...placedTexts, newPlacedText]);
    }

    console.log('[Editor] 放置文本', { dialogueId: selectedDialogue, bubbleId, x: centerX, y: centerY });
  };

  const handleTextClick = (dialogueId: string) => {
    setSelectedDialogue(dialogueId);
  };

  const handleOrientationChange = (isVertical: boolean) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => ({
      ...prev,
      [selectedDialogue]: {
        ...prev[selectedDialogue],
        isVertical
      }
    }));
    setPlacedTexts(prev => prev.map(p =>
      p.dialogueId === selectedDialogue ? { ...p, isVertical } : p
    ));
  };

  const handleFontSizeChange = (value: number) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => ({
      ...prev,
      [selectedDialogue]: {
        ...prev[selectedDialogue],
        fontSize: value
      }
    }));
    setPlacedTexts(prev => prev.map(p =>
      p.dialogueId === selectedDialogue ? { ...p, fontSize: value } : p
    ));
  };

  const handleLetterSpacingChange = (value: number) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => ({
      ...prev,
      [selectedDialogue]: {
        ...prev[selectedDialogue],
        letterSpacing: value
      }
    }));
    setPlacedTexts(prev => prev.map(p =>
      p.dialogueId === selectedDialogue ? { ...p, letterSpacing: value } : p
    ));
  };

  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '确定要清空所有已放置的文本吗？',
      success: (res) => {
        if (res.confirm) {
          setPlacedTexts([]);
          setSelectedDialogue(null);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (!exercise) return;

    const placedCount = placedTexts.length;
    const totalCount = exercise.dialogues.length;

    if (placedCount < totalCount) {
      Taro.showToast({
        title: `还有${totalCount - placedCount}句台词未放置`,
        icon: 'none'
      });
      return;
    }

    const answers: UserAnswer[] = placedTexts.map(pt => ({
      dialogueId: pt.dialogueId,
      bubbleId: pt.bubbleId,
      x: pt.x,
      y: pt.y,
      isVertical: pt.isVertical,
      fontSize: pt.fontSize,
      letterSpacing: pt.letterSpacing
    }));

    const scoreResult = calculateScore({
      exercise,
      answers,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height
    });

    const percentage = Math.round((scoreResult.totalScore / scoreResult.maxScore) * 100);

    useUserStore.getState().setLastScore(scoreResult);
    useUserStore.getState().completeExercise(percentage);

    Taro.redirectTo({
      url: `/pages/result/index?id=${exercise.id}`
    });
  };

  const isBubbleFilled = (bubbleId: string) => {
    return placedTexts.some(p => p.bubbleId === bubbleId);
  };

  const isDialoguePlaced = (dialogueId: string) => {
    return placedTexts.some(p => p.dialogueId === dialogueId);
  };

  const currentSettings = selectedDialogue ? textSettings[selectedDialogue] : null;

  if (!exercise) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '32rpx', textAlign: 'center' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.canvasContainer}>
        <View className={styles.comicCanvas} ref={canvasRef}>
          <Image
            className={styles.canvasImage}
            src={exercise.imageUrl}
            mode='widthFix'
            onLoad={handleImageLoad}
          />
          {imageSize.width > 0 && (
            <>
              <View className={styles.bubbleLayer}>
                {exercise.bubbles.map((bubble, index) => (
                  <View
                    key={bubble.id}
                    className={classnames(
                      styles.bubbleTarget,
                      isBubbleFilled(bubble.id) && styles.filled,
                      placedTexts.some(p => p.bubbleId === bubbleId && p.dialogueId === selectedDialogue) && styles.active
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
              <View className={styles.textLayer}>
                {placedTexts.map((pt) => (
                  <View
                    key={pt.dialogueId}
                    className={classnames(
                      styles.placedText,
                      selectedDialogue === pt.dialogueId && styles.selected
                    )}
                    style={{
                      left: `${pt.x}rpx`,
                      top: `${pt.y}rpx`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => handleTextClick(pt.dialogueId)}
                  >
                    <Text
                      className={classnames(
                        styles.textContent,
                        pt.isVertical && styles.verticalText
                      )}
                      style={{
                        fontSize: `${pt.fontSize}rpx`,
                        letterSpacing: `${pt.letterSpacing}rpx`
                      }}
                    >
                      {pt.text}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </View>

      <View className={styles.settingsPanel}>
        <View className={styles.panelHeader}>
          <Text className={styles.panelTitle}>
            {selectedDialogue ? '编辑文本' : '选择台词'}
          </Text>
          <Text className={styles.progress}>
            {placedTexts.length}/{exercise.dialogues.length}
          </Text>
        </View>

        {selectedDialogue && currentSettings && (
          <>
            <View className={styles.settingGroup}>
              <Text className={styles.settingLabel}>排版方向</Text>
              <View className={styles.settingOptions}>
                <Button
                  className={classnames(styles.optionBtn, !currentSettings.isVertical && styles.active)}
                  onClick={() => handleOrientationChange(false)}
                >
                  横排
                </Button>
                <Button
                  className={classnames(styles.optionBtn, currentSettings.isVertical && styles.active)}
                  onClick={() => handleOrientationChange(true)}
                >
                  竖排
                </Button>
              </View>
            </View>

            <View className={styles.settingGroup}>
              <Text className={styles.settingLabel}>字号</Text>
              <View className={styles.sliderContainer}>
                <Text className={styles.sliderValue}>{currentSettings.fontSize}</Text>
                <Slider
                  min={20}
                  max={40}
                  value={currentSettings.fontSize}
                  step={1}
                  activeColor='#FF6B9D'
                  backgroundColor='#F1F2F6'
                  blockColor='#FFFFFF'
                  blockSize={24}
                  style={{ flex: 1 }}
                  onChange={(e) => handleFontSizeChange(e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.settingGroup}>
              <Text className={styles.settingLabel}>字距</Text>
              <View className={styles.sliderContainer}>
                <Text className={styles.sliderValue}>{currentSettings.letterSpacing}</Text>
                <Slider
                  min={0}
                  max={10}
                  value={currentSettings.letterSpacing}
                  step={1}
                  activeColor='#FF6B9D'
                  backgroundColor='#F1F2F6'
                  blockColor='#FFFFFF'
                  blockSize={24}
                  style={{ flex: 1 }}
                  onChange={(e) => handleLetterSpacingChange(e.detail.value)}
                />
              </View>
            </View>
          </>
        )}

        <View className={styles.dialoguesSection}>
          <Text className={styles.dialoguesTitle}>待嵌台词</Text>
          <View className={styles.dialoguesList}>
            {exercise.dialogues.map((dialogue, index) => {
              const bubble = exercise.bubbles.find(b => b.id === dialogue.targetBubbleId);
              const placed = isDialoguePlaced(dialogue.id);
              return (
                <View
                  key={dialogue.id}
                  className={classnames(
                    styles.dialogueItem,
                    selectedDialogue === dialogue.id && styles.selected,
                    placed && styles.placed
                  )}
                  onClick={() => handleDialogueSelect(dialogue.id)}
                >
                  <View className={styles.dialogueIndex}>
                    <Text>{index + 1}</Text>
                  </View>
                  <View className={styles.dialogueContent}>
                    <Text className={styles.dialogueText}>{dialogue.text}</Text>
                    <Text className={styles.dialogueStatus}>
                      {placed ? '已放置' : bubble ? `放到${bubble.type === 'speech' ? '对白' : bubble.type === 'thought' ? '心理' : bubble.type === 'narration' ? '旁白' : '拟声'}气泡` : '待放置'}
                    </Text>
                  </View>
                  <Text className={styles.dragHint}>
                    {selectedDialogue === dialogue.id ? '点击气泡放置' : placed ? '点击编辑' : '点击选中'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.bottomActions}>
          <Button className={styles.resetBtn} onClick={handleReset}>
            重置
          </Button>
          <Button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={placedTexts.length < exercise.dialogues.length}
          >
            提交评分
          </Button>
        </View>
      </View>
    </View>
  );
};

export default EditorPage;
