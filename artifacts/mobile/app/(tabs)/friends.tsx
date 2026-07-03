import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Clipboard,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import { useFriends, FriendUser } from "@/contexts/FriendsContext";
import { useAppColors } from "@/hooks/useAppColors";
import Mascot from "@/components/Mascot";

const { width: SCREEN_W } = Dimensions.get("window");

const LEAGUE_NAMES = ["Бронза", "Серебро", "Золото", "Платина", "Алмаз"];
const LEAGUE_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];
const RANK_BG = ["#FFD70022", "#C0C0C022", "#CD7F3222"];
const RANK_BORDER = ["#FFD70066", "#C0C0C066", "#CD7F3266"];
const RANK_EMOJI = ["🥇", "🥈", "🥉"];

type Tab = "leaderboard" | "search" | "requests";

// ── Avatar chip ────────────────────────────────────────────────────────────────
function Avatar({
  name,
  size = 44,
  color,
  isMascot,
}: {
  name: string;
  size?: number;
  color: string;
  isMascot?: boolean;
}) {
  if (isMascot) {
    return (
      <View
        style={[
          avatarStyles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + "22",
            borderColor: color + "55",
          },
        ]}
      >
        <Mascot type="penguin" size={size * 0.75} mode="idle" />
      </View>
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <View
      style={[
        avatarStyles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "22",
          borderColor: color + "55",
        },
      ]}
    >
      <Text style={[avatarStyles.text, { fontSize: size * 0.38, color }]}>
        {initials || "?"}
      </Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", borderWidth: 2 },
  text: { fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
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
  top3: Array<{ id: string; name: string; xp: number; league: number }>;
  colors: ReturnType<typeof useAppColors>;
  myId: string;
}) {
  if (top3.length === 0) return null;

  // Render order: 2nd, 1st, 3rd
  const order = [1, 0, 2];
  const heights = [96, 132, 78];

  return (
    <View style={podiumStyles.wrap}>
      {order.map((idx, pos) => {
        const user = top3[idx];
        if (!user) return <View key={idx} style={{ width: 80 }} />;
        const isMe = user.id === myId;
        const color = isMe ? colors.primary : colorForName(user.name);
        return (
          <View key={user.id} style={podiumStyles.pillarWrap}>
            <Avatar name={user.name} size={54} color={color} isMascot={isMe} />
            <View
              style={[
                podiumStyles.pillar,
                {
                  height: heights[pos],
                  backgroundColor: RANK_BG[idx] || colors.card,
                  borderColor: RANK_BORDER[idx] || colors.border,
                },
              ]}
            >
              <Text style={podiumStyles.rankEmoji}>{RANK_EMOJI[idx]}</Text>
            </View>
            <Text style={[podiumStyles.name, { color: colors.foreground }]} numberOfLines={1}>
              {user.name}{isMe ? " (ты)" : ""}
            </Text>
            <Text style={[podiumStyles.xp, { color: colors.subForeground }]}>{user.xp} XP</Text>
          </View>
        );
      })}
    </View>
  );
}

const podiumStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 14, marginBottom: 20, height: 210 },
  pillarWrap: { width: 100, alignItems: "center" },
  pillar: {
    width: 72,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  rankEmoji: { fontSize: 28 },
  name: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 8, textAlign: "center" },
  xp: { fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginTop: 2 },
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
  user: { id: string; name: string; username: string; xp: number; league: number };
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
          backgroundColor: isMe ? colors.primary + "18" : colors.card,
          borderColor: isMe ? colors.primary + "50" : colors.border,
          paddingTop: top3 ? 10 : 12,
        },
      ]}
    >
      <View style={lbStyles.rankWrap}>
        {top3 ? (
          <Text style={lbStyles.rankEmoji}>{RANK_EMOJI[rank - 1]}</Text>
        ) : (
          <Text style={[lbStyles.rankNum, { color: colors.mutedForeground }]}>{rank}</Text>
        )}
      </View>
      <Avatar name={user.name} size={42} color={avatarColor} isMascot={isMe} />
      <View style={lbStyles.info}>
        <View style={lbStyles.nameRow}>
          <Text style={[lbStyles.name, { color: colors.foreground }]} numberOfLines={1}>
            {user.name}
            {isMe ? " (ты)" : ""}
          </Text>
          <View style={[lbStyles.leagueBadge, { backgroundColor: leagueColor + "22" }]}>
            <Text style={[lbStyles.leagueText, { color: leagueColor }]}>
              {LEAGUE_NAMES[(user.league ?? 1) - 1]}
            </Text>
          </View>
        </View>
        <View style={lbStyles.barRow}>
          <View style={[lbStyles.track, { backgroundColor: colors.track }]}>
            <View
              style={[
                lbStyles.fill,
                { width: barWidth as any, backgroundColor: isMe ? colors.primary : avatarColor },
              ]}
            />
          </View>
          <Text style={[lbStyles.xp, { color: isMe ? colors.primary : colors.foreground }]}>
            {user.xp}
          </Text>
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
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  rankWrap: { width: 32, alignItems: "center" },
  rankEmoji: { fontSize: 22 },
  rankNum: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  info: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  leagueText: { fontSize: 10, fontWeight: "800" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  xp: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_800ExtraBold", minWidth: 50, textAlign: "right" },
});

// ── Friend card (search results / friends list) ─────────────────────────────────
function FriendCard({
  friend,
  myXp,
  colors,
  onRemove,
}: {
  friend: FriendUser;
  myXp: number;
  colors: ReturnType<typeof useAppColors>;
  onRemove: () => void;
}) {
  const diff = friend.xp - myXp;
  const avatarColor = colorForName(friend.name);
  const leagueColor = LEAGUE_COLORS[(friend.league ?? 1) - 1] ?? LEAGUE_COLORS[0];

  const handleRemove = () => {
    Alert.alert("Удалить из друзей?", `${friend.name} (@${friend.username}) будет удалён.`, [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: onRemove },
    ]);
  };

  return (
    <View style={[fcStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar name={friend.name} size={48} color={avatarColor} />
      <View style={fcStyles.info}>
        <View style={fcStyles.nameRow}>
          <Text style={[fcStyles.name, { color: colors.foreground }]} numberOfLines={1}>
            {friend.name}
          </Text>
          <View style={[fcStyles.leagueBadge, { backgroundColor: leagueColor + "22" }]}>
            <Text style={[fcStyles.leagueText, { color: leagueColor }]}>
              {LEAGUE_NAMES[(friend.league ?? 1) - 1]}
            </Text>
          </View>
        </View>
        <Text style={[fcStyles.username, { color: colors.mutedForeground }]}>@{friend.username}</Text>
        <View style={fcStyles.xpRow}>
          <Feather name="zap" size={13} color={colors.amber} />
          <Text style={[fcStyles.xpText, { color: colors.foreground }]}>{friend.xp} XP</Text>
          {diff !== 0 && (
            <View style={[fcStyles.diffBadge, { backgroundColor: diff > 0 ? colors.red + "18" : colors.green + "18" }]}>
              <Feather name={diff > 0 ? "trending-up" : "trending-down"} size={11} color={diff > 0 ? colors.red : colors.green} />
              <Text style={[fcStyles.diffText, { color: diff > 0 ? colors.red : colors.green }]}>
                {diff > 0 ? `+${diff}` : diff} от тебя
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleRemove} style={fcStyles.removeBtn} hitSlop={8}>
        <Feather name="user-minus" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const fcStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  leagueText: { fontSize: 10, fontWeight: "800" },
  username: { fontSize: 12, fontFamily: "Inter_500Medium" },
  xpRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  xpText: { fontSize: 13, fontWeight: "600" },
  diffBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: "600" },
  removeBtn: { padding: 4 },
});

// ── Request card ───────────────────────────────────────────────────────────────
function RequestCard({
  user,
  colors,
  onAccept,
  onDecline,
}: {
  user: FriendUser;
  colors: ReturnType<typeof useAppColors>;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const avatarColor = colorForName(user.name);
  return (
    <View style={[reqStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar name={user.name} size={46} color={avatarColor} />
      <View style={reqStyles.info}>
        <Text style={[reqStyles.name, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[reqStyles.username, { color: colors.mutedForeground }]}>@{user.username} · {user.xp} XP</Text>
      </View>
      <View style={reqStyles.btns}>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAccept(); }}
          style={[reqStyles.btn, { backgroundColor: colors.green }]}
        >
          <Feather name="check" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDecline(); }}
          style={[reqStyles.btn, { backgroundColor: colors.border }]}
        >
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  username: { fontSize: 12, fontFamily: "Inter_500Medium" },
  btns: { flexDirection: "row", gap: 10 },
  btn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function FriendsScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { userStats } = useApp();
  const {
    friends,
    pendingRequests,
    isLoading,
    isBackendAvailable,
    refresh,
    searchUser,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<FriendUser | null | "not_found" | "loading">(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const pt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const pb = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const me: FriendUser = {
    id: userStats.userId,
    username: userStats.username,
    name: userStats.name,
    xp: userStats.xp,
    streak: userStats.streak,
    league: userStats.league,
  };
  const leaderboard = [me, ...friends].sort((a, b) => b.xp - a.xp);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const maxXp = leaderboard[0]?.xp ?? 1;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const copyUsername = () => {
    Clipboard.setString(`@${userStats.username}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Скопировано!", `@${userStats.username} — отправь другу.`);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchResult("loading");
    const result = await searchUser(searchQuery.trim());
    setSearchResult(result ?? "not_found");
  };

  const handleSendRequest = async (friendId: string) => {
    setSendingTo(friendId);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { ok, error } = await sendRequest(friendId);
    setSendingTo(null);
    if (ok) {
      setSentTo((prev) => new Set(prev).add(friendId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const msg = error === "Request already exists" ? "Заявка уже отправлена или вы уже друзья" : error ?? "Ошибка при отправке";
      Alert.alert("Не удалось", msg);
    }
  };

  const isAlreadyFriend = (id: string) =>
    friends.some((f) => f.id === id) || sentTo.has(id) || pendingRequests.some((r) => r.id === id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: pt + 10 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Друзья</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subForeground }]}>Соревнуйся и мотивируй друг друга</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={copyUsername} style={[styles.usernameBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" }]}>
            <Text style={[styles.usernameText, { color: colors.primary }]}>@{userStats.username}</Text>
            <Feather name="copy" size={12} color={colors.primary} />
          </TouchableOpacity>
          {pendingRequests.length > 0 && activeTab !== "requests" && (
            <TouchableOpacity onPress={() => setActiveTab("requests")} style={[styles.notifBell, { backgroundColor: colors.red + "18" }]}>
              <Feather name="bell" size={18} color={colors.red} />
              <View style={[styles.badge, { backgroundColor: colors.red }]}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Offline banner */}
      {!isBackendAvailable && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.amber + "18", borderColor: colors.amber + "30" }]}>
          <Feather name="wifi-off" size={14} color={colors.amber} />
          <Text style={[styles.offlineText, { color: colors.amber }]}>Сервер недоступен. Функции друзей требуют подключения.</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { key: "leaderboard" as Tab, label: "Рейтинг", icon: "award" },
          { key: "search" as Tab, label: "Поиск", icon: "search" },
          { key: "requests" as Tab, label: "Заявки", badge: pendingRequests.length },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={async () => { await Haptics.selectionAsync(); setActiveTab(t.key); }}
            style={[
              styles.tabBtn,
              activeTab === t.key && { backgroundColor: colors.primary },
            ]}
          >
            <View style={styles.tabInner}>
              <Feather name={t.icon as React.ComponentProps<typeof Feather>["name"]} size={14} color={activeTab === t.key ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: activeTab === t.key ? colors.primaryForeground : colors.mutedForeground }]}>{t.label}</Text>
              {t.badge != null && t.badge > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: activeTab === t.key ? colors.primaryForeground : colors.red }]}>
                  <Text style={[styles.badgeText, { color: activeTab === t.key ? colors.primary : "white" }]}>{t.badge}</Text>
                </View>
              )}
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
        {/* ── LEADERBOARD TAB ── */}
        {activeTab === "leaderboard" && (
          <View style={styles.section}>
            {leaderboard.length === 0 ? (
              <EmptyState icon="users" title="Пока нет друзей" subtitle="Найди друзей через поиск и соревнуйся с ними" colors={colors} />
            ) : (
              <>
                <Podium top3={top3} colors={colors} myId={userStats.userId} />
                {leaderboard.length === 1 && (
                  <View style={[styles.hintCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                    <Feather name="users" size={14} color={colors.primary} />
                    <Text style={[styles.hintText, { color: colors.primary }]}>Добавь друзей, чтобы увидеть их на подиуме!</Text>
                  </View>
                )}
                {rest.map((u, i) => (
                  <LeaderboardRow
                    key={u.id}
                    rank={i + 4}
                    user={u}
                    isMe={u.id === userStats.userId}
                    maxXp={maxXp}
                    colors={colors}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── SEARCH TAB ── */}
        {activeTab === "search" && (
          <View style={styles.section}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="at-sign" size={16} color={colors.mutedForeground} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Введи username друга..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResult(null); }}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={handleSearch} style={[styles.searchBtn, { backgroundColor: colors.primary }]} disabled={!searchQuery.trim()}>
              <Feather name="search" size={16} color={colors.primaryForeground} />
              <Text style={[styles.searchBtnText, { color: colors.primaryForeground }]}>Найти</Text>
            </TouchableOpacity>

            {searchResult === "loading" && <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} />}

            {searchResult === "not_found" && (
              <View style={[styles.notFoundCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user-x" size={28} color={colors.mutedForeground} />
                <Text style={[styles.notFoundText, { color: colors.subForeground }]}>Пользователь не найден</Text>
              </View>
            )}

            {searchResult && searchResult !== "loading" && searchResult !== "not_found" && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.primary + "50" }]}>
                <Avatar name={searchResult.name} size={52} color={colorForName(searchResult.name)} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.resultName, { color: colors.foreground }]}>{searchResult.name}</Text>
                  <Text style={[styles.resultUsername, { color: colors.mutedForeground }]}>@{searchResult.username}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="zap" size={13} color={colors.amber} />
                    <Text style={[styles.resultXp, { color: colors.subForeground }]}>{searchResult.xp} XP</Text>
                    <Text style={[styles.resultLeague, { color: LEAGUE_COLORS[(searchResult.league ?? 1) - 1] }]}>{LEAGUE_NAMES[(searchResult.league ?? 1) - 1]}</Text>
                  </View>
                </View>
                {searchResult.id === userStats.userId ? (
                  <View style={[styles.youChip, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.youChipText, { color: colors.primary }]}>Это ты</Text>
                  </View>
                ) : isAlreadyFriend(searchResult.id) ? (
                  <View style={[styles.youChip, { backgroundColor: colors.green + "20" }]}>
                    <Feather name="check" size={14} color={colors.green} />
                    <Text style={[styles.youChipText, { color: colors.green }]}>Отправлено</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleSendRequest(searchResult.id)} disabled={sendingTo === searchResult.id} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    {sendingTo === searchResult.id ? (
                      <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                      <>
                        <Feather name="user-plus" size={14} color={colors.primaryForeground} />
                        <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Добавить</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {friends.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.subForeground }]}>Друзья ({friends.length})</Text>
                {friends.map((f) => (
                  <FriendCard key={f.id} friend={f} myXp={userStats.xp} colors={colors} onRemove={() => removeFriend(f.id)} />
                ))}
              </>
            )}

            {friends.length === 0 && !searchResult && (
              <EmptyState icon="search" title="Найди друзей" subtitle={`Поделись своим username @${userStats.username} с друзьями`} colors={colors} />
            )}
          </View>
        )}

        {/* ── REQUESTS TAB ── */}
        {activeTab === "requests" && (
          <View style={styles.section}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : pendingRequests.length === 0 ? (
              <EmptyState icon="inbox" title="Заявок нет" subtitle="Входящие запросы в друзья появятся здесь" colors={colors} />
            ) : (
              pendingRequests.map((r) => (
                <RequestCard key={r.id} user={r} colors={colors} onAccept={() => acceptRequest(r.id)} onDecline={() => declineRequest(r.id)} />
              ))
            )}
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
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 30, fontWeight: "800", fontFamily: "Inter_800ExtraBold" },
  headerSubtitle: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  usernameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  usernameText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  notifBell: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  offlineBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  offlineText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  tabBar: { flexDirection: "row", marginHorizontal: 20, marginBottom: 14, borderRadius: 16, borderWidth: 1.5, padding: 4, gap: 3 },
  tabBtn: { flex: 1, borderRadius: 12, paddingVertical: 9 },
  tabInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  tabLabel: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  content: { paddingHorizontal: 20, gap: 10 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 6, marginBottom: 2 },
  hintCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  hintText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  searchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 18 },
  searchBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  notFoundCard: { alignItems: "center", gap: 10, paddingVertical: 36, borderRadius: 18, borderWidth: 1.5 },
  notFoundText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  resultName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultUsername: { fontSize: 12, fontFamily: "Inter_500Medium" },
  resultXp: { fontSize: 13, fontWeight: "600" },
  resultLeague: { fontSize: 12, fontWeight: "700" },
  youChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  youChipText: { fontSize: 12, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { fontSize: 13, fontWeight: "700" },
});
