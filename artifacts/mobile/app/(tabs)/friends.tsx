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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/contexts/AppContext";
import { useFriends, FriendUser } from "@/contexts/FriendsContext";
import { useAppColors } from "@/hooks/useAppColors";

const LEAGUE_NAMES = ["Бронза", "Серебро", "Золото", "Платина", "Алмаз"];
const LEAGUE_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];

type Tab = "leaderboard" | "search" | "requests";

// ── Avatar chip ────────────────────────────────────────────────────────────────
function Avatar({
  name,
  size = 42,
  color,
}: {
  name: string;
  size?: number;
  color: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <View
      style={[
        avatarStyles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + "30", borderColor: color + "60" },
      ]}
    >
      <Text style={[avatarStyles.text, { fontSize: size * 0.38, color }]}>
        {initials || "?"}
      </Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  text: { fontWeight: "800", fontFamily: "Inter_700Bold" },
});

// Deterministic color from string
function colorForName(name: string): string {
  const colors = [
    "#6366F1", "#EC4899", "#F59E0B", "#10B981",
    "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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
  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const avatarColor = isMe ? colors.primary : colorForName(user.name);
  const leagueColor = LEAGUE_COLORS[(user.league ?? 1) - 1] ?? LEAGUE_COLORS[0];

  return (
    <View
      style={[
        lbStyles.row,
        {
          backgroundColor: isMe ? colors.primary + "14" : colors.card,
          borderColor: isMe ? colors.primary + "40" : colors.border,
        },
      ]}
    >
      <View style={lbStyles.rankWrap}>
        {rankEmoji ? (
          <Text style={lbStyles.rankEmoji}>{rankEmoji}</Text>
        ) : (
          <Text style={[lbStyles.rankNum, { color: colors.mutedForeground }]}>{rank}</Text>
        )}
      </View>
      <Avatar name={user.name} size={38} color={avatarColor} />
      <View style={lbStyles.info}>
        <View style={lbStyles.nameRow}>
          <Text style={[lbStyles.name, { color: colors.foreground }]} numberOfLines={1}>
            {user.name}
            {isMe ? " (ты)" : ""}
          </Text>
          <View style={[lbStyles.leagueBadge, { backgroundColor: leagueColor + "25" }]}>
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
            {user.xp} XP
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
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rankWrap: { width: 28, alignItems: "center" },
  rankEmoji: { fontSize: 20 },
  rankNum: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  info: { flex: 1, gap: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  leagueText: { fontSize: 11, fontWeight: "700" },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  xp: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", minWidth: 60, textAlign: "right" },
});

// ── Friend card ────────────────────────────────────────────────────────────────
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
    Alert.alert(
      "Удалить из друзей?",
      `${friend.name} (@${friend.username}) будет удалён из твоего списка.`,
      [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: onRemove },
      ]
    );
  };

  return (
    <View style={[fcStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Avatar name={friend.name} size={44} color={avatarColor} />
      <View style={fcStyles.info}>
        <View style={fcStyles.nameRow}>
          <Text style={[fcStyles.name, { color: colors.foreground }]} numberOfLines={1}>
            {friend.name}
          </Text>
          <View style={[fcStyles.leagueBadge, { backgroundColor: leagueColor + "25" }]}>
            <Text style={[fcStyles.leagueText, { color: leagueColor }]}>
              {LEAGUE_NAMES[(friend.league ?? 1) - 1]}
            </Text>
          </View>
        </View>
        <Text style={[fcStyles.username, { color: colors.mutedForeground }]}>
          @{friend.username}
        </Text>
        <View style={fcStyles.xpRow}>
          <Feather name="zap" size={13} color={colors.amber} />
          <Text style={[fcStyles.xpText, { color: colors.foreground }]}>{friend.xp} XP</Text>
          {diff !== 0 && (
            <View
              style={[
                fcStyles.diffBadge,
                { backgroundColor: diff > 0 ? colors.red + "18" : colors.green + "18" },
              ]}
            >
              <Feather
                name={diff > 0 ? "trending-up" : "trending-down"}
                size={11}
                color={diff > 0 ? colors.red : colors.green}
              />
              <Text
                style={[fcStyles.diffText, { color: diff > 0 ? colors.red : colors.green }]}
              >
                {diff > 0 ? `+${diff}` : diff} от тебя
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleRemove} style={fcStyles.removeBtn} hitSlop={8}>
        <Feather name="user-minus" size={17} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

const fcStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  leagueText: { fontSize: 11, fontWeight: "700" },
  username: { fontSize: 12 },
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
      <Avatar name={user.name} size={42} color={avatarColor} />
      <View style={reqStyles.info}>
        <Text style={[reqStyles.name, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[reqStyles.username, { color: colors.mutedForeground }]}>
          @{user.username} · {user.xp} XP
        </Text>
      </View>
      <View style={reqStyles.btns}>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAccept(); }}
          style={[reqStyles.btn, { backgroundColor: colors.primary }]}
        >
          <Feather name="check" size={15} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDecline(); }}
          style={[reqStyles.btn, { backgroundColor: colors.border }]}
        >
          <Feather name="x" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  username: { fontSize: 12 },
  btns: { flexDirection: "row", gap: 8 },
  btn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
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

  // Build leaderboard: self + friends sorted by XP
  const me: FriendUser = {
    id: userStats.userId,
    username: userStats.username,
    name: userStats.name,
    xp: userStats.xp,
    streak: userStats.streak,
    league: userStats.league,
  };
  const leaderboard = [me, ...friends].sort((a, b) => b.xp - a.xp);
  const maxXp = leaderboard[0]?.xp ?? 1;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const copyUsername = () => {
    Clipboard.setString(`@${userStats.username}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Скопировано!", `@${userStats.username} скопирован в буфер.`);
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
      const msg =
        error === "Request already exists"
          ? "Заявка уже отправлена или вы уже друзья"
          : error ?? "Ошибка при отправке";
      Alert.alert("Не удалось", msg);
    }
  };

  const isAlreadyFriend = (id: string) =>
    friends.some((f) => f.id === id) || sentTo.has(id) || pendingRequests.some((r) => r.id === id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: pt + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Друзья</Text>
          <TouchableOpacity onPress={copyUsername} style={[styles.usernameBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" }]}>
            <Text style={[styles.usernameText, { color: colors.primary }]}>@{userStats.username}</Text>
            <Feather name="copy" size={12} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {pendingRequests.length > 0 && activeTab !== "requests" && (
          <TouchableOpacity
            onPress={() => setActiveTab("requests")}
            style={[styles.notifBell, { backgroundColor: colors.red + "18" }]}
          >
            <Feather name="bell" size={18} color={colors.red} />
            <View style={[styles.badge, { backgroundColor: colors.red }]}>
              <Text style={styles.badgeText}>{pendingRequests.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Backend unavailable banner */}
      {!isBackendAvailable && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.amber + "18", borderColor: colors.amber + "30" }]}>
          <Feather name="wifi-off" size={14} color={colors.amber} />
          <Text style={[styles.offlineText, { color: colors.amber }]}>
            Сервер недоступен. Функции друзей требуют подключения.
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(
          [
            { key: "leaderboard" as Tab, label: "Рейтинг", icon: "award", badge: undefined as number | undefined },
            { key: "search" as Tab, label: "Поиск", icon: "search", badge: undefined as number | undefined },
            { key: "requests" as Tab, label: "Заявки", icon: "user-plus", badge: pendingRequests.length as number | undefined },
          ]
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={async () => {
              await Haptics.selectionAsync();
              setActiveTab(t.key);
            }}
            style={[
              styles.tabBtn,
              activeTab === t.key && { backgroundColor: colors.primary + "18" },
            ]}
          >
            <View style={styles.tabInner}>
              <Feather
                name={t.icon as React.ComponentProps<typeof Feather>["name"]}
                size={15}
                color={activeTab === t.key ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === t.key ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t.label}
              </Text>
              {t.badge != null && t.badge > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.red }]}>
                  <Text style={styles.badgeText}>{t.badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: pb + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── LEADERBOARD TAB ── */}
        {activeTab === "leaderboard" && (
          <View style={styles.section}>
            {leaderboard.length === 0 ? (
              <EmptyState
                icon="users"
                title="Пока нет друзей"
                subtitle="Найди друзей через поиск и соревнуйся с ними"
                colors={colors}
              />
            ) : (
              <>
                {leaderboard.length === 1 && (
                  <View style={[styles.hintCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                    <Feather name="users" size={14} color={colors.primary} />
                    <Text style={[styles.hintText, { color: colors.primary }]}>
                      Добавь друзей, чтобы соревноваться с ними в рейтинге!
                    </Text>
                  </View>
                )}
                {leaderboard.map((u, i) => (
                  <LeaderboardRow
                    key={u.id}
                    rank={i + 1}
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
            <TouchableOpacity
              onPress={handleSearch}
              style={[styles.searchBtn, { backgroundColor: colors.primary }]}
              disabled={!searchQuery.trim()}
            >
              <Feather name="search" size={16} color="white" />
              <Text style={styles.searchBtnText}>Найти</Text>
            </TouchableOpacity>

            {searchResult === "loading" && (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            )}

            {searchResult === "not_found" && (
              <View style={[styles.notFoundCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user-x" size={24} color={colors.mutedForeground} />
                <Text style={[styles.notFoundText, { color: colors.subForeground }]}>
                  Пользователь не найден
                </Text>
              </View>
            )}

            {searchResult && searchResult !== "loading" && searchResult !== "not_found" && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
                <Avatar name={searchResult.name} size={48} color={colorForName(searchResult.name)} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.resultName, { color: colors.foreground }]}>{searchResult.name}</Text>
                  <Text style={[styles.resultUsername, { color: colors.mutedForeground }]}>@{searchResult.username}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="zap" size={13} color={colors.amber} />
                    <Text style={[styles.resultXp, { color: colors.subForeground }]}>{searchResult.xp} XP</Text>
                    <Text style={[styles.resultLeague, { color: LEAGUE_COLORS[(searchResult.league ?? 1) - 1] }]}>
                      {LEAGUE_NAMES[(searchResult.league ?? 1) - 1]}
                    </Text>
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
                  <TouchableOpacity
                    onPress={() => handleSendRequest(searchResult.id)}
                    disabled={sendingTo === searchResult.id}
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  >
                    {sendingTo === searchResult.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Feather name="user-plus" size={14} color="white" />
                        <Text style={styles.addBtnText}>Добавить</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Friends list below search */}
            {friends.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.subForeground }]}>
                  Друзья ({friends.length})
                </Text>
                {friends.map((f) => (
                  <FriendCard
                    key={f.id}
                    friend={f}
                    myXp={userStats.xp}
                    colors={colors}
                    onRemove={() => removeFriend(f.id)}
                  />
                ))}
              </>
            )}

            {friends.length === 0 && !searchResult && (
              <EmptyState
                icon="search"
                title="Найди друзей"
                subtitle={`Поделись своим username @${userStats.username} с друзьями`}
                colors={colors}
              />
            )}
          </View>
        )}

        {/* ── REQUESTS TAB ── */}
        {activeTab === "requests" && (
          <View style={styles.section}>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : pendingRequests.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Заявок нет"
                subtitle="Входящие запросы в друзья появятся здесь"
                colors={colors}
              />
            ) : (
              pendingRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  user={r}
                  colors={colors}
                  onAccept={() => acceptRequest(r.id)}
                  onDecline={() => declineRequest(r.id)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  colors,
}: {
  icon: string;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useAppColors>;
}) {
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
  wrap: { alignItems: "center", gap: 12, paddingVertical: 40 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerLeft: { gap: 6 },
  headerTitle: { fontSize: 26, fontWeight: "800", fontFamily: "Inter_700Bold" },
  usernameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  usernameText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  notifBell: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 2,
  },
  tabBtn: { flex: 1, borderRadius: 10, paddingVertical: 8 },
  tabInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  tabLabel: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  tabBadge: {
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  content: { paddingHorizontal: 20, gap: 10 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginTop: 4 },
  hintCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  hintText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  searchBtnText: { color: "white", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  notFoundCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  notFoundText: { fontSize: 14 },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  resultName: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resultUsername: { fontSize: 12 },
  resultXp: { fontSize: 13, fontWeight: "600" },
  resultLeague: { fontSize: 12, fontWeight: "700" },
  youChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  youChipText: { fontSize: 12, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
});
