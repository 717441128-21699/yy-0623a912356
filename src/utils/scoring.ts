import { UserAnswer, ScoreResult, ScoreItem, Exercise } from '@/types';

interface ScoringContext {
  exercise: Exercise;
  answers: UserAnswer[];
  imageWidth: number;
  imageHeight: number;
}

interface TextBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

const LINE_HEIGHT_RATIO = 1.4;

const getDialogueText = (exercise: Exercise, dialogueId: string): string => {
  const dialogue = exercise.dialogues.find(d => d.id === dialogueId);
  return dialogue?.text || '';
};

const calculateTextBounds = (
  text: string,
  x: number,
  y: number,
  fontSize: number,
  letterSpacing: number,
  isVertical: boolean
): TextBounds => {
  const charCount = text.length;
  let textWidth: number;
  let textHeight: number;

  if (isVertical) {
    textWidth = fontSize * LINE_HEIGHT_RATIO;
    textHeight = charCount * (fontSize + letterSpacing);
  } else {
    textWidth = charCount * (fontSize + letterSpacing);
    textHeight = fontSize * LINE_HEIGHT_RATIO;
  }

  return {
    left: x - textWidth / 2,
    right: x + textWidth / 2,
    top: y - textHeight / 2,
    bottom: y + textHeight / 2,
    width: textWidth,
    height: textHeight
  };
};

const getBubbleBounds = (
  bubble: { x: number; y: number; width: number; height: number },
  scaleX: number,
  scaleY: number
) => {
  return {
    left: bubble.x * scaleX,
    right: (bubble.x + bubble.width) * scaleX,
    top: bubble.y * scaleY,
    bottom: (bubble.y + bubble.height) * scaleY,
    width: bubble.width * scaleX,
    height: bubble.height * scaleY,
    centerX: (bubble.x + bubble.width / 2) * scaleX,
    centerY: (bubble.y + bubble.height / 2) * scaleY
  };
};

const calculateOverflow = (textBounds: TextBounds, bubbleBounds: ReturnType<typeof getBubbleBounds>) => {
  let overflowLeft = Math.max(0, bubbleBounds.left - textBounds.left);
  let overflowRight = Math.max(0, textBounds.right - bubbleBounds.right);
  let overflowTop = Math.max(0, bubbleBounds.top - textBounds.top);
  let overflowBottom = Math.max(0, textBounds.bottom - bubbleBounds.bottom);

  const maxHorizontalOverflow = Math.max(overflowLeft, overflowRight);
  const maxVerticalOverflow = Math.max(overflowTop, overflowBottom);
  const maxOverflow = Math.max(maxHorizontalOverflow, maxVerticalOverflow);

  const horizontalOverflowRatio = maxHorizontalOverflow / bubbleBounds.width;
  const verticalOverflowRatio = maxVerticalOverflow / bubbleBounds.height;
  const totalOverflowRatio = Math.max(horizontalOverflowRatio, verticalOverflowRatio);

  return {
    overflowLeft,
    overflowRight,
    overflowTop,
    overflowBottom,
    maxOverflow,
    totalOverflowRatio
  };
};

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

  const scaleX = imageWidth / 750;
  const scaleY = imageHeight / 1000;

  answers.forEach(answer => {
    const bubble = exercise.bubbles.find(b => b.id === answer.bubbleId);
    if (!bubble) return;

    const text = getDialogueText(exercise, answer.dialogueId);
    const textBounds = calculateTextBounds(
      text,
      answer.x,
      answer.y,
      answer.fontSize,
      answer.letterSpacing,
      answer.isVertical
    );
    const bubbleBounds = getBubbleBounds(bubble, scaleX, scaleY);
    const overflow = calculateOverflow(textBounds, bubbleBounds);

    const paddingRatio = 0.08;
    const safePadding = Math.min(bubbleBounds.width, bubbleBounds.height) * paddingRatio;

    const textInsideWithPadding =
      textBounds.left >= bubbleBounds.left + safePadding &&
      textBounds.right <= bubbleBounds.right - safePadding &&
      textBounds.top >= bubbleBounds.top + safePadding &&
      textBounds.bottom <= bubbleBounds.bottom - safePadding;

    if (textInsideWithPadding) {
      score += 5;
    } else if (overflow.totalOverflowRatio <= 0.05) {
      score += 4;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字离气泡边缘太近'
      });
    } else if (overflow.totalOverflowRatio <= 0.15) {
      score += 3;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字轻微压线'
      });
    } else if (overflow.totalOverflowRatio <= 0.3) {
      score += 2;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字明显超出气泡'
      });
    } else {
      score += 1;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字严重超出气泡范围'
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

  const scaleX = imageWidth / 750;
  const scaleY = imageHeight / 1000;

  answers.forEach(answer => {
    const bubble = exercise.bubbles.find(b => b.id === answer.bubbleId);
    if (!bubble) return;

    const text = getDialogueText(exercise, answer.dialogueId);
    const textBounds = calculateTextBounds(
      text,
      answer.x,
      answer.y,
      answer.fontSize,
      answer.letterSpacing,
      answer.isVertical
    );
    const bubbleBounds = getBubbleBounds(bubble, scaleX, scaleY);

    const textCenterX = (textBounds.left + textBounds.right) / 2;
    const textCenterY = (textBounds.top + textBounds.bottom) / 2;

    const offsetX = Math.abs(textCenterX - bubbleBounds.centerX);
    const offsetY = Math.abs(textCenterY - bubbleBounds.centerY);

    const maxHorizontalOffset = (bubbleBounds.width - textBounds.width) / 2;
    const maxVerticalOffset = (bubbleBounds.height - textBounds.height) / 2;

    const horizontalRatio = maxHorizontalOffset > 0 ? offsetX / maxHorizontalOffset : 0;
    const verticalRatio = maxVerticalOffset > 0 ? offsetY / maxVerticalOffset : 0;
    const totalOffsetRatio = Math.max(horizontalRatio, verticalRatio);

    if (totalOffsetRatio <= 0.1) {
      score += 5;
    } else if (totalOffsetRatio <= 0.25) {
      score += 4;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字稍有偏移'
      });
    } else if (totalOffsetRatio <= 0.5) {
      score += 3;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字未在气泡中居中'
      });
    } else if (totalOffsetRatio <= 0.75) {
      score += 2;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字偏离中心较多'
      });
    } else {
      score += 1;
      issues.push({
        bubbleId: answer.bubbleId,
        message: '文字严重偏离中心'
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
