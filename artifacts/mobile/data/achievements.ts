export type Rarity = "common" | "medium" | "epic" | "legendary" | "secret";

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; order: number }> = {
  common:    { label: "Обычные",     color: "#10B981", order: 0 },
  medium:    { label: "Средние",     color: "#3B82F6", order: 1 },
  epic:      { label: "Эпические",   color: "#8B5CF6", order: 2 },
  legendary: { label: "Легендарные", color: "#F59E0B", order: 3 },
  secret:    { label: "Секретные",   color: "#EC4899", order: 4 },
};

export interface AchievementStats {
  xp: number;
  streak: number;
  solvedTasks: number;
  correctAnswers: number;
  totalAnswers: number;
  completedNodeIds: string[];
  now?: Date;
}

export interface Achievement {
  id: string;
  rarity: Rarity;
  iconName: string;
  iconColor: string;
  label: string;
  description: string;
  isUnlocked: (stats: AchievementStats) => boolean;
}

// All node IDs in the Numbers chapter — used for chapter completion check
export const NUMBERS_CHAPTER_NODES = [
  "numbers_t1", "numbers_t2", "numbers_q1", "numbers_t3", "numbers_p1",
  "numbers_t4", "numbers_q2", "numbers_t5", "numbers_q3", "numbers_p2",
  "numbers_t6", "numbers_q4", "numbers_p3", "numbers_boss",
] as const;

export const achievements: Achievement[] = [

  // ══════════════════════════════════════════════
  // ОБЫЧНЫЕ — выполняются за первые несколько минут / дней
  // ══════════════════════════════════════════════

  {
    id: "first_lesson",
    rarity: "common",
    iconName: "star",
    iconColor: "#10B981",
    label: "Первый шаг",
    description: "Пройди любой урок. Путь в тысячу миль начинается с одного шага.",
    isUnlocked: ({ completedNodeIds }) => completedNodeIds.length >= 1,
  },
  {
    id: "first_correct",
    rarity: "common",
    iconName: "check",
    iconColor: "#34D399",
    label: "Дебютант",
    description: "Дай первый правильный ответ.",
    isUnlocked: ({ correctAnswers }) => correctAnswers >= 1,
  },
  {
    id: "tasks_10",
    rarity: "common",
    iconName: "check-circle",
    iconColor: "#6EE7B7",
    label: "10 заданий",
    description: "Реши 10 заданий. Хорошее начало!",
    isUnlocked: ({ solvedTasks }) => solvedTasks >= 10,
  },
  {
    id: "xp_100",
    rarity: "common",
    iconName: "zap",
    iconColor: "#10B981",
    label: "Первая сотня",
    description: "Набери 100 XP. Ты уже в игре.",
    isUnlocked: ({ xp }) => xp >= 100,
  },
  {
    id: "streak_3",
    rarity: "common",
    iconName: "activity",
    iconColor: "#059669",
    label: "Трёхдневка",
    description: "Занимайся 3 дня подряд без пропусков.",
    isUnlocked: ({ streak }) => streak >= 3,
  },

  // ══════════════════════════════════════════════
  // СРЕДНИЕ — надо немного постараться
  // ══════════════════════════════════════════════

  {
    id: "nodes_5",
    rarity: "medium",
    iconName: "layers",
    iconColor: "#3B82F6",
    label: "Пятёрка",
    description: "Пройди 5 уроков. Ты уже освоился в материале.",
    isUnlocked: ({ completedNodeIds }) => completedNodeIds.length >= 5,
  },
  {
    id: "streak_7",
    rarity: "medium",
    iconName: "activity",
    iconColor: "#2563EB",
    label: "Неделя силы",
    description: "Занимайся 7 дней подряд — целую неделю!",
    isUnlocked: ({ streak }) => streak >= 7,
  },
  {
    id: "xp_500",
    rarity: "medium",
    iconName: "zap",
    iconColor: "#3B82F6",
    label: "Опытный ученик",
    description: "Набери 500 XP. Ты уже серьёзно продвинулся.",
    isUnlocked: ({ xp }) => xp >= 500,
  },
  {
    id: "accuracy_90",
    rarity: "medium",
    iconName: "target",
    iconColor: "#60A5FA",
    label: "Снайпер",
    description: "Отвечай точнее 90% при минимум 10 ответах. Метко!",
    isUnlocked: ({ correctAnswers, totalAnswers }) =>
      totalAnswers >= 10 && correctAnswers / totalAnswers >= 0.9,
  },
  {
    id: "tasks_50",
    rarity: "medium",
    iconName: "check-circle",
    iconColor: "#1D4ED8",
    label: "Решатель",
    description: "Реши 50 заданий. Уже виден прогресс!",
    isUnlocked: ({ solvedTasks }) => solvedTasks >= 50,
  },

  // ══════════════════════════════════════════════
  // ЭПИЧЕСКИЕ — от недели до месяца серьёзной работы
  // ══════════════════════════════════════════════

  {
    id: "chapter_1",
    rarity: "epic",
    iconName: "book",
    iconColor: "#8B5CF6",
    label: "Числовой мастер",
    description: "Пройди главу «Числа и вычисления» целиком, включая босс-битву.",
    isUnlocked: ({ completedNodeIds }) =>
      NUMBERS_CHAPTER_NODES.every((id) => completedNodeIds.includes(id)),
  },
  {
    id: "xp_1000",
    rarity: "epic",
    iconName: "award",
    iconColor: "#7C3AED",
    label: "Тысячник",
    description: "Набери 1000 XP. Это уже серьёзные результаты.",
    isUnlocked: ({ xp }) => xp >= 1000,
  },
  {
    id: "streak_14",
    rarity: "epic",
    iconName: "trending-up",
    iconColor: "#6D28D9",
    label: "Две недели",
    description: "14 дней подряд — половина месяца без единого пропуска.",
    isUnlocked: ({ streak }) => streak >= 14,
  },
  {
    id: "tasks_100",
    rarity: "epic",
    iconName: "check-circle",
    iconColor: "#8B5CF6",
    label: "Сотник",
    description: "Реши 100 заданий. Три цифры — это уже эпически.",
    isUnlocked: ({ solvedTasks }) => solvedTasks >= 100,
  },
  {
    id: "accuracy_95",
    rarity: "epic",
    iconName: "crosshair",
    iconColor: "#A78BFA",
    label: "Хирург",
    description: "Точность выше 95% при минимум 30 ответах. Почти не ошибаешься.",
    isUnlocked: ({ correctAnswers, totalAnswers }) =>
      totalAnswers >= 30 && correctAnswers / totalAnswers >= 0.95,
  },

  // ══════════════════════════════════════════════
  // ЛЕГЕНДАРНЫЕ — практически финал, долгий путь
  // ══════════════════════════════════════════════

  {
    id: "xp_2000",
    rarity: "legendary",
    iconName: "cpu",
    iconColor: "#F59E0B",
    label: "Алмазный мозг",
    description: "2000 XP — достиг Алмазной лиги. Ты на вершине.",
    isUnlocked: ({ xp }) => xp >= 2000,
  },
  {
    id: "streak_30",
    rarity: "legendary",
    iconName: "activity",
    iconColor: "#D97706",
    label: "Месяц упорства",
    description: "30 дней подряд без пропусков. Железная воля.",
    isUnlocked: ({ streak }) => streak >= 30,
  },
  {
    id: "tasks_200",
    rarity: "legendary",
    iconName: "layers",
    iconColor: "#F59E0B",
    label: "Двухсотник",
    description: "200 решённых заданий. Ты прошёл огромный путь.",
    isUnlocked: ({ solvedTasks }) => solvedTasks >= 200,
  },
  {
    id: "accuracy_95_hard",
    rarity: "legendary",
    iconName: "target",
    iconColor: "#B45309",
    label: "Нейрохирург",
    description: "Точность 95%+ при 100 и более ответах. Ты почти не ошибаешься никогда.",
    isUnlocked: ({ correctAnswers, totalAnswers }) =>
      totalAnswers >= 100 && correctAnswers / totalAnswers >= 0.95,
  },

  // ══════════════════════════════════════════════
  // СЕКРЕТНЫЕ — особые условия, скрытые до получения
  // ══════════════════════════════════════════════

  {
    id: "secret_night",
    rarity: "secret",
    iconName: "moon",
    iconColor: "#EC4899",
    label: "Ночной математик",
    description: "Открой приложение глубокой ночью — с полуночи до 4 утра. Кто не спит, тот учится.",
    isUnlocked: ({ now }) => {
      const h = (now ?? new Date()).getHours();
      return h >= 0 && h < 4;
    },
  },
  {
    id: "secret_early",
    rarity: "secret",
    iconName: "sunrise",
    iconColor: "#F472B6",
    label: "Ранняя пташка",
    description: "Открой приложение с 4 до 6 утра. Пока все спят — ты уже готовишься к ОГЭ.",
    isUnlocked: ({ now }) => {
      const h = (now ?? new Date()).getHours();
      return h >= 4 && h < 6;
    },
  },
  {
    id: "secret_knowledge_day",
    rarity: "secret",
    iconName: "book-open",
    iconColor: "#DB2777",
    label: "День знаний",
    description: "Открой приложение 1 сентября — в День знаний. Лучший способ начать учебный год!",
    isUnlocked: ({ now }) => {
      const d = now ?? new Date();
      return d.getMonth() === 8 && d.getDate() === 1;
    },
  },
  {
    id: "secret_pi_day",
    rarity: "secret",
    iconName: "circle",
    iconColor: "#BE185D",
    label: "День Пи",
    description: "Открой приложение 14 марта — в международный День числа Пи (3.14). Математики поймут.",
    isUnlocked: ({ now }) => {
      const d = now ?? new Date();
      return d.getMonth() === 2 && d.getDate() === 14;
    },
  },
  {
    id: "secret_friday13",
    rarity: "secret",
    iconName: "alert-triangle",
    iconColor: "#9D174D",
    label: "Пятница, 13-е",
    description: "Открой приложение в пятницу 13-го числа. Суеверия — не для отличников ОГЭ.",
    isUnlocked: ({ now }) => {
      const d = now ?? new Date();
      return d.getDay() === 5 && d.getDate() === 13;
    },
  },
];
