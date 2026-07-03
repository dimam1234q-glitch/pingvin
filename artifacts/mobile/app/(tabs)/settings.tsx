import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import Mascot, { MascotType } from "@/components/Mascot";
import THEMES, { ThemeId } from "@/constants/themes";
import type { FontSize } from "@/contexts/AppContext";

const MASCOT_OPTIONS: { type: MascotType; name: string }[] = [
  { type: "penguin", name: "Пингвин" },
  { type: "raccoon", name: "Енот" },
  { type: "bear", name: "Медведь" },
];

const FONT_SIZES: { id: FontSize; label: string; size: number }[] = [
  { id: "small", label: "Маленький", size: 13 },
  { id: "medium", label: "Средний", size: 16 },
  { id: "large", label: "Большой", size: 19 },
];

const AVATAR_COLORS = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
];

export default function SettingsScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, userStats, resetProgress } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const pt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const pb = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const handleTheme = async (id: ThemeId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ theme: id });
  };

  const handleFontSize = async (id: FontSize) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ fontSize: id });
  };

  const handleMascot = async (type: MascotType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ mascot: type });
  };

  const handleAvatarColor = async (color: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings({ avatarColor: color });
  };

  const handleReset = () => {
    Alert.alert(
      "Сбросить прогресс?",
      "Весь прогресс, XP и стрик будут удалены. Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: async () => {
            await resetProgress();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: pt + 8 }]}>
        <Feather name="settings" size={20} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Настройки
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: pb + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme */}
        <SectionCard title="Тема" iconName="moon" colors={colors}>
          <View style={styles.themeGrid}>
            {(Object.values(THEMES) as (typeof THEMES)[ThemeId][]).map((theme) => (
              <TouchableOpacity
                key={theme.id}
                onPress={() => handleTheme(theme.id)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor:
                      settings.theme === theme.id
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderWidth: settings.theme === theme.id ? 2.5 : 1.5,
                  },
                ]}
              >
                <View
                  style={[
                    styles.themePreview,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.themeDot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeBar,
                      { backgroundColor: theme.colors.primary + "60" },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeBarShort,
                      { backgroundColor: theme.colors.primary + "30" },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color:
                        settings.theme === theme.id
                          ? theme.colors.primary
                          : colors.foreground,
                      fontWeight: settings.theme === theme.id ? "700" : "500",
                    },
                  ]}
                >
                  {theme.nameRu}
                </Text>
                {settings.theme === theme.id && (
                  <View
                    style={[
                      styles.themeCheck,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Feather name="check" size={10} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Mascot */}
        <SectionCard title="Маскот" iconName="smile" colors={colors}>
          <View style={styles.mascotRow}>
            {MASCOT_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m.type}
                onPress={() => handleMascot(m.type)}
                style={[
                  styles.mascotOption,
                  {
                    backgroundColor:
                      settings.mascot === m.type
                        ? colors.primary + "15"
                        : colors.secondary,
                    borderColor:
                      settings.mascot === m.type
                        ? colors.primary
                        : colors.border,
                    borderWidth: settings.mascot === m.type ? 2.5 : 1.5,
                  },
                ]}
              >
                <Mascot
                  type={m.type}
                  size={56}
                  animated={settings.mascot === m.type}
                />
                <Text
                  style={[
                    styles.mascotLabel,
                    {
                      color:
                        settings.mascot === m.type
                          ? colors.primary
                          : colors.subForeground,
                    },
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Avatar Color */}
        <SectionCard title="Цвет аватара" iconName="user" colors={colors}>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => handleAvatarColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  settings.avatarColor === c && styles.colorSwatchSelected,
                ]}
              >
                {settings.avatarColor === c && (
                  <Feather name="check" size={14} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Font Size */}
        <SectionCard title="Размер шрифта" iconName="type" colors={colors}>
          <View style={styles.fontRow}>
            {FONT_SIZES.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => handleFontSize(f.id)}
                style={[
                  styles.fontOption,
                  {
                    backgroundColor:
                      settings.fontSize === f.id
                        ? colors.primary + "15"
                        : colors.secondary,
                    borderColor:
                      settings.fontSize === f.id ? colors.primary : colors.border,
                    borderWidth: settings.fontSize === f.id ? 2 : 1.5,
                    flex: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    {
                      fontSize: f.size,
                      color:
                        settings.fontSize === f.id
                          ? colors.primary
                          : colors.foreground,
                      fontWeight: "600",
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  Aa
                </Text>
                <Text
                  style={[
                    styles.fontLabel,
                    {
                      color:
                        settings.fontSize === f.id
                          ? colors.primary
                          : colors.subForeground,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Info */}
        <SectionCard title="Информация" iconName="info" colors={colors}>
          <View style={styles.infoRows}>
            <InfoRow label="Имя" value={userStats.name} colors={colors} />
            <InfoRow label="Уровень" value={`${Math.floor(userStats.xp / 100) + 1}`} colors={colors} />
            <InfoRow label="XP всего" value={`${userStats.xp}`} colors={colors} />
            <InfoRow label="Стрик" value={`${userStats.streak} дн.`} colors={colors} />
          </View>
        </SectionCard>

        {/* Danger zone */}
        <TouchableOpacity
          onPress={handleReset}
          style={[
            styles.dangerButton,
            { borderColor: colors.red + "50", backgroundColor: colors.red + "10" },
          ]}
        >
          <Feather name="trash-2" size={16} color={colors.red} />
          <Text style={[styles.dangerText, { color: colors.red }]}>
            Сбросить прогресс
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionCard({
  title,
  iconName,
  children,
  colors,
}: {
  title: string;
  iconName: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
  colors: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionTitleRow}>
        <Feather name={iconName} size={15} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.subForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  content: { paddingHorizontal: 20, gap: 14 },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  themeCard: {
    width: "47%",
    borderRadius: 14,
    padding: 10,
    gap: 8,
    position: "relative",
    overflow: "hidden",
  },
  themePreview: {
    height: 52,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  themeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeBar: {
    height: 6,
    borderRadius: 3,
    width: "80%",
  },
  themeBarShort: {
    height: 6,
    borderRadius: 3,
    width: "50%",
  },
  themeLabel: {
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
  },
  themeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotRow: {
    flexDirection: "row",
    gap: 10,
  },
  mascotOption: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 6,
  },
  mascotLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    transform: [{ scale: 1.15 }],
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fontRow: {
    flexDirection: "row",
    gap: 10,
  },
  fontOption: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    gap: 4,
  },
  fontLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  infoRows: { gap: 0 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  dangerText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
