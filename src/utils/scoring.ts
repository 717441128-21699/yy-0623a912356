import { UserAnswer, ScoreResult, ScoreItem, Exercise } from '@/types';

interface ScoringContext {
  exercise: Exercise;
  answers: UserAnswer[];
  imageWidth: number;
  imageHeight: number;
}

export const calculateScore = (context: ScoringContext): ScoreResult => {
  const { exercise, answers, imageWidth, imageHeight } = context;
  const items: ScoreItem[] = [];
  const problemBubbles: string[] = [];

  const readabilityScore = evaluateReadability(exercise, answers);
  items.push(readabilityScore);
  if (readabilityScore.score < readabilityScore.maxScore) {
    readabilityScore.issues.forEach(i => problemBubbles.push(i.bubbleId));
  }

  const boundaryScore = evaluateBoundary(exercise, answers, imageWidth, imageHeight);
  items.push(boundaryScore);
  if (boundaryScore.score < boundaryScore.maxScore) {
    boundaryScore.issues.forEach(i => problemBubbles.push(i.bubbleId));
  }

  const centeringScore = evaluateCentering(exercise, answers, imageWidth, imageHeight);
  items.push(centeringScore);
  if (centeringScore.score < centeringScore.maxScore) {
    centeringScore.issues.forEach(i => problemBubbles.push(i.bubbleId));
  }

  const punctuationScore = evaluatePunctuation(exercise, answers);
  items.push(punctuationScore);
  if (punctuationScore.score < punctuationScore.maxScore) {
    punctuationScore.issues.forEach(i => problemBubbles.push(i.bubbleId));
  }

  const typographyScore = evaluateTypography(exercise, answers);
  items.push(typographyScore);
  if (typographyScore.score < typographyScore.maxScore) {
    typographyScore.issues.forEach(i => problemBubbles.push(i.bubbleId));
  }

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const maxScore = items.reduce((sum, item) => sum + item.maxScore, 0);
  const ratio = totalScore / maxScore;

  let level: 'excellent' | 'good' | 'improve' = 'improve';
  if (ratio >= 0.9) level = 'excellent';
  else if (ratio >= 0.7) level = 'good';

  console.log('[Scoring] 评分完成', { totalScore, maxScore, level, problemBubbles });

  return {
    totalScore,
    maxScore,
    level,
    items,
    problemBubbles: [...new Set(problemBubbles)]
  };
};

const evaluateReadability = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 5;

  answers.forEach(answer => {
    const correct = exercise.correctAnswers.find(c => c.dialogueId === answer.dialogueId);
    if (!correct) return;

    if (answer.bubbleId === correct.bubbleId) {
      score += 5;
    } else {
      score += 1;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '台词与气泡不匹配'
      });
    }
  });

  return {
    category: '可读性',
    score,
    maxScore,
    issues
  };
};

const evaluateBoundary = (
  exercise: Exercise,
  answers: UserAnswer[],
  imageWidth: number,
  imageHeight: number
): ScoreItem => {
  const issues: { bubbleId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 5;

  answers.forEach(answer => {
    const bubble = exercise.bubbles.find(b => b.id === answer.bubbleId);
    if (!bubble) return;

    const scaleX = imageWidth / 750;
    const scaleY = imageHeight / 1000;

    const bubbleLeft = bubble.x * scaleX;
    const bubbleTop = bubble.y * scaleY;
    const bubbleRight = (bubble.x + bubble.width) * scaleX;
    const bubbleBottom = (bubble.y + bubble.height) * scaleY;

    const padding = 10 * scaleX;

    const isInside =
      answer.x >= bubbleLeft + padding &&
      answer.x <= bubbleRight - padding &&
      answer.y >= bubbleTop + padding &&
      answer.y <= bubbleBottom - padding;

    if (isInside) {
      score += 5;
    } else {
      score += 2;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字超出气泡边界'
      });
    }
  });

  return {
    category: '边界检测',
    score,
    maxScore,
    issues
  };
};

const evaluateCentering = (
  exercise: Exercise,
  answers: UserAnswer[],
  imageWidth: number,
  imageHeight: number
): ScoreItem => {
  const issues: { bubbleId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 5;

  answers.forEach(answer => {
    const bubble = exercise.bubbles.find(b => b.id === answer.bubbleId);
    if (!bubble) return;

    const scaleX = imageWidth / 750;
    const scaleY = imageHeight / 1000;

    const bubbleCenterX = (bubble.x + bubble.width / 2) * scaleX;
    const bubbleCenterY = (bubble.y + bubble.height / 2) * scaleY;

    const distance = Math.sqrt(
      Math.pow(answer.x - bubbleCenterX, 2) + Math.pow(answer.y - bubbleCenterY, 2)
    );

    const maxDistance = Math.min(bubble.width, bubble.height) * 0.3 * scaleX;

    if (distance < maxDistance) {
      score += 5;
    } else if (distance < maxDistance * 2) {
      score += 3;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字未在气泡中居中'
      });
    } else {
      score += 1;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字偏离气泡中心太远'
      });
    }
  });

  return {
    category: '气泡居中',
    score,
    maxScore,
    issues
  };
};

const evaluatePunctuation = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 5;

  answers.forEach(answer => {
    const dialogue = exercise.dialogues.find(d => d.id === answer.dialogueId);
    const correct = exercise.correctAnswers.find(c => c.dialogueId === answer.dialogueId);

    if (!dialogue || !correct) return;

    if (answer.bubbleId === correct.bubbleId) {
      score += 5;
    } else {
      score += 2;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '语气符号位置不当'
      });
    }
  });

  return {
    category: '语气符号',
    score,
    maxScore,
    issues
  };
};

const evaluateTypography = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 10;

  answers.forEach(answer => {
    const correct = exercise.correctAnswers.find(c => c.dialogueId === answer.dialogueId);
    if (!correct) return;

    let itemScore = 10;

    if (answer.isVertical !== correct.isVertical) {
      itemScore -= 3;
      issues.push({
        bubbleId: answer.bubbleId,
        message: `应为${correct.isVertical ? '竖排' : '横排'}`
      });
    }

    const fontSizeDiff = Math.abs(answer.fontSize - correct.fontSize);
    if (fontSizeDiff > 4) {
      itemScore -= 3;
      issues.push({
        bubbleId: answer.bubbleId,
        message: `字号建议${correct.fontSize}px`
      });
    } else if (fontSizeDiff > 2) {
      itemScore -= 1;
    }

    const letterSpacingDiff = Math.abs(answer.letterSpacing - correct.letterSpacing);
    if (letterSpacingDiff > 3) {
      itemScore -= 3;
      issues.push({
        bubbleId: answer.bubbleId,
        message: `字距建议${correct.letterSpacing}px`
      });
    } else if (letterSpacingDiff > 1) {
      itemScore -= 1;
    }

    score += Math.max(0, itemScore);
  });

  return {
    category: '排版审美',
    score,
    maxScore,
    issues
  };
};

export const getScoreColor = (level: string): string => {
  switch (level) {
    case 'excellent':
      return '#00B894';
    case 'good':
      return '#FDCB6E';
    case 'improve':
      return '#FF7675';
    default:
      return '#636E72';
  }
};

export const getScoreText = (level: string): string => {
  switch (level) {
    case 'excellent':
      return '优秀';
    case 'good':
      return '良好';
    case 'improve':
      return '继续努力';
    default:
      return '未评分';
  }
};
