import { Exercise } from '@/types';

export const exercises: Exercise[] = [
  {
    id: 'ex-001',
    title: '日常对话练习',
    difficulty: 'easy',
    category: 'basic',
    imageUrl: 'https://picsum.photos/id/1015/750/1000',
    bubbles: [
      { id: 'b1', x: 50, y: 100, width: 200, height: 100, type: 'speech' },
      { id: 'b2', x: 450, y: 150, width: 180, height: 80, type: 'speech' },
      { id: 'b3', x: 100, y: 400, width: 150, height: 60, type: 'thought' }
    ],
    dialogues: [
      { id: 'd1', text: '早上好啊，今天天气真不错！', targetBubbleId: 'b1', mood: 'happy', punctuation: ['！'] },
      { id: 'd2', text: '是啊，我们出去走走吧。', targetBubbleId: 'b2', mood: 'calm', punctuation: ['。'] },
      { id: 'd3', text: '希望今天能有好事发生...', targetBubbleId: 'b3', mood: 'hopeful', punctuation: ['...'] }
    ],
    correctAnswers: [
      { dialogueId: 'd1', bubbleId: 'b1', isVertical: false, fontSize: 28, letterSpacing: 2 },
      { dialogueId: 'd2', bubbleId: 'b2', isVertical: false, fontSize: 26, letterSpacing: 1 },
      { dialogueId: 'd3', bubbleId: 'b3', isVertical: false, fontSize: 24, letterSpacing: 3 }
    ],
    exampleNotes: [
      { dialogueId: 'd1', reason: '这句话比较长，断成两行更便于阅读', tips: '长句在气泡中要考虑断行，保持每行10-15字最佳' },
      { dialogueId: 'd2', reason: '普通对话使用标准字号和字距', tips: '日常对话使用26-28号字，字距1-2' },
      { dialogueId: 'd3', reason: '心理活动可以稍小字号，增加字距表现内心感', tips: '心理活动、回忆场景可以适当缩小字号，增加字距' }
    ],
    unlockDays: 0
  },
  {
    id: 'ex-002',
    title: '竖排台词练习',
    difficulty: 'easy',
    category: 'basic',
    imageUrl: 'https://picsum.photos/id/1018/750/1000',
    bubbles: [
      { id: 'b1', x: 80, y: 120, width: 100, height: 200, type: 'speech' },
      { id: 'b2', x: 550, y: 100, width: 120, height: 180, type: 'speech' }
    ],
    dialogues: [
      { id: 'd1', text: '你终于来了，我等你好久了。', targetBubbleId: 'b1', mood: 'anxious', punctuation: ['。'] },
      { id: 'd2', text: '抱歉抱歉，路上堵车了！', targetBubbleId: 'b2', mood: 'apologetic', punctuation: ['！'] }
    ],
    correctAnswers: [
      { dialogueId: 'd1', bubbleId: 'b1', isVertical: true, fontSize: 28, letterSpacing: 4 },
      { dialogueId: 'd2', bubbleId: 'b2', isVertical: true, fontSize: 26, letterSpacing: 3 }
    ],
    exampleNotes: [
      { dialogueId: 'd1', reason: '古风/日式场景常用竖排，符合阅读习惯', tips: '竖排时字距要比横排稍大，通常3-5' },
      { dialogueId: 'd2', reason: '竖排能够节省水平空间，适合瘦高气泡', tips: '气泡瘦高时优先考虑竖排，避免字被挤扁' }
    ],
    unlockDays: 1
  },
  {
    id: 'ex-003',
    title: '密集对白处理',
    difficulty: 'medium',
    category: 'dense',
    imageUrl: 'https://picsum.photos/id/1036/750/1000',
    bubbles: [
      { id: 'b1', x: 30, y: 50, width: 160, height: 70, type: 'speech' },
      { id: 'b2', x: 250, y: 30, width: 140, height: 60, type: 'speech' },
      { id: 'b3', x: 450, y: 60, width: 150, height: 80, type: 'speech' },
      { id: 'b4', x: 100, y: 200, width: 180, height: 70, type: 'speech' },
      { id: 'b5', x: 350, y: 180, width: 160, height: 90, type: 'speech' }
    ],
    dialogues: [
      { id: 'd1', text: '等等，先听我说！', targetBubbleId: 'b1', mood: 'urgent', punctuation: ['！'] },
      { id: 'd2', text: '不要插嘴！', targetBubbleId: 'b2', mood: 'angry', punctuation: ['！'] },
      { id: 'd3', text: '这件事很重要，你们都听清楚了。', targetBubbleId: 'b3', mood: 'serious', punctuation: ['。'] },
      { id: 'd4', text: '可是这样做太危险了...', targetBubbleId: 'b4', mood: 'worried', punctuation: ['...'] },
      { id: 'd5', text: '没时间犹豫了，必须马上行动！', targetBubbleId: 'b5', mood: 'determined', punctuation: ['！'] }
    ],
    correctAnswers: [
      { dialogueId: 'd1', bubbleId: 'b1', isVertical: false, fontSize: 24, letterSpacing: 1 },
      { dialogueId: 'd2', bubbleId: 'b2', isVertical: false, fontSize: 24, letterSpacing: 0 },
      { dialogueId: 'd3', bubbleId: 'b3', isVertical: false, fontSize: 26, letterSpacing: 2 },
      { dialogueId: 'd4', bubbleId: 'b4', isVertical: false, fontSize: 24, letterSpacing: 2 },
      { dialogueId: 'd5', bubbleId: 'b5', isVertical: false, fontSize: 26, letterSpacing: 1 }
    ],
    exampleNotes: [
      { dialogueId: 'd1', reason: '密集对话要统一缩小字号，保证不压线', tips: '多个气泡聚集时，字号可适当缩小2-4号' },
      { dialogueId: 'd3', reason: '重要台词字号稍大，突出语气', tips: '在密集对话中，可以通过字号区分台词重要性' }
    ],
    unlockDays: 3
  },
  {
    id: 'ex-004',
    title: '拟声词处理',
    difficulty: 'medium',
    category: 'handwritten',
    imageUrl: 'https://picsum.photos/id/1039/750/1000',
    bubbles: [
      { id: 'b1', x: 100, y: 150, width: 250, height: 100, type: 'sound' },
      { id: 'b2', x: 400, y: 300, width: 180, height: 120, type: 'sound' },
      { id: 'b3', x: 200, y: 450, width: 150, height: 80, type: 'speech' }
    ],
    dialogues: [
      { id: 'd1', text: '哐当！！', targetBubbleId: 'b1', mood: 'loud', punctuation: ['！', '！'] },
      { id: 'd2', text: '哗啦啦——', targetBubbleId: 'b2', mood: 'continuous', punctuation: ['——'] },
      { id: 'd3', text: '发生什么事了？', targetBubbleId: 'b3', mood: 'surprised', punctuation: ['？'] }
    ],
    correctAnswers: [
      { dialogueId: 'd1', bubbleId: 'b1', isVertical: false, fontSize: 36, letterSpacing: 4 },
      { dialogueId: 'd2', bubbleId: 'b2', isVertical: true, fontSize: 32, letterSpacing: 6 },
      { dialogueId: 'd3', bubbleId: 'b3', isVertical: false, fontSize: 26, letterSpacing: 2 }
    ],
    exampleNotes: [
      { dialogueId: 'd1', reason: '拟声词要夸张，字号比台词大1.5倍', tips: '撞击、爆炸等强烈拟声词用大字号+粗体+大字距' },
      { dialogueId: 'd2', reason: '流水声等持续拟声词适合竖排，表现流动感', tips: '持续声音可以用竖排或斜排，增加动感' }
    ],
    unlockDays: 5
  },
  {
    id: 'ex-005',
    title: '跨格独白',
    difficulty: 'hard',
    category: 'cross-panel',
    imageUrl: 'https://picsum.photos/id/1044/750/1000',
    bubbles: [
      { id: 'b1', x: 50, y: 100, width: 300, height: 120, type: 'narration' },
      { id: 'b2', x: 400, y: 80, width: 280, height: 150, type: 'narration' },
      { id: 'b3', x: 150, y: 350, width: 200, height: 80, type: 'speech' }
    ],
    dialogues: [
      { id: 'd1', text: '那是一个风雨交加的夜晚，整个城市都笼罩在阴霾之中。', targetBubbleId: 'b1', mood: 'melancholic', punctuation: ['。'] },
      { id: 'd2', text: '没有人知道，一场改变命运的相遇即将发生。', targetBubbleId: 'b2', mood: 'mysterious', punctuation: ['。'] },
      { id: 'd3', text: '请问...你是？', targetBubbleId: 'b3', mood: 'confused', punctuation: ['？'] }
    ],
    correctAnswers: [
      { dialogueId: 'd1', bubbleId: 'b1', isVertical: false, fontSize: 26, letterSpacing: 3, lineBreak: [12] },
      { dialogueId: 'd2', bubbleId: 'b2', isVertical: false, fontSize: 26, letterSpacing: 3, lineBreak: [10] },
      { dialogueId: 'd3', bubbleId: 'b3', isVertical: false, fontSize: 24, letterSpacing: 2 }
    ],
    exampleNotes: [
      { dialogueId: 'd1', reason: '独白旁白要考虑阅读节奏，在语义停顿处断行', tips: '长句旁白在逗号、关联词处断行，保持呼吸感' },
      { dialogueId: 'd2', reason: '跨格旁白风格要统一，营造叙事感', tips: '跨格独白使用相同字号和字距，保证视觉连贯性' }
    ],
    unlockDays: 7
  }
];

export const getTodayExercise = (): Exercise => {
  const dayOfYear = Math.floor((Date.now() / 86400000) + 719163) % 365;
  const index = dayOfYear % exercises.filter(e => e.unlockDays <= 3).length;
  return exercises.filter(e => e.unlockDays <= 3)[index] || exercises[0];
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find(e => e.id === id);
};
