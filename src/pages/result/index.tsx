import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getExerciseById } from '@/data/exercises';
import { Exercise, ScoreResult, PlacedText } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import ScoreIndicator from '@/components/ScoreIndicator';
import styles from './index.module.scss';

const getDisplayText = (text: string, lineBreak?: number[]): string => {
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

const ResultPage: React.FC = () => {
  const router = useRouter();
  const { lastScore, lastPlacedTexts, exerciseRecords } = useUserStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [placedTexts, setPlacedTexts] = useState<PlacedText[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 750, height: 1000 });
  const [activeDialogue, setActiveDialogue] = useState<string | null>(null);

  const exerciseId = router.params.id || 'ex-001';
  const recordId = router.params.recordId;

  useEffect(() => {
    const ex = getExerciseById(exerciseId as string);
    if (ex) {
      setExercise(ex);
      setImageLoaded(false);
      setImageError(false);
    }

    if (recordId) {
      const record = exerciseRecords.find(r => r.id === recordId);
      if (record) {
        setScoreResult(record.scoreResult);
        setPlacedTexts(record.placedTexts || []);
        return;
      }
    }

    if (lastScore) {
      setScoreResult(lastScore);
    }
    if (lastPlacedTexts && lastPlacedTexts.length > 0) {
      setPlacedTexts(lastPlacedTexts);
    }
  }, [exerciseId, lastScore, lastPlacedTexts, recordId, exerciseRecords]);

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

  const handleViewExample = () => {
    if (!exercise) return;
    Taro.redirectTo({
      url: `/pages/example/index?id=${exercise.id}`
    });
  };

  const handleRetry = () => {
    if (!exercise) return;
    Taro.redirectTo({
      url: `/pages/editor/index?id=${exercise.id}`
    });
  };

  const handleBackHome = () => {
    Taro.switchTab({
      url: '/pages/home/index'
    });
  };

  if (!exercise || !scoreResult) {
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

  const dialogueIssueMap = new Map<string, string[]>();
  scoreResult.dialogueIssues.forEach(di => {
    dialogueIssueMap.set(di.dialogueId, di.issues);
  });

  const problemDialogueIds = new Set(scoreResult.dialogueIssues.map(d => d.dialogueId));

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.scoreSection}>
          <ScoreIndicator result={scoreResult} showIssues={false} />
        </View>

        <View className={styles.imageSection}>
          <Text className={styles.sectionTitle}>嵌字成品回放</Text>
          <View className={classnames(styles.imageWrapper, !imageLoaded && styles.imageLoading)}>
            {!imageLoaded && !imageError && (
              <View className={styles.skeleton}>
                <View className={styles.skeletonShimmer} />
              </View>
            )}
            {imageError && (
              <View className={styles.imageError}>
                <Text className={styles.errorIcon}>🖼️</Text>
                <Text className={styles.errorText}>图片加载失败</Text>
              </View>
            )}
            <Image
              className={classnames(styles.comicImage, imageLoaded && styles.imageVisible)}
              src={exercise.imageUrl}
              mode='widthFix'
              onLoad={handleImageLoad}
              onError={handleImageError}
              lazyLoad
            />
            <View className={styles.bubbleOverlay}>
              {exercise.bubbles.map((bubble, index) => {
                const hasProblem = scoreResult.problemBubbles.includes(bubble.id);
                const placed = placedTexts.find(p => p.bubbleId === bubble.id);
                return (
                  <View
                    key={bubble.id}
                    className={classnames(
                      styles.bubbleBox,
                      hasProblem && styles.problemBubble
                    )}
                    style={{
                      left: `${bubble.x * scaleX}rpx`,
                      top: `${bubble.y * scaleY}rpx`,
                      width: `${bubble.width * scaleX}rpx`,
                      height: `${bubble.height * scaleY}rpx`
                    }}
                    onClick={() => placed && setActiveDialogue(activeDialogue === placed.dialogueId ? null : placed.dialogueId)}
                  >
                    {hasProblem && (
                      <View className={styles.bubbleErrorLabel}>
                        <Text>问题</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            <View className={styles.placedTextOverlay}>
              {placedTexts.map((pt) => {
                const hasIssue = problemDialogueIds.has(pt.dialogueId);
                const displayText = getDisplayText(pt.text, pt.lineBreak);
                const isMultiLine = displayText.includes('\n');
                return (
                  <View
                    key={pt.dialogueId}
                    className={classnames(
                      styles.placedTextView,
                      hasIssue && styles.placedTextIssue,
                      activeDialogue === pt.dialogueId && styles.placedTextActive
                    )}
                    style={{
                      left: `${pt.x}rpx`,
                      top: `${pt.y}rpx`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => setActiveDialogue(activeDialogue === pt.dialogueId ? null : pt.dialogueId)}
                  >
                    <Text
                      className={classnames(
                        styles.placedTextContent,
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
          <View className={styles.tip}>
            <Text className={styles.tipIcon}>👆</Text>
            <Text className={styles.tipText}>
              点击图中的台词可以查看对应的评分详情，红框标注的是有问题的气泡
            </Text>
          </View>
        </View>

        <View className={styles.dialogueSection}>
          <Text className={styles.sectionTitle}>逐句复盘</Text>
          <View className={styles.dialogueList}>
            {exercise.dialogues.map((dialogue, index) => {
              const placed = placedTexts.find(p => p.dialogueId === dialogue.id);
              const issues = dialogueIssueMap.get(dialogue.id) || [];
              const hasIssues = issues.length > 0;
              const isActive = activeDialogue === dialogue.id;
              const correct = exercise.correctAnswers.find(c => c.dialogueId === dialogue.id);
              return (
                <View
                  key={dialogue.id}
                  className={classnames(
                    styles.dialogueCard,
                    hasIssues && styles.dialogueCardIssue,
                    isActive && styles.dialogueCardActive
                  )}
                  onClick={() => setActiveDialogue(isActive ? null : dialogue.id)}
                >
                  <View className={styles.dialogueCardHeader}>
                    <View className={styles.dialogueCardIndex}>
                      <Text>{index + 1}</Text>
                    </View>
                    <Text className={styles.dialogueCardText}>{dialogue.text}</Text>
                    {hasIssues ? (
                      <Text className={styles.dialogueCardBadge}>⚠️</Text>
                    ) : (
                      <Text className={styles.dialogueCardBadge}>✅</Text>
                    )}
                  </View>

                  {placed && (
                    <View className={styles.dialogueSettings}>
                      <View className={styles.settingTag}>
                        <Text className={styles.settingLabel}>排版</Text>
                        <Text className={classnames(styles.settingValue, placed.isVertical !== correct?.isVertical && styles.wrong)}>
                          {placed.isVertical ? '竖排' : '横排'}
                        </Text>
                        {correct && placed.isVertical !== correct.isVertical && (
                          <Text className={styles.correctHint}>→ {correct.isVertical ? '竖排' : '横排'}</Text>
                        )}
                      </View>
                      <View className={styles.settingTag}>
                        <Text className={styles.settingLabel}>字号</Text>
                        <Text className={classnames(styles.settingValue, Math.abs(placed.fontSize - (correct?.fontSize || 26)) > 4 && styles.wrong)}>
                          {placed.fontSize}
                        </Text>
                        {correct && Math.abs(placed.fontSize - correct.fontSize) > 4 && (
                          <Text className={styles.correctHint}>→ {correct.fontSize}</Text>
                        )}
                      </View>
                      <View className={styles.settingTag}>
                        <Text className={styles.settingLabel}>字距</Text>
                        <Text className={classnames(styles.settingValue, Math.abs(placed.letterSpacing - (correct?.letterSpacing || 2)) > 3 && styles.wrong)}>
                          {placed.letterSpacing}
                        </Text>
                        {correct && Math.abs(placed.letterSpacing - correct.letterSpacing) > 3 && (
                          <Text className={styles.correctHint}>→ {correct.letterSpacing}</Text>
                        )}
                      </View>
                      <View className={styles.settingTag}>
                        <Text className={styles.settingLabel}>断行</Text>
                        <Text className={styles.settingValue}>
                          {placed.lineBreak && placed.lineBreak.length > 0 ? `${placed.lineBreak.length}处` : '无'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {hasIssues && isActive && (
                    <View className={styles.dialogueIssues}>
                      {issues.map((issue, i) => (
                        <View key={i} className={styles.issueRow}>
                          <Text className={styles.issueDot}>•</Text>
                          <Text className={styles.issueText}>{issue}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!placed && (
                    <Text className={styles.notPlaced}>未放置</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.issuesSection}>
          <Text className={styles.sectionTitle}>改进建议</Text>
          {scoreResult.dialogueIssues.length > 0 ? (
            <View className={styles.issuesList}>
              {scoreResult.dialogueIssues.map((di, index) => {
                const dialogue = exercise.dialogues.find(d => d.id === di.dialogueId);
                const bubble = exercise.bubbles.find(b => b.id === di.bubbleId);
                const bubbleIndex = exercise.bubbles.findIndex(b => b.id === di.bubbleId);
                return (
                  <View key={index} className={styles.issueCard}>
                    <Text className={styles.issueIcon}>❌</Text>
                    <View className={styles.issueContent}>
                      <Text className={styles.issueTitle}>
                        气泡{bubbleIndex + 1}：{dialogue?.text || '未知'}
                      </Text>
                      {di.issues.map((issue, i) => (
                        <Text key={i} className={styles.issueDesc}>• {issue}</Text>
                      ))}
                    </View>
                  </View>
                );
              })}
              {scoreResult.items.map((item) => {
                if (item.score === item.maxScore) {
                  return (
                    <View key={item.category} className={classnames(styles.issueCard, styles.successCard)}>
                      <Text className={styles.issueIcon}>✅</Text>
                      <View className={styles.issueContent}>
                        <Text className={styles.issueTitle}>{item.category}</Text>
                        <Text className={styles.issueDesc}>
                          此项做得非常好，得分 {item.score}/{item.maxScore}
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.successIconBig}>🏆</Text>
              <Text className={styles.emptyText}>完美嵌字！</Text>
              <Text className={styles.emptyHint}>
                所有项目都获得了满分，你已经掌握了漫画嵌字的精髓！
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleRetry}>
          再练一次
        </Button>
        <Button className={styles.primaryBtn} onClick={handleViewExample}>
          看示例
        </Button>
        <Button className={styles.homeBtn} onClick={handleBackHome}>
          回首页
        </Button>
      </View>
    </View>
  );
};

export default ResultPage;
