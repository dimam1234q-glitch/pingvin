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
export type ThemeId = "space" | "noir" | "nordic" | "dawn" | "arena";
export type FontSize = "small" | "medium" | "large";

export interface AppSettings {
  theme: ThemeId;
  fontSize: FontSize;
  mascot: MascotType;
  avatarColor: string;
}

export interface UserStats {
  userId: string;
  username: string;
  name: string;
  group: string | null;
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
  pushToken: string | null;
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

export const FONT_SCALE_MAP: Record<FontSize, number> = {
  small: 0.88,
  medium: 1,
  large: 1.18,
};

interface AppContextValue {
  userStats: UserStats;
  settings: AppSettings;
  fontScale: number;
  completeOnboarding: (name: string, username: string, mascot: MascotType, group: string) => Promise<void>;
  completeNode: (nodeId: string, correct: number, total: number) => Promise<LessonResult>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
  nodeStatus: (nodeId: string) => "locked" | "active" | "done";
  weekStreak: () => boolean[];
  nextLessonId: () => string | null;
  resetProgress: () => Promise<void>;
  syncToServer: (overrideXp?: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "oge_app_v3";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "arena",
  fontSize: "medium",
  mascot: "penguin",
  avatarColor: "#6366F1",
};

const DEFAULT_STATS: UserStats = {
  userId: "",
  username: "",
  name: "Ученик",
  group: null,
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
  pushToken: null,
};

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateUsername(mascot: MascotType): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${mascot}_${suffix}`;
}

export function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/api` : "/api";
}

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
          const userId = saved.stats.userId || generateUUID();
          const username =
            saved.stats.username || generateUsername(saved.settings?.mascot ?? "penguin");
          setUserStats({
            ...DEFAULT_STATS,
            ...saved.stats,
            userId,
            username,
            isLoaded: true,
          });
        } else {
          setUserStats((s) => ({ ...s, isLoaded: true }));
        }
        if (saved.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        }
      } else {
        // Migrate from old storage key if present
        const oldRaw = await AsyncStorage.getItem("oge_app_v2");
        if (oldRaw) {
          const old = JSON.parse(oldRaw);
          const userId = generateUUID();
          const mascot = old.settings?.mascot ?? "penguin";
          const username = generateUsername(mascot);
          const stats = {
            ...DEFAULT_STATS,
            ...(old.stats ?? {}),
            userId,
            username,
            isLoaded: true,
          };
          const sett = { ...DEFAULT_SETTINGS, ...(old.settings ?? {}) };
          setUserStats(stats);
          setSettings(sett);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ stats, settings: sett }));
        } else {
          setUserStats((s) => ({ ...s, isLoaded: true }));
        }
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

  async function syncToServer(overrideXp?: number) {
    try {
      const stats = userStats;
      if (!stats.userId || !stats.username) return;
      const base = getApiBase();
      await fetch(`${base}/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stats.userId,
          username: stats.username,
          name: stats.name,
          group: stats.group,
          xp: overrideXp ?? stats.xp,
          streak: stats.streak,
          league: stats.league,
          pushToken: stats.pushToken ?? null,
        }),
      });
    } catch {
      // Sync failure is non-fatal — app works offline
    }
  }

  async function completeOnboarding(
    name: string,
    username: string,
    mascot: MascotType,
    group: string
  ): Promise<void> {
    const userId = userStats.userId || generateUUID();
    const finalUsername =
      username.trim().toLowerCase() || generateUsername(mascot);
    const finalGroup = group.trim();
    const newStats: UserStats = {
      ...userStats,
      userId,
      username: finalUsername,
      name: name.trim(),
      group: finalGroup,
      onboardingDone: true,
    };
    const newSettings = { ...settings, mascot };
    setUserStats(newStats);
    setSettings(newSettings);
    await saveData(newStats, newSettings);
    // Sync to server — retry once with a new suffix if username is taken
    try {
      const base = getApiBase();
      const body = { id: userId, username: finalUsername, name: name.trim(), group: finalGroup, xp: 0, streak: 0, league: 1, pushToken: null };
      let res = await fetch(`${base}/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        const retryUsername = finalUsername.replace(/_\d+$/, "") + "_" + Math.floor(1000 + Math.random() * 9000);
        const updatedStats = { ...newStats, username: retryUsername };
        setUserStats(updatedStats);
        await saveData(updatedStats, newSettings);
        await fetch(`${base}/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, username: retryUsername }),
        });
      }
    } catch {}
  }

  async function updatePushToken(token: string): Promise<void> {
    const newStats = { ...userStats, pushToken: token };
    setUserStats(newStats);
    await saveData(newStats, settings);
    // Immediately upload push token to server so friend notifications reach this device
    if (newStats.userId && newStats.username) {
      try {
        const base = getApiBase();
        await fetch(`${base}/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newStats.userId,
            username: newStats.username,
            name: newStats.name,
            group: newStats.group,
            xp: newStats.xp,
            streak: newStats.streak,
            league: newStats.league,
            pushToken: token,
          }),
        });
      } catch {}
    }
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
      return { correct, total, xpEarned: 0, passed: true, alreadyDone: true, isStreakDay: false };
    }

    let xpReward = 20;
    for (const ch of chapters) {
      const node = ch.nodes.find((n) => n.id === nodeId);
      if (node) { xpReward = node.xpReward; break; }
    }

    const passed = total === 0 || correct / total >= 0.8;
    const xpEarned = passed ? xpReward : Math.floor(xpReward * 0.15);

    const today = new Date().toISOString().split("T")[0];
    const hadToday = userStats.weeklyDates.includes(today);

    const dailyXp =
      userStats.dailyXpDate === today ? userStats.dailyXp + xpEarned : xpEarned;
    const weeklyDates = hadToday ? userStats.weeklyDates : [...userStats.weeklyDates, today];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    const hadYesterday = userStats.weeklyDates.includes(yStr);
    let newStreak = userStats.streak;
    if (!hadToday) {
      newStreak = hadYesterday ? userStats.streak + 1 : 1;
    }

    const oldXp = userStats.xp;
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

    // Sync XP to server (non-blocking)
    if (xpEarned > 0) {
      (async () => {
        try {
          const base = getApiBase();
          await fetch(`${base}/users/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: newStats.userId,
              username: newStats.username,
              name: newStats.name,
              group: newStats.group,
              xp: newXp,
              streak: newStreak,
              league: newLeague,
              pushToken: newStats.pushToken ?? null,
            }),
          });
        } catch {}
      })();
    }

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
    const dayOfWeek = today.getDay();
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
    const newStats = {
      ...DEFAULT_STATS,
      userId: userStats.userId,
      username: userStats.username,
      isLoaded: true,
    };
    setUserStats(newStats);
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AppContext.Provider
      value={{
        userStats,
        settings,
        fontScale: FONT_SCALE_MAP[settings.fontSize],
        completeOnboarding,
        completeNode,
        updateSettings,
        updatePushToken,
        nodeStatus,
        weekStreak,
        nextLessonId,
        resetProgress,
        syncToServer,
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
