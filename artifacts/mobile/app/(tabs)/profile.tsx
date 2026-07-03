import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useApp } from "@/contexts/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import Mascot from "@/components/Mascot";
import { achievements } from "@/data/achievements";

const LEAGUE_NAMES = ["Бронза", "Серебро", "Золото", "Платина", "Алмаз"];
const LEAGUE_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E2E0DF", "#B9F2FF"];
const LEAGUE_ICONS: Array<keyof typeof Feather.glyphMap> = [
  "award", "award", "award", "star", "zap",
];

const RING_SIZE = 188;
const RING_SW = 14;
const RING_R = (RING_SIZE - RING_SW * 2) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

export default function ProfileScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { userStats, settings } = useApp();

  const level = Math.floor(userStats.xp / 100) + 1;
  const xpInLevel = userStats.xp % 100;
  const xpProgress = xpInLevel / 100;
  const accuracy =
    userStats.totalAnswers > 0
      ? Math.round((userStats.correctAnswers / userStats.totalAnswers) * 100)
      : 0;

  const unlockedCount = achievements.filter((a) =>
    a.isUnlocked({
      xp: userStats.xp,
      streak: userStats.streak,
      solvedTasks: userStats.solvedTasks,
      correctAnswers: userStats.correctAnswers,
      totalAnswers: userStats.totalAnswers,
      completedNodeIds: userStats.completedNodeIds,
    })
  ).length;

  const pt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const pb = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const leagueColor = LEAGUE_COLORS[userStats.league - 1];
  const leagueName = LEAGUE_NAMES[userStats.league - 1];
  const leagueIcon = LEAGUE_ICONS[userStats.league - 1];

  const dashLen = RING_CIRC * xpProgress;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: pt + 8, paddingBottom: pb + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero: XP ring + mascot ── */}
        <View style={styles.heroSection}>
          <View style={styles.ringWrap}>
            {/* SVG ring */}
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={colors.track}
                strokeWidth={RING_SW}
                fill="none"
              />
              {/* Progress */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={colors.primary}
                strokeWidth={RING_SW}
                strokeDasharray={`${dashLen} ${RING_CIRC}`}
                fill="none"
                strokeLinecap="round"
                transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
              />
            </Svg>
            {/* Mascot centered inside ring */}
            <View style={styles.mascotOverlay} pointerEvents="none">
              <Mascot type={settings.mascot} size={112} animated />
            </View>
            {/* Level badge at bottom-right of ring */}
            <View
              style={[styles.levelBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.levelBadgeText}>Ур. {level}</Text>
            </View>
          </View>

          {/* Name & sub */}
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {userStats.name}
          </Text>
          <Text style={[styles.userSub, { color: colors.subForeground }]}>
            9 класс · ОГЭ 2025
          </Text>
          <Text style={[styles.xpHint, { color: colors.mutedForeground }]}>
            {xpInLevel} / 100 XP — до ур. {level + 1} ещё {100 - xpInLevel} XP
          </Text>

        </View>

        {/* ── League card ── */}
        <View
          style={[
            styles.leagueCard,
            {
              backgroundColor: leagueColor + "16",
              borderColor: leagueColor + "40",
            },
          ]}
        >
          <View
            style={[styles.leagueIconWrap, { backgroundColor: leagueColor + "28" }]}
          >
            <Feather name={leagueIcon} size={24} color={leagueColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.leagueTitle, { color: colors.foreground }]}>
              {leagueName} лига
            </Text>
            <Text style={[styles.leagueSub, { color: colors.subForeground }]}>
              {userStats.xp} XP собрано
            </Text>
          </View>
          {/* League step indicators */}
          <View style={styles.leagueSteps}>
            {[1, 2, 3, 4, 5].map((l) => (
              <View
                key={l}
                style={[
                  styles.leagueStep,
                  {
                    backgroundColor:
                      l <= userStats.league ? leagueColor : colors.track,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Stats 2×2 ── */}
        <View style={styles.statsGrid}>
          {[
            {
              label: "Стрик",
              value: `${userStats.streak}`,
              sub: "дней подряд",
              icon: "activity" as const,
              color: colors.red,
            },
            {
              label: "XP",
              value: `${userStats.xp}`,
              sub: "очков опыта",
              icon: "zap" as const,
              color: colors.primary,
            },
            {
              label: "Заданий",
              value: `${userStats.solvedTasks}`,
              sub: "решено",
              icon: "check-circle" as const,
              color: colors.green,
            },
            {
              label: "Точность",
              value: `${accuracy}%`,
              sub: "правильных",
              icon: "target" as const,
              color: colors.amber,
            },
          ].map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
                <Feather name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {s.value}
              </Text>
              <Text style={[styles.statSub, { color: colors.subForeground }]}>
                {s.sub}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Achievements ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Feather name="award" size={16} color={colors.amber} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Достижения
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.amber + "20" },
              ]}
            >
              <Text style={[styles.countText, { color: colors.amber }]}>
                {unlockedCount} / {achievements.length}
              </Text>
            </View>
          </View>

          <View style={styles.achievementsGrid}>
            {achievements.map((a) => {
              const unlocked = a.isUnlocked({
                xp: userStats.xp,
                streak: userStats.streak,
                solvedTasks: userStats.solvedTasks,
                correctAnswers: userStats.correctAnswers,
                totalAnswers: userStats.totalAnswers,
                completedNodeIds: userStats.completedNodeIds,
              });
              return (
                <View
                  key={a.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: unlocked
                        ? a.iconColor + "14"
                        : colors.card,
                      borderColor: unlocked
                        ? a.iconColor + "35"
                        : colors.border,
                      opacity: unlocked ? 1 : 0.42,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      {
                        backgroundColor: unlocked
                          ? a.iconColor + "26"
                          : colors.track,
                      },
                    ]}
                  >
                    <Feather
                      name={a.iconName as any}
                      size={20}
                      color={unlocked ? a.iconColor : colors.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[
                      styles.achievementLabel,
                      {
                        color: unlocked
                          ? colors.foreground
                          : colors.subForeground,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {a.label}
                  </Text>
                  {unlocked && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: a.iconColor },
                      ]}
                    >
                      <Feather name="check" size={9} color="white" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },

  heroSection: { alignItems: "center", gap: 8, paddingTop: 4 },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  mascotOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  userSub: { fontSize: 13 },
  xpHint: { fontSize: 12, marginTop: 2 },

  leagueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  leagueIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  leagueTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueSub: { fontSize: 12, marginTop: 2 },
  leagueSteps: { flexDirection: "row", gap: 4 },
  leagueStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold" },
  statSub: { fontSize: 12 },

  sectionWrap: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: { fontSize: 12, fontWeight: "600" },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
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
