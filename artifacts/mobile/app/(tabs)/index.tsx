import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/contexts/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import Mascot from "@/components/Mascot";
import StatPill from "@/components/StatPill";
import { chapters, findNode } from "@/data/curriculum";
import { achievements } from "@/data/achievements";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MASCOT_MESSAGES = [
  "Сегодня отличный день для учёбы!",
  "Давай покорим новую тему вместе!",
  "Ты молодец, продолжай в том же духе!",
  "Один урок в день — и ОГЭ будет сдан!",
];

const TYPE_LABEL: Record<string, string> = {
  theory: "Теория",
  miniQuiz: "Мини-квиз",
  practice: "Практика",
  boss: "Босс",
};
const TYPE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  theory: "book-open",
  miniQuiz: "edit-3",
  practice: "cpu",
  boss: "zap",
};
const LEAGUE_NAMES = ["Бронза", "Серебро", "Золото", "Платина", "Алмаз"];
const LEAGUE_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];

// ── Секция-папка ─────────────────────────────────────────────────
function FolderSection({
  iconName,
  iconColor,
  title,
  badge,
  children,
  colors,
  defaultOpen = false,
}: {
  iconName: keyof typeof Feather.glyphMap;
  iconColor: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useAppColors>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await Haptics.selectionAsync();
    setOpen((v) => !v);
  };

  return (
    <View style={[folderStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={folderStyles.header}>
        <View style={[folderStyles.iconWrap, { backgroundColor: iconColor + "20" }]}>
          <Feather name={iconName} size={16} color={iconColor} />
        </View>
        <Text style={[folderStyles.title, { color: colors.foreground }]}>{title}</Text>
        {badge && (
          <View style={[folderStyles.badge, { backgroundColor: iconColor + "20" }]}>
            <Text style={[folderStyles.badgeText, { color: iconColor }]}>{badge}</Text>
          </View>
        )}
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {open && <View style={folderStyles.body}>{children}</View>}
    </View>
  );
}

const folderStyles = StyleSheet.create({
  wrap: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
});

// ── Главный экран ─────────────────────────────────────────────────
export default function HomeScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userStats, settings, weekStreak, nextLessonId } = useApp();

  const streak = weekStreak();
  const nextId = nextLessonId();
  const nextNode = nextId ? findNode(nextId) : null;
  const level = Math.floor(userStats.xp / 100) + 1;
  const xpToNext = level * 100 - userStats.xp;
  const xpProgress = (userStats.xp % 100) / 100;
  const dailyProgress = Math.min(userStats.dailyXp / 50, 1);
  const message = MASCOT_MESSAGES[userStats.solvedTasks % MASCOT_MESSAGES.length];
  const completedChapters = chapters.filter((ch) =>
    ch.nodes.every((n) => userStats.completedNodeIds.includes(n.id))
  ).length;
  const accuracy =
    userStats.totalAnswers > 0
      ? Math.round((userStats.correctAnswers / userStats.totalAnswers) * 100)
      : 0;

  const achievementStats = {
    xp: userStats.xp,
    streak: userStats.streak,
    solvedTasks: userStats.solvedTasks,
    correctAnswers: userStats.correctAnswers,
    totalAnswers: userStats.totalAnswers,
    completedNodeIds: userStats.completedNodeIds,
  };
  const unlockedCount = achievements.filter((a) => a.isUnlocked(achievementStats)).length;

  const handleStartLesson = async () => {
    if (!nextId) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/lesson/${nextId}`);
  };

  const pt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const pb = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Шапка */}
      <View style={[styles.header, { paddingTop: pt + 8 }]}>
        <StatPill iconName="zap" value={`${userStats.streak} дн`} color={colors.amber} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Главная</Text>
        <StatPill iconName="star" value={`${userStats.xp} XP`} color={colors.primary} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: pb + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Карточка маскота ── */}
        <View style={[styles.mascotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Mascot type={settings.mascot} size={96} animated />
          <View style={styles.mascotText}>
            <Text style={[styles.mascotGreeting, { color: colors.subForeground }]}>
              Привет, {userStats.name}! 👋
            </Text>
            <Text style={[styles.mascotMessage, { color: colors.foreground }]}>{message}</Text>
            <View style={styles.levelRow}>
              <Text style={[styles.levelLabel, { color: colors.primary }]}>Ур.{level}</Text>
              <View style={[styles.xpBar, { backgroundColor: colors.track }]}>
                <View style={[styles.xpFill, { backgroundColor: colors.primary, width: `${xpProgress * 100}%` }]} />
              </View>
              <Text style={[styles.xpHint, { color: colors.mutedForeground }]}>−{xpToNext}XP</Text>
            </View>
          </View>
        </View>

        {/* ── Следующий урок ── */}
        {nextNode ? (
          <TouchableOpacity onPress={handleStartLesson} activeOpacity={0.85} style={styles.nextCardWrap}>
            <LinearGradient
              colors={
                nextNode.type === "boss"
                  ? ["#be123c", "#9f1239"]
                  : nextNode.type === "practice"
                  ? ["#0e7490", "#155e75"]
                  : nextNode.type === "theory"
                  ? ["#4338ca", "#3730a3"]
                  : [colors.primary, colors.primary + "CC"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextCard}
            >
              <View style={styles.nextCardLeft}>
                <View style={styles.nextTypeRow}>
                  <View style={styles.nextTypeBadge}>
                    <Feather name={TYPE_ICON[nextNode.type] ?? "circle"} size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.nextTypeText}>{TYPE_LABEL[nextNode.type]}</Text>
                  </View>
                  <View style={styles.xpBadge}>
                    <Feather name="zap" size={11} color="#fde68a" />
                    <Text style={styles.xpBadgeText}>+{nextNode.xpReward} XP</Text>
                  </View>
                </View>
                <Text style={styles.nextTitle} numberOfLines={2}>
                  {nextNode.theoryTitle ?? nextNode.label}
                </Text>
                {nextNode.questions && (
                  <Text style={styles.nextSub}>{nextNode.questions.length} вопросов</Text>
                )}
              </View>
              <View style={styles.nextPlayButton}>
                <Feather name="play" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={[styles.courseCompleteCard, { backgroundColor: colors.green + "18", borderColor: colors.green + "35" }]}>
            <Feather name="award" size={28} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.courseCompleteTitle, { color: colors.foreground }]}>Курс пройден!</Text>
              <Text style={[styles.courseCompleteSub, { color: colors.subForeground }]}>
                Ты прошёл все уроки. Так держать 🎉
              </Text>
            </View>
          </View>
        )}

        {/* ── Дневная цель ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="target" size={16} color={colors.amber} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Дневная цель</Text>
            <Text style={[styles.sectionValue, { color: colors.amber }]}>{userStats.dailyXp} / 50 XP</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.track }]}>
            <LinearGradient
              colors={[colors.amber, colors.amber + "88"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${dailyProgress * 100}%` }]}
            />
          </View>
          {userStats.dailyXp >= 50 ? (
            <View style={styles.goalRow}>
              <Feather name="check-circle" size={14} color={colors.green} />
              <Text style={[styles.goalText, { color: colors.green }]}>Цель выполнена — отличная работа!</Text>
            </View>
          ) : (
            <Text style={[styles.goalHint, { color: colors.mutedForeground }]}>
              Ещё {50 - userStats.dailyXp} XP для выполнения цели
            </Text>
          )}
        </View>

        {/* ── Стрик недели ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="activity" size={16} color={colors.red} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Стрик недели</Text>
            <Text style={[styles.sectionValue, { color: colors.red }]}>{userStats.streak} дней 🔥</Text>
          </View>
          <View style={styles.weekRow}>
            {streak.map((active, i) => (
              <View key={i} style={styles.dayItem}>
                <View
                  style={[
                    styles.dayDot,
                    { backgroundColor: active ? colors.primary : colors.track, borderColor: active ? colors.primary : colors.border },
                  ]}
                >
                  {active && <Feather name="check" size={12} color="white" />}
                </View>
                <Text style={[styles.dayLabel, { color: active ? colors.foreground : colors.mutedForeground }]}>
                  {DAYS[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── ПАПКА: Статистика ── */}
        <FolderSection
          iconName="bar-chart-2"
          iconColor={colors.primary}
          title="Статистика"
          colors={colors}
        >
          <View style={styles.statsGrid}>
            <StatCard label="Глав пройдено" value={`${completedChapters}/${chapters.length}`} iconName="map" color={colors.green} colors={colors} />
            <StatCard label="Точность" value={userStats.totalAnswers > 0 ? `${accuracy}%` : "—"} iconName="target" color={colors.amber} colors={colors} />
            <StatCard label="Заданий" value={`${userStats.solvedTasks}`} iconName="check-circle" color={colors.primary} colors={colors} />
            <StatCard label="Лига" value={LEAGUE_NAMES[userStats.league - 1]} iconName="award" color={LEAGUE_COLORS[userStats.league - 1]} colors={colors} />
          </View>
        </FolderSection>

        {/* ── ПАПКА: Прогресс по разделам ── */}
        <FolderSection
          iconName="book-open"
          iconColor={colors.green}
          title="Прогресс по разделам"
          badge={`${completedChapters}/${chapters.length}`}
          colors={colors}
        >
          <View style={{ gap: 12 }}>
            {chapters.map((ch) => {
              const done = ch.nodes.filter((n) => userStats.completedNodeIds.includes(n.id)).length;
              const pct = done / ch.nodes.length;
              return (
                <View key={ch.id} style={styles.chapterRow}>
                  <View style={[styles.chapterDot, { backgroundColor: ch.color + "30" }]}>
                    <Feather name={ch.iconName as any} size={13} color={ch.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.chapterMeta}>
                      <Text style={[styles.chapterTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {ch.title}
                      </Text>
                      <Text style={[styles.chapterPct, { color: pct === 1 ? colors.green : colors.subForeground }]}>
                        {done}/{ch.nodes.length}
                      </Text>
                    </View>
                    <View style={[styles.chapterBar, { backgroundColor: colors.track }]}>
                      <View style={[styles.chapterFill, { backgroundColor: ch.color, width: `${pct * 100}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </FolderSection>

        {/* ── ПАПКА: Достижения ── */}
        <FolderSection
          iconName="award"
          iconColor={colors.amber}
          title="Достижения"
          badge={`${unlockedCount}/${achievements.length}`}
          colors={colors}
        >
          <View style={styles.achievementsGrid}>
            {achievements.map((a) => {
              const unlocked = a.isUnlocked(achievementStats);
              return (
                <View
                  key={a.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: unlocked ? a.iconColor + "14" : colors.card,
                      borderColor: unlocked ? a.iconColor + "35" : colors.border,
                      opacity: unlocked ? 1 : 0.42,
                    },
                  ]}
                >
                  <View style={[styles.achievementIcon, { backgroundColor: unlocked ? a.iconColor + "26" : colors.track }]}>
                    <Feather name={a.iconName as any} size={20} color={unlocked ? a.iconColor : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.achievementLabel, { color: unlocked ? colors.foreground : colors.subForeground }]} numberOfLines={2}>
                    {a.label}
                  </Text>
                  {unlocked && (
                    <View style={[styles.checkBadge, { backgroundColor: a.iconColor }]}>
                      <Feather name="check" size={9} color="white" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </FolderSection>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  iconName,
  color,
  colors,
}: {
  label: string;
  value: string;
  iconName: keyof typeof Feather.glyphMap;
  color: string;
  colors: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={iconName} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, gap: 14 },

  mascotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  mascotText: { flex: 1, gap: 4 },
  mascotGreeting: { fontSize: 12, fontFamily: "Inter_500Medium" },
  mascotMessage: { fontSize: 14, fontWeight: "600", lineHeight: 20, fontFamily: "Inter_600SemiBold" },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  levelLabel: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  xpBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  xpHint: { fontSize: 11 },

  nextCardWrap: { borderRadius: 20, overflow: "hidden" },
  nextCard: { flexDirection: "row", alignItems: "center", padding: 18, gap: 14 },
  nextCardLeft: { flex: 1, gap: 6 },
  nextTypeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nextTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nextTypeText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "600" },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpBadgeText: { color: "#fde68a", fontSize: 11, fontWeight: "700" },
  nextTitle: { color: "white", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 22 },
  nextSub: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  nextPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  courseCompleteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  courseCompleteTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  courseCompleteSub: { fontSize: 13, marginTop: 2 },

  section: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sectionValue: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  goalText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  goalHint: { fontSize: 12 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayItem: { alignItems: "center", gap: 6 },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { fontSize: 11, fontWeight: "500" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12 },

  chapterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  chapterDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  chapterTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  chapterPct: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  chapterBar: { height: 5, borderRadius: 3, overflow: "hidden" },
  chapterFill: { height: "100%", borderRadius: 3 },

  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievementCard: {
    width: "30%",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  achievementIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
