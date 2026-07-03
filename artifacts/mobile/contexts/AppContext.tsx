import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chapters } from "@/data/curriculum";

export type MascotType = "penguin" | "raccoon" | "bear";
export type ThemeId = "space" | "noir" | "nordic" | "dawn";
export type FontSize = "small" | "medium" | "large";

export interface AppSettings {
  theme: ThemeId;
  fontSize: FontSize;
  mascot: MascotType;
  avatarColor: string;
}

export interface UserStats {
  name: string;
  onboardingDone: boolean;
  isLoaded: boolean;
  xp: number;
  streak: number;
  completedNodeIds: string[];
  unlockedAchievementIds: string[];
  dailyXp: number;
  dailyXpDate: string;
  league: number;
  streakFreezes: number;
  weeklyDates: string[];
  solvedTasks: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface LessonResult {
  correct: number;
  total: number;
  xpEarned: number;
  passed: boolean;
  alreadyDone: boolean;
  /** true if this was the first successful lesson today (show streak animation) */
  isStreakDay: boolean;
}

interface AppContextValue {
  userStats: UserStats;
  settings: AppSettings;
  completeOnboarding: (name: string, mascot: MascotType) => Promise<void>;
  completeNode: (
    nodeId: string,
    correct: number,
    total: number
  ) => Promise<LessonResult>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  nodeStatus: (nodeId: string) => "locked" | "active" | "done";
  weekStreak: () => boolean[];
  nextLessonId: () => string | null;
  resetProgress: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "oge_app_v2";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "space",
  fontSize: "medium",
  mascot: "penguin",
  avatarColor: "#6366F1",
};

const DEFAULT_STATS: UserStats = {
  name: "Ученик",
  onboardingDone: false,
  isLoaded: false,
  xp: 0,
  streak: 0,
  completedNodeIds: [],
  unlockedAchievementIds: [],
  dailyXp: 0,
  dailyXpDate: "",
  league: 1,
  streakFreezes: 1,
  weeklyDates: [],
  solvedTasks: 0,
  correctAnswers: 0,
  totalAnswers: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.stats) {
          setUserStats({ ...DEFAULT_STATS, ...saved.stats, isLoaded: true });
        } else {
          setUserStats((s) => ({ ...s, isLoaded: true }));
        }
        if (saved.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        }
      } else {
        setUserStats((s) => ({ ...s, isLoaded: true }));
      }
    } catch {
      setUserStats((s) => ({ ...s, isLoaded: true }));
    }
  }

  async function saveData(stats: UserStats, sett: AppSettings) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ stats, settings: sett })
      );
    } catch {}
  }

  async function completeOnboarding(
    name: string,
    mascot: MascotType
  ): Promise<void> {
    const newStats = { ...userStats, name: name.trim(), onboardingDone: true };
    const newSettings = { ...settings, mascot };
    setUserStats(newStats);
    setSettings(newSettings);
    await saveData(newStats, newSettings);
  }

  const nodeStatus = useCallback(
    (nodeId: string): "locked" | "active" | "done" => {
      if (userStats.completedNodeIds.includes(nodeId)) return "done";

      let chapterIdx = -1;
      let nodeIdx = -1;
      for (let ci = 0; ci < chapters.length; ci++) {
        const ni = chapters[ci].nodes.findIndex((n) => n.id === nodeId);
        if (ni !== -1) {
          chapterIdx = ci;
          nodeIdx = ni;
          break;
        }
      }
      if (chapterIdx === -1) return "locked";
      if (chapterIdx === 0 && nodeIdx === 0) return "active";

      let prevNodeId: string | null = null;
      if (nodeIdx > 0) {
        prevNodeId = chapters[chapterIdx].nodes[nodeIdx - 1].id;
      } else if (chapterIdx > 0) {
        const prevChapter = chapters[chapterIdx - 1];
        prevNodeId = prevChapter.nodes[prevChapter.nodes.length - 1].id;
      }

      if (prevNodeId && userStats.completedNodeIds.includes(prevNodeId))
        return "active";
      return "locked";
    },
    [userStats.completedNodeIds]
  );

  async function completeNode(
    nodeId: string,
    correct: number,
    total: number
  ): Promise<LessonResult> {
    const status = nodeStatus(nodeId);
    if (status === "done") {
      return {
        correct,
        total,
        xpEarned: 0,
        passed: true,
        alreadyDone: true,
        isStreakDay: false,
      };
    }

    let xpReward = 20;
    for (const ch of chapters) {
      const node = ch.nodes.find((n) => n.id === nodeId);
      if (node) {
        xpReward = node.xpReward;
        break;
      }
    }

    // 80% pass threshold (strict — ensures the topic is truly understood)
    const passed = total === 0 || correct / total >= 0.8;
    const xpEarned = passed ? xpReward : Math.floor(xpReward * 0.15);

    const today = new Date().toISOString().split("T")[0];
    const hadToday = userStats.weeklyDates.includes(today);

    const dailyXp =
      userStats.dailyXpDate === today
        ? userStats.dailyXp + xpEarned
        : xpEarned;
    const weeklyDates = hadToday
      ? userStats.weeklyDates
      : [...userStats.weeklyDates, today];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    const hadYesterday = userStats.weeklyDates.includes(yStr);
    let newStreak = userStats.streak;
    if (!hadToday) {
      newStreak = hadYesterday ? userStats.streak + 1 : 1;
    }

    const newXp = userStats.xp + xpEarned;
    let newLeague = userStats.league;
    if (newXp >= 2000) newLeague = 5;
    else if (newXp >= 1200) newLeague = 4;
    else if (newXp >= 700) newLeague = 3;
    else if (newXp >= 300) newLeague = 2;

    const newCompletedIds = passed
      ? [...userStats.completedNodeIds, nodeId]
      : userStats.completedNodeIds;

    const newStats: UserStats = {
      ...userStats,
      xp: newXp,
      streak: newStreak,
      completedNodeIds: newCompletedIds,
      dailyXp,
      dailyXpDate: today,
      weeklyDates,
      solvedTasks: userStats.solvedTasks + 1,
      correctAnswers: userStats.correctAnswers + correct,
      totalAnswers: userStats.totalAnswers + total,
      league: newLeague,
    };

    setUserStats(newStats);
    await saveData(newStats, settings);

    // isStreakDay = first successful lesson of today
    const isStreakDay = passed && !hadToday;

    return { correct, total, xpEarned, passed, alreadyDone: false, isStreakDay };
  }

  async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings);
    await saveData(userStats, newSettings);
  }

  function weekStreak(): boolean[] {
    const result: boolean[] = [];
    const today = new Date();
    // Найдём понедельник текущей недели
    const dayOfWeek = today.getDay(); // 0=Вс, 1=Пн, ..., 6=Сб
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      result.push(userStats.weeklyDates.includes(d.toISOString().split("T")[0]));
    }
    return result;
  }

  function nextLessonId(): string | null {
    for (const ch of chapters) {
      for (const node of ch.nodes) {
        if (nodeStatus(node.id) === "active") return node.id;
      }
    }
    return null;
  }

  async function resetProgress(): Promise<void> {
    const newStats = { ...DEFAULT_STATS, isLoaded: true };
    setUserStats(newStats);
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AppContext.Provider
      value={{
        userStats,
        settings,
        completeOnboarding,
        completeNode,
        updateSettings,
        nodeStatus,
        weekStreak,
        nextLessonId,
        resetProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
