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

const splitTextByLineBreak = (text: string, lineBreak?: number[]): string[] => {
  if (!lineBreak || lineBreak.length === 0) return [text];
  const breaks = [...lineBreak].sort((a, b) => a - b);
  const lines: string[] = [];
  let lastIdx = 0;
  breaks.forEach(brk => {
    if (brk > lastIdx && brk <= text.length) {
      lines.push(text.slice(lastIdx, brk));
      lastIdx = brk;
    }
  });
  lines.push(text.slice(lastIdx));
  return lines.filter(l => l.length > 0);
};

const calculateTextBounds = (
  text: string,
  x: number,
  y: number,
  fontSize: number,
  letterSpacing: number,
  isVertical: boolean,
  lineBreak?: number[]
): TextBounds => {
  const lines = splitTextByLineBreak(text, lineBreak);
  const lineCount = lines.length;
  const maxLineLength = Math.max(...lines.map(l => l.length));

  let textWidth: number;
  let textHeight: number;

  if (isVertical) {
    textWidth = lineCount * fontSize * LINE_HEIGHT_RATIO;
    textHeight = maxLineLength * (fontSize + letterSpacing);
  } else {
    textWidth = maxLineLength * (fontSize + letterSpacing);
    textHeight = lineCount * fontSize * LINE_HEIGHT_RATIO;
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
  const overflowLeft = Math.max(0, bubbleBounds.left - textBounds.left);
  const overflowRight = Math.max(0, textBounds.right - bubbleBounds.right);
  const overflowTop = Math.max(0, bubbleBounds.top - textBounds.top);
  const overflowBottom = Math.max(0, textBounds.bottom - bubbleBounds.bottom);

  const maxHorizontalOverflow = Math.max(overflowLeft, overflowRight);
  const maxVerticalOverflow = Math.max(overflowTop, overflowBottom);

  const horizontalOverflowRatio = maxHorizontalOverflow / bubbleBounds.width;
  const verticalOverflowRatio = maxVerticalOverflow / bubbleBounds.height;
  const totalOverflowRatio = Math.max(horizontalOverflowRatio, verticalOverflowRatio);

  return {
    overflowLeft,
    overflowRight,
    overflowTop,
    overflowBottom,
    maxOverflow: Math.max(maxHorizontalOverflow, maxVerticalOverflow),
    totalOverflowRatio
  };
};

export const calculateScore = (context: ScoringContext): ScoreResult => {
  const { exercise, answers, imageWidth, imageHeight } = context;
  const items: ScoreItem[] = [];
  const problemBubbles: string[] = [];

  const readabilityScore = evaluateReadability(exercise, answers);
  items.push(readabilityScore);
  readabilityScore.issues.forEach(i => { if (!problemBubbles.includes(i.bubbleId)) problemBubbles.push(i.bubbleId); });

  const boundaryScore = evaluateBoundary(exercise, answers, imageWidth, imageHeight);
  items.push(boundaryScore);
  boundaryScore.issues.forEach(i => { if (!problemBubbles.includes(i.bubbleId)) problemBubbles.push(i.bubbleId); });

  const centeringScore = evaluateCentering(exercise, answers, imageWidth, imageHeight);
  items.push(centeringScore);
  centeringScore.issues.forEach(i => { if (!problemBubbles.includes(i.bubbleId)) problemBubbles.push(i.bubbleId); });

  const punctuationScore = evaluatePunctuation(exercise, answers);
  items.push(punctuationScore);
  punctuationScore.issues.forEach(i => { if (!problemBubbles.includes(i.bubbleId)) problemBubbles.push(i.bubbleId); });

  const typographyScore = evaluateTypography(exercise, answers);
  items.push(typographyScore);
  typographyScore.issues.forEach(i => { if (!problemBubbles.includes(i.bubbleId)) problemBubbles.push(i.bubbleId); });

  const lineBreakScore = evaluateLineBreak(exercise, answers);
  items.push(lineBreakScore);
  lineBreakScore.issues.forEach(i => { if (!problemBubbles.includes(i.bubbleId)) problemBubbles.push(i.bubbleId); });

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const maxScore = items.reduce((sum, item) => sum + item.maxScore, 0);
  const ratio = totalScore / maxScore;

  let level: 'excellent' | 'good' | 'improve' = 'improve';
  if (ratio >= 0.9) level = 'excellent';
  else if (ratio >= 0.7) level = 'good';

  const dialogueIssuesMap = new Map<string, { dialogueId: string; bubbleId: string; issues: string[] }>();
  answers.forEach(answer => {
    const key = `${answer.dialogueId}_${answer.bubbleId}`;
    if (!dialogueIssuesMap.has(key)) {
      dialogueIssuesMap.set(key, { dialogueId: answer.dialogueId, bubbleId: answer.bubbleId, issues: [] });
    }
  });

  items.forEach(item => {
    item.issues.forEach(issue => {
      if (issue.dialogueId) {
        const key = `${issue.dialogueId}_${issue.bubbleId}`;
        const entry = dialogueIssuesMap.get(key);
        if (entry) {
          entry.issues.push(`${item.category}：${issue.message}`);
        }
      }
    });
  });

  return {
    totalScore,
    maxScore,
    level,
    items,
    problemBubbles: [...new Set(problemBubbles)],
    dialogueIssues: Array.from(dialogueIssuesMap.values()).filter(d => d.issues.length > 0)
  };
};

const evaluateReadability = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; dialogueId: string; message: string }[] = [];
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
        dialogueId: answer.dialogueId,
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
  const issues: { bubbleId: string; dialogueId: string; message: string }[] = [];
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
      answer.isVertical,
      answer.lineBreak
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
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字离气泡边缘太近' });
    } else if (overflow.totalOverflowRatio <= 0.15) {
      score += 3;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字轻微压线' });
    } else if (overflow.totalOverflowRatio <= 0.3) {
      score += 2;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字明显超出气泡' });
    } else {
      score += 1;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字严重超出气泡范围' });
    }
  });

  return { category: '边界检测', score, maxScore, issues };
};

const evaluateCentering = (
  exercise: Exercise,
  answers: UserAnswer[],
  imageWidth: number,
  imageHeight: number
): ScoreItem => {
  const issues: { bubbleId: string; dialogueId: string; message: string }[] = [];
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
      answer.isVertical,
      answer.lineBreak
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
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字稍有偏移' });
    } else if (totalOffsetRatio <= 0.5) {
      score += 3;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字未在气泡中居中' });
    } else if (totalOffsetRatio <= 0.75) {
      score += 2;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字偏离中心较多' });
    } else {
      score += 1;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '文字严重偏离中心' });
    }
  });

  return { category: '气泡居中', score, maxScore, issues };
};

const evaluatePunctuation = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; dialogueId: string; message: string }[] = [];
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
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '语气符号位置不当' });
    }
  });

  return { category: '语气符号', score, maxScore, issues };
};

const evaluateTypography = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; dialogueId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 10;

  answers.forEach(answer => {
    const correct = exercise.correctAnswers.find(c => c.dialogueId === answer.dialogueId);
    if (!correct) return;

    let itemScore = 10;

    if (answer.isVertical !== correct.isVertical) {
      itemScore -= 3;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: `应为${correct.isVertical ? '竖排' : '横排'}` });
    }

    const fontSizeDiff = Math.abs(answer.fontSize - correct.fontSize);
    if (fontSizeDiff > 4) {
      itemScore -= 3;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: `字号建议${correct.fontSize}px` });
    } else if (fontSizeDiff > 2) {
      itemScore -= 1;
    }

    const letterSpacingDiff = Math.abs(answer.letterSpacing - correct.letterSpacing);
    if (letterSpacingDiff > 3) {
      itemScore -= 3;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: `字距建议${correct.letterSpacing}px` });
    } else if (letterSpacingDiff > 1) {
      itemScore -= 1;
    }

    score += Math.max(0, itemScore);
  });

  return { category: '排版审美', score, maxScore, issues };
};

const evaluateLineBreak = (exercise: Exercise, answers: UserAnswer[]): ScoreItem => {
  const issues: { bubbleId: string; dialogueId: string; message: string }[] = [];
  let score = 0;
  const maxScore = exercise.dialogues.length * 5;

  answers.forEach(answer => {
    const correct = exercise.correctAnswers.find(c => c.dialogueId === answer.dialogueId);
    if (!correct) return;

    const hasRecommendedBreaks = correct.lineBreak && correct.lineBreak.length > 0;
    const userHasBreaks = answer.lineBreak && answer.lineBreak.length > 0;

    if (!hasRecommendedBreaks) {
      score += 5;
    } else if (hasRecommendedBreaks && !userHasBreaks) {
      score += 1;
      issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '长句建议断行但未断行' });
    } else if (hasRecommendedBreaks && userHasBreaks) {
      const userBreaks = [...(answer.lineBreak || [])].sort((a, b) => a - b);
      const correctBreaks = [...(correct.lineBreak || [])].sort((a, b) => a - b);
      const breaksMatch = userBreaks.length === correctBreaks.length &&
        userBreaks.every((v, i) => v === correctBreaks[i]);

      if (breaksMatch) {
        score += 5;
      } else {
        score += 3;
        issues.push({ bubbleId: answer.bubbleId, dialogueId: answer.dialogueId, message: '断行位置与推荐不同' });
      }
    } else {
      score += 4;
    }
  });

  return { category: '断行合理', score, maxScore, issues };
};

export const getScoreColor = (level: string): string => {
  switch (level) {
    case 'excellent': return '#00B894';
    case 'good': return '#FDCB6E';
    case 'improve': return '#FF7675';
    default: return '#636E72';
  }
};

export const getScoreText = (level: string): string => {
  switch (level) {
    case 'excellent': return '优秀';
    case 'good': return '良好';
    case 'improve': return '继续努力';
    default: return '未评分';
  }
};
