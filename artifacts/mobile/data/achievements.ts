export interface Achievement {
  id: string;
  iconName: string;
  iconColor: string;
  label: string;
  description: string;
  isUnlocked: (stats: {
    xp: number;
    streak: number;
    solvedTasks: number;
    correctAnswers: number;
    totalAnswers: number;
    completedNodeIds: string[];
  }) => boolean;
}

export const achievements: Achievement[] = [
  {
    id: "first_lesson",
    iconName: "star",
    iconColor: "#F59E0B",
    label: "Первый шаг",
    description: "Пройти первый урок",
    isUnlocked: ({ completedNodeIds }) => completedNodeIds.length >= 1,
  },
  {
    id: "streak_3",
    iconName: "flame",
    iconColor: "#EF4444",
    label: "3 дня подряд",
    description: "Заниматься 3 дня без перерыва",
    isUnlocked: ({ streak }) => streak >= 3,
  },
  {
    id: "streak_7",
    iconName: "flame",
    iconColor: "#DC2626",
    label: "Неделя силы",
    description: "Заниматься 7 дней подряд",
    isUnlocked: ({ streak }) => streak >= 7,
  },
  {
    id: "xp_100",
    iconName: "zap",
    iconColor: "#6366F1",
    label: "100 XP",
    description: "Набрать 100 опыта",
    isUnlocked: ({ xp }) => xp >= 100,
  },
  {
    id: "xp_500",
    iconName: "zap",
    iconColor: "#4F46E5",
    label: "500 XP",
    description: "Набрать 500 опыта",
    isUnlocked: ({ xp }) => xp >= 500,
  },
  {
    id: "xp_1000",
    iconName: "award",
    iconColor: "#F59E0B",
    label: "1000 XP",
    description: "Набрать 1000 опыта",
    isUnlocked: ({ xp }) => xp >= 1000,
  },
  {
    id: "accuracy_90",
    iconName: "target",
    iconColor: "#10B981",
    label: "Снайпер",
    description: "Точность более 90%",
    isUnlocked: ({ correctAnswers, totalAnswers }) =>
      totalAnswers >= 10 && correctAnswers / totalAnswers >= 0.9,
  },
  {
    id: "tasks_10",
    iconName: "check-circle",
    iconColor: "#3B82F6",
    label: "10 заданий",
    description: "Решить 10 заданий",
    isUnlocked: ({ solvedTasks }) => solvedTasks >= 10,
  },
  {
    id: "tasks_50",
    iconName: "check-circle",
    iconColor: "#2563EB",
    label: "50 заданий",
    description: "Решить 50 заданий",
    isUnlocked: ({ solvedTasks }) => solvedTasks >= 50,
  },
  {
    id: "chapter_1",
    iconName: "book",
    iconColor: "#6366F1",
    label: "Числовой мастер",
    description: "Пройти главу «Числа»",
    isUnlocked: ({ completedNodeIds }) =>
      [
        "numbers_t1",
        "numbers_t2",
        "numbers_q1",
        "numbers_t3",
        "numbers_p1",
        "numbers_t4",
        "numbers_q2",
        "numbers_t5",
        "numbers_q3",
        "numbers_p2",
        "numbers_t6",
        "numbers_q4",
        "numbers_p3",
        "numbers_boss",
      ].every((id) => completedNodeIds.includes(id)),
  },
];
