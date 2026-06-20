import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, Button, Slider } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getExerciseById } from '@/data/exercises';
import { Exercise, UserAnswer, PlacedText } from '@/types';
import { calculateScore } from '@/utils/scoring';
import { useUserStore } from '@/store/useUserStore';
import styles from './index.module.scss';

interface DragState {
  isDragging: boolean;
  hasMoved: boolean;
  dialogueId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isNew: boolean;
  offsetX: number;
  offsetY: number;
}

const DRAG_THRESHOLD = 10;

const EditorPage: React.FC = () => {
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [imageSize, setImageSize] = useState({ width: 750, height: 1000 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  const [placedTexts, setPlacedTexts] = useState<PlacedText[]>([]);
  const [textSettings, setTextSettings] = useState<Record<string, {
    isVertical: boolean;
    fontSize: number;
    letterSpacing: number;
    lineBreak: number[];
  }>>({});
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    hasMoved: false,
    dialogueId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isNew: false,
    offsetX: 0,
    offsetY: 0
  });
  const [hoverBubbleId, setHoverBubbleId] = useState<string | null>(null);
  const [showLineBreakEditor, setShowLineBreakEditor] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const exerciseId = router.params.id || 'ex-001';

  useEffect(() => {
    const ex = getExerciseById(exerciseId as string);
    if (ex) {
      setExercise(ex);
      setImageLoaded(false);
      setImageError(false);
      setPlacedTexts([]);
      setSelectedDialogue(null);
      setShowLineBreakEditor(false);
      const initialSettings: Record<string, { isVertical: boolean; fontSize: number; letterSpacing: number; lineBreak: number[] }> = {};
      ex.dialogues.forEach(d => {
        initialSettings[d.id] = {
          isVertical: false,
          fontSize: 26,
          letterSpacing: 2,
          lineBreak: []
        };
      });
      setTextSettings(initialSettings);
    }
  }, [exerciseId]);

  const handleImageLoad = (e: any) => {
    const { width, height } = e.detail;
    if (width && height) {
      setImageSize({ width, height });
      setImageLoaded(true);
      setImageError(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    setImageSize({ width: 750, height: 1000 });
  };

  const scaleX = imageSize.width / 750;
  const scaleY = imageSize.height / 1000;

  const getCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      const rect = (canvasRef.current as HTMLElement).getBoundingClientRect();
      return rect;
    }
    return { left: 0, top: 0, width: 0, height: 0 };
  }, []);

  const pointToCanvasCoord = useCallback((clientX: number, clientY: number) => {
    const rect = getCanvasRect();
    const x = rect.width > 0 ? (clientX - rect.left) / rect.width * imageSize.width : 0;
    const y = rect.height > 0 ? (clientY - rect.top) / rect.height * imageSize.height : 0;
    return { x, y };
  }, [getCanvasRect, imageSize]);

  const findBubbleAtPoint = useCallback((x: number, y: number) => {
    if (!exercise) return null;
    for (let i = exercise.bubbles.length - 1; i >= 0; i--) {
      const bubble = exercise.bubbles[i];
      const bubbleLeft = bubble.x * scaleX;
      const bubbleTop = bubble.y * scaleY;
      const bubbleRight = (bubble.x + bubble.width) * scaleX;
      const bubbleBottom = (bubble.y + bubble.height) * scaleY;
      if (x >= bubbleLeft && x <= bubbleRight && y >= bubbleTop && y <= bubbleBottom) {
        return bubble;
      }
    }
    return null;
  }, [exercise, scaleX, scaleY]);

  const handleDialogueTouchStart = (e: React.TouchEvent, dialogueId: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      hasMoved: false,
      dialogueId,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isNew: true,
      offsetX: 0,
      offsetY: 0
    });
    setSelectedDialogue(dialogueId);
  };

  const handlePlacedTextTouchStart = (e: React.TouchEvent, dialogueId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setSelectedDialogue(dialogueId);
    setDragState({
      isDragging: true,
      hasMoved: false,
      dialogueId,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isNew: false,
      offsetX: 0,
      offsetY: 0
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.dialogueId) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    const deltaY = touch.clientY - dragState.startY;
    const moved = Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD;
    setDragState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      offsetX: deltaX,
      offsetY: deltaY,
      hasMoved: prev.hasMoved || moved
    }));
    if (moved) {
      const coord = pointToCanvasCoord(touch.clientX, touch.clientY);
      const bubble = findBubbleAtPoint(coord.x, coord.y);
      setHoverBubbleId(bubble?.id || null);
    }
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging || !dragState.dialogueId) {
      setDragState(prev => ({ ...prev, isDragging: false }));
      setHoverBubbleId(null);
      return;
    }

    if (!dragState.hasMoved) {
      setDragState(prev => ({ ...prev, isDragging: false, hasMoved: false }));
      setHoverBubbleId(null);
      return;
    }

    if (!exercise) {
      setDragState(prev => ({ ...prev, isDragging: false }));
      setHoverBubbleId(null);
      return;
    }

    const dialogueId = dragState.dialogueId;
    const dialogue = exercise.dialogues.find(d => d.id === dialogueId);
    if (!dialogue) {
      setDragState(prev => ({ ...prev, isDragging: false }));
      setHoverBubbleId(null);
      return;
    }

    const settings = textSettings[dialogueId] || { isVertical: false, fontSize: 26, letterSpacing: 2, lineBreak: [] };
    const coord = pointToCanvasCoord(dragState.currentX, dragState.currentY);
    const bubble = findBubbleAtPoint(coord.x, coord.y);

    if (bubble) {
      const existingIndex = placedTexts.findIndex(p => p.dialogueId === dialogueId);
      const newPlacedText: PlacedText = {
        dialogueId,
        bubbleId: bubble.id,
        x: coord.x,
        y: coord.y,
        text: dialogue.text,
        isVertical: settings.isVertical,
        fontSize: settings.fontSize,
        letterSpacing: settings.letterSpacing,
        lineBreak: settings.lineBreak
      };
      if (existingIndex >= 0) {
        const updated = [...placedTexts];
        updated[existingIndex] = newPlacedText;
        setPlacedTexts(updated);
      } else {
        setPlacedTexts([...placedTexts, newPlacedText]);
      }
      Taro.vibrateShort && Taro.vibrateShort({ type: 'medium' });
    } else {
      if (!dragState.isNew) {
        const existingIndex = placedTexts.findIndex(p => p.dialogueId === dialogueId);
        if (existingIndex >= 0) {
          const updated = [...placedTexts];
          updated[existingIndex] = {
            ...updated[existingIndex],
            x: coord.x,
            y: coord.y
          };
          setPlacedTexts(updated);
        }
      }
      Taro.vibrateShort && Taro.vibrateShort({ type: 'light' });
    }

    setDragState(prev => ({ ...prev, isDragging: false, hasMoved: false }));
    setHoverBubbleId(null);
  };

  const handleDialogueSelect = (dialogueId: string) => {
    if (dragState.isDragging && dragState.hasMoved) return;
    setSelectedDialogue(dialogueId);
  };

  const handleBubbleClick = (bubbleId: string) => {
    if (!selectedDialogue || !exercise || dragState.isDragging) return;
    const bubble = exercise.bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;
    const dialogue = exercise.dialogues.find(d => d.id === selectedDialogue);
    if (!dialogue) return;

    Taro.vibrateShort && Taro.vibrateShort({ type: 'light' });
    const settings = textSettings[selectedDialogue] || { isVertical: false, fontSize: 26, letterSpacing: 2, lineBreak: [] };
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
      letterSpacing: settings.letterSpacing,
      lineBreak: settings.lineBreak
    };

    if (existingIndex >= 0) {
      const updated = [...placedTexts];
      updated[existingIndex] = newPlacedText;
      setPlacedTexts(updated);
    } else {
      setPlacedTexts([...placedTexts, newPlacedText]);
    }
  };

  const handleTextClick = (dialogueId: string) => {
    if (dragState.isDragging) return;
    setSelectedDialogue(dialogueId);
  };

  const handleOrientationChange = (isVertical: boolean) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => ({
      ...prev,
      [selectedDialogue]: { ...prev[selectedDialogue], isVertical }
    }));
    setPlacedTexts(prev => prev.map(p =>
      p.dialogueId === selectedDialogue ? { ...p, isVertical } : p
    ));
  };

  const handleFontSizeChange = (value: number) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => ({
      ...prev,
      [selectedDialogue]: { ...prev[selectedDialogue], fontSize: value }
    }));
    setPlacedTexts(prev => prev.map(p =>
      p.dialogueId === selectedDialogue ? { ...p, fontSize: value } : p
    ));
  };

  const handleLetterSpacingChange = (value: number) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => ({
      ...prev,
      [selectedDialogue]: { ...prev[selectedDialogue], letterSpacing: value }
    }));
    setPlacedTexts(prev => prev.map(p =>
      p.dialogueId === selectedDialogue ? { ...p, letterSpacing: value } : p
    ));
  };

  const handleToggleLineBreakEditor = () => {
    setShowLineBreakEditor(prev => !prev);
  };

  const handleAddLineBreak = (charIndex: number) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => {
      const current = prev[selectedDialogue];
      if (!current) return prev;
      const existing = current.lineBreak || [];
      if (existing.includes(charIndex)) return prev;
      const newBreaks = [...existing, charIndex].sort((a, b) => a - b);
      return { ...prev, [selectedDialogue]: { ...current, lineBreak: newBreaks } };
    });
    setPlacedTexts(prev => prev.map(p => {
      if (p.dialogueId !== selectedDialogue) return p;
      const existing = p.lineBreak || [];
      if (existing.includes(charIndex)) return p;
      const newBreaks = [...existing, charIndex].sort((a, b) => a - b);
      return { ...p, lineBreak: newBreaks };
    }));
  };

  const handleRemoveLineBreak = (charIndex: number) => {
    if (!selectedDialogue) return;
    setTextSettings(prev => {
      const current = prev[selectedDialogue];
      if (!current) return prev;
      return { ...prev, [selectedDialogue]: { ...current, lineBreak: (current.lineBreak || []).filter(b => b !== charIndex) } };
    });
    setPlacedTexts(prev => prev.map(p => {
      if (p.dialogueId !== selectedDialogue) return p;
      return { ...p, lineBreak: (p.lineBreak || []).filter(b => b !== charIndex) };
    }));
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
      letterSpacing: pt.letterSpacing,
      lineBreak: pt.lineBreak
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
    useUserStore.getState().addExerciseRecord({
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      answers,
      scoreResult,
      score: percentage,
      placedTexts: [...placedTexts]
    });

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

  const getDisplayText = (text: string, lineBreak: number[] | undefined) => {
    if (!lineBreak || lineBreak.length === 0) return text;
    const breaks = [...lineBreak].sort((a, b) => a - b);
    let result = '';
    let lastIdx = 0;
    breaks.forEach(brk => {
      if (brk > lastIdx && brk < text.length) {
        result += text.slice(lastIdx, brk) + '\n';
        lastIdx = brk;
      }
    });
    result += text.slice(lastIdx);
    return result;
  };

  const getDragPreviewStyle = () => {
    if (!dragState.isDragging || !dragState.hasMoved || !dragState.dialogueId || !exercise) return null;
    const dialogue = exercise.dialogues.find(d => d.id === dragState.dialogueId);
    if (!dialogue) return null;
    const settings = textSettings[dragState.dialogueId] || { isVertical: false, fontSize: 26, letterSpacing: 2, lineBreak: [] };
    const placed = placedTexts.find(p => p.dialogueId === dragState.dialogueId);

    let x: number;
    let y: number;

    if (dragState.isNew) {
      x = dragState.currentX;
      y = dragState.currentY;
    } else if (placed) {
      const rect = getCanvasRect();
      const pxX = placed.x / imageSize.width * rect.width + rect.left;
      const pxY = placed.y / imageSize.height * rect.height + rect.top;
      x = pxX + dragState.offsetX;
      y = pxY + dragState.offsetY;
    } else {
      x = dragState.currentX;
      y = dragState.currentY;
    }

    return {
      left: x,
      top: y,
      text: getDisplayText(dialogue.text, settings.lineBreak),
      isVertical: settings.isVertical,
      fontSize: settings.fontSize,
      letterSpacing: settings.letterSpacing,
      opacity: hoverBubbleId ? 1 : 0.8
    };
  };

  const dragPreview = getDragPreviewStyle();

  const currentDialogue = selectedDialogue ? exercise?.dialogues.find(d => d.id === selectedDialogue) : null;

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
    <View
      className={styles.page}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <View className={styles.canvasContainer}>
        <View className={styles.comicCanvas} ref={canvasRef}>
          <Image
            className={classnames(styles.canvasImage, imageLoaded && styles.imageVisible)}
            src={exercise.imageUrl}
            mode='widthFix'
            onLoad={handleImageLoad}
            onError={handleImageError}
            lazyLoad
          />
          {!imageLoaded && !imageError && (
            <View className={styles.canvasSkeleton}>
              <View className={styles.skeletonShimmer} />
              <View className={styles.skeletonBubbles}>
                {exercise.bubbles.map((bubble, index) => (
                  <View
                    key={bubble.id}
                    className={styles.skeletonBubble}
                    style={{
                      left: `${bubble.x}rpx`,
                      top: `${bubble.y}rpx`,
                      width: `${bubble.width}rpx`,
                      height: `${bubble.height}rpx`
                    }}
                  >
                    <View className={styles.skeletonBubbleNum}>
                      <Text>{index + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
          {imageError && (
            <View className={styles.canvasError}>
              <Text className={styles.errorIcon}>🖼️</Text>
              <Text className={styles.errorText}>漫画图加载失败</Text>
              <Text className={styles.errorHint}>气泡位置正常显示，不影响练习</Text>
            </View>
          )}
          <View className={styles.bubbleLayer}>
            {exercise.bubbles.map((bubble, index) => {
              const isHover = hoverBubbleId === bubble.id;
              const isFilled = isBubbleFilled(bubble.id);
              const isActive = placedTexts.some(p => p.bubbleId === bubble.id && p.dialogueId === selectedDialogue);
              const hasHighlight = selectedDialogue && !isFilled && !isHover;
              return (
                <View
                  key={bubble.id}
                  className={classnames(
                    styles.bubbleTarget,
                    isFilled && styles.filled,
                    isActive && styles.active,
                    isHover && styles.hover,
                    hasHighlight && styles.highlight
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
              );
            })}
          </View>
          <View className={styles.textLayer}>
            {placedTexts.map((pt) => {
              const isDraggingThis = dragState.isDragging && dragState.hasMoved && dragState.dialogueId === pt.dialogueId;
              const isSelected = selectedDialogue === pt.dialogueId && !dragState.isDragging;
              const displayText = getDisplayText(pt.text, pt.lineBreak);
              const isMultiLine = displayText.includes('\n');
              return (
                <View
                  key={pt.dialogueId}
                  className={classnames(
                    styles.placedText,
                    isSelected && styles.selected,
                    isDraggingThis && styles.dragging
                  )}
                  style={{
                    left: `${pt.x}rpx`,
                    top: `${pt.y}rpx`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onTouchStart={(e) => handlePlacedTextTouchStart(e, pt.dialogueId)}
                  onClick={() => handleTextClick(pt.dialogueId)}
                >
                  <Text
                    className={classnames(
                      styles.textContent,
                      pt.isVertical && styles.verticalText,
                      isMultiLine && !pt.isVertical && styles.multiLineText
                    )}
                    style={{
                      fontSize: `${pt.fontSize}rpx`,
                      letterSpacing: `${pt.letterSpacing}rpx`
                    }}
                  >
                    {displayText}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {dragPreview && (
        <View
          className={styles.dragPreview}
          style={{
            left: `${dragPreview.left}px`,
            top: `${dragPreview.top}px`,
            opacity: dragPreview.opacity
          }}
        >
          <Text
            className={classnames(
              styles.dragPreviewText,
              dragPreview.isVertical && styles.verticalText,
              dragPreview.text.includes('\n') && styles.multiLineText
            )}
            style={{
              fontSize: `${dragPreview.fontSize}rpx`,
              letterSpacing: `${dragPreview.letterSpacing}rpx`
            }}
          >
            {dragPreview.text}
          </Text>
        </View>
      )}

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

            <View className={styles.settingGroup}>
              <View className={styles.lineBreakHeader}>
                <Text className={styles.settingLabel}>断行编辑</Text>
                <Button
                  className={styles.lineBreakToggle}
                  onClick={handleToggleLineBreakEditor}
                >
                  {showLineBreakEditor ? '收起' : '编辑'}
                </Button>
              </View>
              {currentDialogue && (
                <Text className={styles.lineBreakHint}>
                  {currentSettings.lineBreak.length > 0
                    ? `已断${currentSettings.lineBreak.length}处`
                    : '点击字间插入断行点'
                  }
                </Text>
              )}
              {showLineBreakEditor && currentDialogue && (
                <View className={styles.lineBreakEditor}>
                  <View className={styles.lineBreakText}>
                    {currentDialogue.text.split('').map((char, index) => (
                      <React.Fragment key={index}>
                        <Text
                          className={styles.lineBreakChar}
                          onClick={() => {
                            if (currentSettings.lineBreak.includes(index)) {
                              handleRemoveLineBreak(index);
                            } else {
                              handleAddLineBreak(index);
                            }
                          }}
                        >
                          {char}
                        </Text>
                        {index < currentDialogue.text.length - 1 && (
                          <View
                            className={classnames(
                              styles.lineBreakPoint,
                              currentSettings.lineBreak.includes(index + 1) && styles.active
                            )}
                            onClick={() => {
                              if (currentSettings.lineBreak.includes(index + 1)) {
                                handleRemoveLineBreak(index + 1);
                              } else {
                                handleAddLineBreak(index + 1);
                              }
                            }}
                          >
                            {currentSettings.lineBreak.includes(index + 1) && (
                              <Text className={styles.lineBreakArrow}>↵</Text>
                            )}
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                  {currentSettings.lineBreak.length > 0 && (
                    <View className={styles.lineBreakPreview}>
                      <Text className={styles.lineBreakPreviewLabel}>预览效果：</Text>
                      <Text className={styles.lineBreakPreviewText}>
                        {getDisplayText(currentDialogue.text, currentSettings.lineBreak)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        <View className={styles.dialoguesSection}>
          <Text className={styles.dialoguesTitle}>待嵌台词（拖动到气泡中）</Text>
          <View className={styles.dialoguesList}>
            {exercise.dialogues.map((dialogue, index) => {
              const bubble = exercise.bubbles.find(b => b.id === dialogue.targetBubbleId);
              const placed = isDialoguePlaced(dialogue.id);
              const isDraggingThis = dragState.isDragging && dragState.hasMoved && dragState.dialogueId === dialogue.id;
              return (
                <View
                  key={dialogue.id}
                  className={classnames(
                    styles.dialogueItem,
                    selectedDialogue === dialogue.id && styles.selected,
                    placed && styles.placed,
                    isDraggingThis && styles.draggingItem
                  )}
                  onTouchStart={(e) => handleDialogueTouchStart(e, dialogue.id)}
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
                    {placed ? '✓' : '拖动'}
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
