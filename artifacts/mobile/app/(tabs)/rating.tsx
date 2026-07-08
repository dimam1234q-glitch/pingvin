import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, getApiBase } from "@/contexts/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import Mascot from "@/components/Mascot";

const LEAGUE_NAMES = ["Бронза", "Серебро", "Золото", "Платина", "Алмаз"];
const LEAGUE_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];
const RANK_BG = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_TEXT = ["#1a1a1a", "#1a1a1a", "#ffffff"];

type RatingTab = "group" | "stream";

interface RatingUser {
  id: string;
  username: string;
  name: string;
  group: string | null;
  xp: number;
  streak: number;
  league: number;
}

// ── Avatar chip ────────────────────────────────────────────────────────────────
function Avatar({
  name,
  size = 44,
  color,
  isMascot,
  rank,
}: {
  name: string;
  size?: number;
  color: string;
  isMascot?: boolean;
  rank?: number;
}) {
  const rankBg = rank && rank <= 3 ? RANK_BG[rank - 1] : null;
  const rankText = rank && rank <= 3 ? RANK_TEXT[rank - 1] : null;

  return (
    <View
      style={[
        avatarStyles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: rankBg ? rankBg : color + "22",
          borderColor: rankBg ? rankBg + "99" : color + "55",
        },
      ]}
    >
      {isMascot ? (
        <Mascot type="penguin" size={size * 0.9} mode="idle" />
      ) : rank ? (
        <Text style={[avatarStyles.rankText, { fontSize: size * 0.4, color: rankText || color }]}>
          {rank}
        </Text>
      ) : (
        <Text style={[avatarStyles.text, { fontSize: size * 0.38, color: color }]}>
          {name.slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", borderWidth: 2, overflow: "hidden" },
  text: { fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  rankText: { fontWeight: "900", fontFamily: "Inter_900Black" },
});

function colorForName(name: string): string {
  const colors = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Podium top-3 ───────────────────────────────────────────────────────────────
function Podium({
  top3,
  colors,
  myId,
}: {
  top3: RatingUser[];
  colors: ReturnType<typeof useAppColors>;
  myId: string;
}) {
  if (top3.length === 0) return null;
  const order = [1, 0, 2];
  const heights = [110, 150, 90];
  const positions = ["2 место", "1 место", "3 место"];

  return (
    <View style={podiumStyles.wrap}>
      {order.map((idx, pos) => {
        const user = top3[idx];
        if (!user) return <View key={idx} style={{ width: 90 }} />;
        const isMe = user.id === myId;
        const color = isMe ? colors.primary : colorForName(user.name);
        return (
          <View key={user.id} style={podiumStyles.pillarWrap}>
            <Avatar name={user.name} size={64} color={color} isMascot={isMe} rank={idx + 1} />
            <View
              style={[
                podiumStyles.pillar,
                {
                  height: heights[pos],
                  backgroundColor: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#CD7F32",
                  shadowColor: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#CD7F32",
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 10,
                },
              ]}
            >
              <Text style={podiumStyles.positionText}>{positions[pos]}</Text>
              <Text style={podiumStyles.xpOnPillar}>{user.xp}</Text>
            </View>
            <Text style={[podiumStyles.name, { color: colors.foreground }]} numberOfLines={1}>
              {user.name}{isMe ? " (ты)" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const podiumStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 24, height: 260 },
  pillarWrap: { width: 110, alignItems: "center" },
  pillar: {
    width: 84,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginTop: 10,
  },
  positionText: { fontSize: 10, fontWeight: "800", color: "#1a1a1a", opacity: 0.7, fontFamily: "Inter_800ExtraBold" },
  xpOnPillar: { fontSize: 18, fontWeight: "900", color: "#1a1a1a", fontFamily: "Inter_900Black" },
  name: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 10, textAlign: "center" },
});

// ── Leaderboard row ────────────────────────────────────────────────────────────
function LeaderboardRow({
  rank,
  user,
  isMe,
  maxXp,
  colors,
}: {
  rank: number;
  user: RatingUser;
  isMe: boolean;
  maxXp: number;
  colors: ReturnType<typeof useAppColors>;
}) {
  const barWidth = maxXp > 0 ? `${Math.max(4, (user.xp / maxXp) * 100)}%` : "4%";
  const avatarColor = isMe ? colors.primary : colorForName(user.name);
  const leagueColor = LEAGUE_COLORS[(user.league ?? 1) - 1] ?? LEAGUE_COLORS[0];
  const top3 = rank <= 3;

  return (
    <View
      style={[
        lbStyles.row,
        {
          backgroundColor: isMe ? colors.primary + "15" : colors.card,
          borderColor: isMe ? colors.primary + "40" : colors.border,
        },
      ]}
    >
      <View style={lbStyles.rankWrap}>
        {top3 ? (
          <Text style={lbStyles.rankEmoji}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</Text>
        ) : (
          <Text style={[lbStyles.rankNum, { color: colors.mutedForeground }]}>{rank}</Text>
        )}
      </View>
      <Avatar name={user.name} size={42} color={avatarColor} isMascot={isMe} />
      <View style={lbStyles.info}>
        <View style={lbStyles.nameRow}>
          <Text style={[lbStyles.name, { color: colors.foreground }]} numberOfLines={1}>
            {user.name}{isMe ? " (ты)" : ""}
          </Text>
          <View style={[lbStyles.leagueBadge, { backgroundColor: leagueColor + "22" }]}>
            <Text style={[lbStyles.leagueText, { color: leagueColor }]}>{LEAGUE_NAMES[(user.league ?? 1) - 1]}</Text>
          </View>
        </View>
        <View style={lbStyles.barRow}>
          <View style={[lbStyles.track, { backgroundColor: colors.track }]}>
            <View style={[lbStyles.fill, { width: barWidth as any, backgroundColor: isMe ? colors.primary : avatarColor }]} />
          </View>
          <Text style={[lbStyles.xp, { color: isMe ? colors.primary : colors.foreground }]}>{user.xp}</Text>
        </View>
      </View>
    </View>
  );
}

const lbStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  rankWrap: { width: 30, alignItems: "center" },
  rankEmoji: { fontSize: 22 },
  rankNum: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  info: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  leagueText: { fontSize: 10, fontWeight: "800" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  track: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  xp: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_800ExtraBold", minWidth: 45, textAlign: "right" },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RatingScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { userStats } = useApp();

  const [activeTab, setActiveTab] = useState<RatingTab>("group");
  const [groupUsers, setGroupUsers] = useState<RatingUser[]>([]);
  const [streamUsers, setStreamUsers] = useState<RatingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const pb = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const hasGroup = Boolean(userStats.group);

  const me: RatingUser = {
    id: userStats.userId,
    username: userStats.username,
    name: userStats.name,
    group: userStats.group,
    xp: userStats.xp,
    streak: userStats.streak,
    league: userStats.league,
  };

  const currentList = activeTab === "group" ? groupUsers : streamUsers;
  const sortedList = [...currentList].sort((a, b) => b.xp - a.xp || b.streak - a.streak);
  // Ensure current user appears in the list even if sync hasn't reached server yet
  const visibleList = sortedList.some((u) => u.id === userStats.userId)
    ? sortedList
    : [...sortedList, me].sort((a, b) => b.xp - a.xp || b.streak - a.streak);
  const top3 = visibleList.slice(0, 3);
  const rest = visibleList.slice(3);
  const maxXp = visibleList[0]?.xp ?? 1;

  const fetchRatings = useCallback(async () => {
    if (!userStats.userId || !userStats.group) return;
    setIsLoading(true);
    try {
      const base = getApiBase();
      const [groupRes, streamRes] = await Promise.all([
        fetch(`${base}/ratings?group=${encodeURIComponent(userStats.group)}`),
        fetch(`${base}/ratings/all`),
      ]);

      const groupOk = groupRes.ok;
      const streamOk = streamRes.ok;
      setIsBackendAvailable(groupOk || streamOk);

      if (groupOk) {
        const data = await groupRes.json();
        setGroupUsers(Array.isArray(data) ? data : []);
      }
      if (streamOk) {
        const data = await streamRes.json();
        setStreamUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      setIsBackendAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [userStats.userId, userStats.group]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRatings();
    setRefreshing(false);
  }, [fetchRatings]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: pt + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Рейтинг</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subForeground }]}>
            {hasGroup ? `Группа ${userStats.group}` : "Выбери группу в настройках"}
          </Text>
        </View>
      </View>

      {!isBackendAvailable && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.amber + "15", borderColor: colors.amber + "30" }]}>
          <Feather name="wifi-off" size={14} color={colors.amber} />
          <Text style={[styles.offlineText, { color: colors.amber }]}>Сервер недоступен. Рейтинг обновится позже.</Text>
        </View>
      )}

      <View style={[styles.tabBar, { backgroundColor: colors.secondary }]}>
        {[
          { key: "group" as RatingTab, label: "Моя группа", icon: "users" },
          { key: "stream" as RatingTab, label: "Весь поток", icon: "bar-chart" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={async () => { await Haptics.selectionAsync(); setActiveTab(t.key); }}
            style={[styles.tabBtn, activeTab === t.key && { backgroundColor: colors.primary }]}
          >
            <View style={styles.tabInner}>
              <Feather name={t.icon as React.ComponentProps<typeof Feather>["name"]} size={14} color={activeTab === t.key ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: activeTab === t.key ? colors.primaryForeground : colors.mutedForeground }]}>{t.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: pb + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {isLoading && visibleList.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : visibleList.length === 0 ? (
          <EmptyState
            icon="bar-chart-2"
            title="Пока пусто"
            subtitle={activeTab === "group" ? "В твоей группе пока никого нет. Стань первым!" : "В потоке пока никого нет. Стань первым!"}
            colors={colors}
          />
        ) : (
          <View style={styles.section}>
            <Podium top3={top3} colors={colors} myId={userStats.userId} />
            {rest.map((u, i) => {
              const rank = i + 4;
              return (
                <LeaderboardRow
                  key={u.id}
                  rank={rank}
                  user={u}
                  isMe={u.id === userStats.userId}
                  maxXp={maxXp}
                  colors={colors}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, title, subtitle, colors }: { icon: string; title: string; subtitle: string; colors: ReturnType<typeof useAppColors> }) {
  return (
    <View style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
        <Feather name={icon as React.ComponentProps<typeof Feather>["name"]} size={28} color={colors.primary} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[emptyStyles.subtitle, { color: colors.subForeground }]}>{subtitle}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12, paddingVertical: 48 },
  iconWrap: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 30 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerLeft: { gap: 2, flex: 1 },
  headerTitle: { fontSize: 30, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  headerSubtitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  offlineBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  offlineText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  tabBar: { flexDirection: "row", marginHorizontal: 20, marginBottom: 14, borderRadius: 16, padding: 4, gap: 3 },
  tabBtn: { flex: 1, borderRadius: 12, paddingVertical: 9 },
  tabInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  tabLabel: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  content: { paddingTop: 6 },
  section: { paddingHorizontal: 20, gap: 10 },
});
