import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getExerciseById } from '@/data/exercises';
import { Exercise, ScoreResult, ScoreItem } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import ScoreIndicator from '@/components/ScoreIndicator';
import styles from './index.module.scss';

const ResultPage: React.FC = () => {
  const router = useRouter();
  const { lastScore } = useUserStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 750, height: 1000 });

  const exerciseId = router.params.id || 'ex-001';

  useEffect(() => {
    const ex = getExerciseById(exerciseId as string);
    if (ex) {
      setExercise(ex);
      setImageLoaded(false);
      setImageError(false);
    }
    if (lastScore) {
      setScoreResult(lastScore);
    }
  }, [exerciseId, lastScore]);

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

  const allIssues = scoreResult.items.reduce((acc, item) => {
    return [...acc, ...item.issues];
  }, [] as ScoreItem['issues']);

  const problemBubbleMap = new Map<string, string[]>();
  allIssues.forEach(issue => {
    if (!problemBubbleMap.has(issue.bubbleId)) {
      problemBubbleMap.set(issue.bubbleId, []);
    }
    problemBubbleMap.get(issue.bubbleId)!.push(issue.message);
  });

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.scoreSection}>
          <ScoreIndicator result={scoreResult} showIssues={false} />
        </View>

        <View className={styles.imageSection}>
          <Text className={styles.sectionTitle}>问题标记</Text>
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
            {scoreResult.problemBubbles.length > 0 && (
              <View className={styles.errorOverlay}>
                {exercise.bubbles
                  .filter(b => scoreResult.problemBubbles.includes(b.id))
                  .map((bubble, index) => (
                    <View
                      key={bubble.id}
                      className={styles.errorBox}
                      style={{
                        left: `${bubble.x * scaleX}rpx`,
                        top: `${bubble.y * scaleY}rpx`,
                        width: `${bubble.width * scaleX}rpx`,
                        height: `${bubble.height * scaleY}rpx`
                      }}
                    >
                      <View className={styles.errorLabel}>
                        <Text>问题{index + 1}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </View>
          {scoreResult.problemBubbles.length > 0 ? (
            <View className={styles.tip}>
              <Text className={styles.tipIcon}>⚠️</Text>
              <Text className={styles.tipText}>
                红框标记的气泡存在问题，请参考下方改进建议，或查看优秀示例学习正确的嵌字方式。
              </Text>
            </View>
          ) : (
            <View className={styles.tip} style={{ background: 'rgba(0, 184, 146, 0.1)' }}>
              <Text className={styles.tipIcon}>🎉</Text>
              <Text className={styles.tipText} style={{ color: '#00B894' }}>
                太棒了！所有气泡都嵌得非常完美，继续保持！
              </Text>
            </View>
          )}
        </View>

        <View className={styles.issuesSection}>
          <Text className={styles.sectionTitle}>改进建议</Text>
          {allIssues.length > 0 ? (
            <View className={styles.issuesList}>
              {exercise.bubbles.map((bubble, index) => {
                const issues = problemBubbleMap.get(bubble.id) || [];
                if (issues.length === 0) return null;
                const dialogue = exercise.dialogues.find(d => d.targetBubbleId === bubble.id);
                return (
                  <View key={bubble.id} className={styles.issueCard}>
                    <Text className={styles.issueIcon}>❌</Text>
                    <View className={styles.issueContent}>
                      <Text className={styles.issueTitle}>
                        气泡 {index + 1}：{dialogue?.text || '未知'}
                      </Text>
                      {issues.map((issue, i) => (
                        <Text key={i} className={styles.issueDesc}>
                          • {issue}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })}
              {scoreResult.items.map((item) => {
                if (item.score === item.maxScore) {
                  return (
                    <View key={item.category} className={classnames(styles.issueCard, styles.successCard)}>
                      <Text className={classnames(styles.issueIcon, styles.successIcon)}>✅</Text>
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
