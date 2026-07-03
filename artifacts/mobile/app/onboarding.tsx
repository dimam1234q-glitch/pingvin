import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Mascot, { MascotType } from "@/components/Mascot";
import GradientButton from "@/components/GradientButton";
import { useApp } from "@/contexts/AppContext";
import THEMES from "@/constants/themes";

const { width } = Dimensions.get("window");

const MASCOTS: { type: MascotType; name: string; desc: string }[] = [
  { type: "penguin", name: "Пингвин", desc: "Классика жанра" },
  { type: "raccoon", name: "Енот", desc: "Хитрый и умный" },
  { type: "bear", name: "Медведь", desc: "Сильный и надёжный" },
];

const PAGES = [
  {
    title: "Готовься к ОГЭ\nкаждый день",
    subtitle:
      "Интерактивный курс по математике — теория, квизы и босс-битвы в стиле игры",
    iconName: "book-open" as const,
  },
  {
    title: "Зарабатывай XP\nи держи стрик",
    subtitle:
      "Открывай новые главы, поднимайся в лигах и получай достижения за прогресс",
    iconName: "zap" as const,
  },
  {
    title: "Выбери своего\nмаскота",
    subtitle: "Он будет сопровождать тебя на пути к пятёрке",
    iconName: "heart" as const,
  },
];

const COLORS = THEMES.space.colors;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const [page, setPage] = useState(0);
  const [selectedMascot, setSelectedMascot] = useState<MascotType>("penguin");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const isLastPage = page === PAGES.length - 1;

  const goNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isLastPage) {
      const next = page + 1;
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      if (!name.trim()) {
        setNameError(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await finish();
    }
  };

  const finish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    await completeOnboarding(name.trim(), selectedMascot);
    router.replace("/(tabs)");
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {PAGES.map((p, idx) => (
          <View key={idx} style={[styles.page, { width }]}>
            {idx === 2 ? (
              <MascotPickerPage
                selectedMascot={selectedMascot}
                onSelect={setSelectedMascot}
                name={name}
                onNameChange={(v) => {
                  setName(v);
                  if (v.trim()) setNameError(false);
                }}
                nameError={nameError}
                title={p.title}
                subtitle={p.subtitle}
              />
            ) : (
              <IllustrationPage page={p} idx={idx} selectedMascot={selectedMascot} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === page ? COLORS.primary : COLORS.border,
                width: i === page ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        {isLastPage && !name.trim() && nameError && (
          <Animated.View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorBannerText}>Введи своё имя, чтобы продолжить</Text>
          </Animated.View>
        )}
        <GradientButton
          label={isLastPage ? "Начать учиться" : "Далее"}
          iconName={isLastPage ? "arrow-right" : "chevron-right"}
          onPress={goNext}
          loading={isFinishing}
        />
      </View>
    </View>
  );
}

function IllustrationPage({
  page,
  idx,
  selectedMascot,
}: {
  page: (typeof PAGES)[0];
  idx: number;
  selectedMascot: MascotType;
}) {
  return (
    <View style={styles.pageInner}>
      <View style={styles.mascotWrap}>
        <Mascot type={selectedMascot} size={160} animated />
      </View>
      <View style={styles.badge}>
        <Feather name={page.iconName} size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{page.title}</Text>
      <Text style={styles.subtitle}>{page.subtitle}</Text>
    </View>
  );
}

function MascotPickerPage({
  selectedMascot,
  onSelect,
  name,
  onNameChange,
  nameError,
  title,
  subtitle,
}: {
  selectedMascot: MascotType;
  onSelect: (m: MascotType) => void;
  name: string;
  onNameChange: (v: string) => void;
  nameError: boolean;
  title: string;
  subtitle: string;
}) {
  const shakeX = useSharedValue(0);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(8, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  React.useEffect(() => {
    if (nameError) shake();
  }, [nameError]);

  return (
    <View style={styles.pageInner}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.mascotRow}>
        {MASCOTS.map((m) => (
          <TouchableOpacity
            key={m.type}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(m.type);
            }}
            style={[
              styles.mascotCard,
              {
                borderColor:
                  selectedMascot === m.type ? COLORS.primary : COLORS.border,
                backgroundColor:
                  selectedMascot === m.type
                    ? COLORS.primary + "15"
                    : COLORS.card,
              },
            ]}
          >
            <Mascot type={m.type} size={64} animated={selectedMascot === m.type} />
            <Text style={styles.mascotName}>{m.name}</Text>
            <Text style={styles.mascotDesc}>{m.desc}</Text>
            {selectedMascot === m.type && (
              <View style={styles.selectedBadge}>
                <Feather name="check" size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.nameWrap}>
        <View style={styles.nameLabelRow}>
          <Text style={styles.nameLabel}>Как тебя зовут?</Text>
          {nameError && (
            <Text style={styles.nameLabelError}>Обязательное поле</Text>
          )}
        </View>
        <Animated.View style={animatedInputStyle}>
          <TextInput
            value={name}
            onChangeText={onNameChange}
            placeholder="Введи имя..."
            placeholderTextColor={COLORS.mutedForeground}
            style={[
              styles.nameInput,
              nameError && !name.trim() && {
                borderColor: "#EF4444",
                backgroundColor: "#EF444410",
              },
            ]}
            maxLength={24}
            returnKeyType="done"
            autoCorrect={false}
          />
        </Animated.View>
        {name.trim().length > 0 && (
          <View style={styles.namePreview}>
            <Feather name="check-circle" size={13} color="#10B981" />
            <Text style={styles.namePreviewText}>Привет, {name.trim()}!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  page: {
    flex: 1,
  },
  pageInner: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  mascotWrap: {
    marginBottom: 16,
    marginTop: 24,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.foreground,
    textAlign: "center",
    lineHeight: 38,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subForeground,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 10,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444430",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  mascotRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    marginBottom: 24,
  },
  mascotCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    gap: 4,
    position: "relative",
  },
  mascotName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.foreground,
    fontFamily: "Inter_700Bold",
  },
  mascotDesc: {
    fontSize: 11,
    color: COLORS.subForeground,
    textAlign: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nameWrap: {
    width: "100%",
    gap: 8,
  },
  nameLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.subForeground,
    fontFamily: "Inter_600SemiBold",
  },
  nameLabelError: {
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Inter_500Medium",
  },
  nameInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: "Inter_400Regular",
  },
  namePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  namePreviewText: {
    fontSize: 13,
    color: "#10B981",
    fontFamily: "Inter_500Medium",
  },
});
