import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import { useAppColors } from "@/hooks/useAppColors";
import Mascot from "@/components/Mascot";
import GradientButton from "@/components/GradientButton";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import StreakFireOverlay from "@/components/StreakFireOverlay";
import VideoPlayer from "@/components/VideoPlayer";
import { findNode } from "@/data/curriculum";
import type { LessonResult } from "@/contexts/AppContext";

type Screen = "intro" | "question" | "result";

export default function LessonScreen() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, userStats, completeNode, nodeStatus, fontScale } = useApp();

  const node = findNode(nodeId);

  const [screen, setScreen] = useState<Screen>("intro");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [showStreak, setShowStreak] = useState(false);

  const shakeAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  const pt = insets.top + (Platform.OS === "web" ? 67 : 0);
  const pb = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const questions = node?.questions || [];
  const isTheory = node?.type === "theory";
  const currentQ = questions[questionIdx];
  const totalQ = questions.length;

  useEffect(() => {
    if (totalQ > 0) {
      progressAnim.value = withTiming((questionIdx + 1) / totalQ, {
        duration: 400,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [questionIdx, totalQ]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  const shake = () => {
    shakeAnim.value = withSequence(
      withTiming(10, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  };

  const resetQuiz = () => {
    setScreen("question");
    setQuestionIdx(0);
    setSelected(null);
    setConfirmed(false);
    setCorrectCount(0);
    setResult(null);
    progressAnim.value = withTiming(1 / Math.max(totalQ, 1), {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  };

  const handleCheck = async () => {
    if (!selected) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirmed(true);
    if (selected === currentQ.correct) {
      setCorrectCount((c) => c + 1);
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      shake();
    }
  };

  const handleNext = async () => {
    if (questionIdx < totalQ - 1) {
      setQuestionIdx((i) => i + 1);
      setSelected(null);
      setConfirmed(false);
    } else {
      const finalCorrect =
        correctCount + (selected === currentQ?.correct ? 1 : 0);
      const res = await completeNode(nodeId, finalCorrect, totalQ);
      setResult(res);
      setScreen("result");
    }
  };

  const handleFinishTheory = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const res = await completeNode(nodeId, 0, 0);
    setResult(res);
    setScreen("result");
  };

  const handleStartQuiz = () => {
    setScreen("question");
    progressAnim.value = withTiming(1 / Math.max(totalQ, 1), {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
  };

  /** Called when the user taps Continue/Retry on the CelebrationOverlay */
  const handleCelebrationContinue = () => {
    if (!result) return;

    if (!result.passed) {
      // Not passed → restart the quiz immediately
      resetQuiz();
    } else if (result.isStreakDay && !result.alreadyDone) {
      // First successful lesson today → show streak fire screen
      setShowStreak(true);
    } else {
      router.back();
    }
  };

  if (!node) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Урок не найден
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navbar */}
      <View style={[styles.navbar, { paddingTop: pt + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.subForeground} />
        </TouchableOpacity>
        {!isTheory && screen === "question" && (
          <View style={[styles.progressBar, { backgroundColor: colors.track }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary },
                progressStyle,
              ]}
            />
          </View>
        )}
        <Text style={[styles.nodeLabel, { color: colors.subForeground }]}>
          {node.label}
        </Text>
      </View>

      {screen === "intro" && isTheory && (
        <TheoryContent
          node={node}
          colors={colors}
          pb={pb}
          fontScale={fontScale}
          onFinish={handleFinishTheory}
        />
      )}

      {screen === "intro" && !isTheory && (
        <QuizIntro
          node={node}
          colors={colors}
          settings={settings}
          pb={pb}
          fontScale={fontScale}
          onStart={handleStartQuiz}
        />
      )}

      {screen === "question" && currentQ && (
        <Animated.View style={[styles.flex, shakeStyle]}>
          <ScrollView
            contentContainerStyle={[
              styles.questionContent,
              { paddingBottom: pb + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.questionCounter, { color: colors.subForeground, fontSize: 13 * fontScale }]}
            >
              Вопрос {questionIdx + 1} из {totalQ}
            </Text>
            <Text style={[styles.questionText, { color: colors.foreground, fontSize: 20 * fontScale, lineHeight: 28 * fontScale }]}>
              {currentQ.text}
            </Text>

            <View style={styles.optionsContainer}>
              {currentQ.options.map((opt, oi) => {
                const isSelected = selected === opt;
                const isCorrect = opt === currentQ.correct;
                let borderColor = colors.border;
                let bg = colors.card;
                let textColor = colors.foreground;

                if (confirmed) {
                  if (isCorrect) {
                    borderColor = colors.green;
                    bg = colors.green + "15";
                    textColor = colors.green;
                  } else if (isSelected) {
                    borderColor = colors.red;
                    bg = colors.red + "15";
                    textColor = colors.red;
                  }
                } else if (isSelected) {
                  borderColor = colors.primary;
                  bg = colors.primary + "15";
                  textColor = colors.primary;
                }

                return (
                  <OptionButton
                    key={opt}
                    opt={opt}
                    index={oi}
                    bg={bg}
                    borderColor={borderColor}
                    textColor={textColor}
                    confirmed={confirmed}
                    isCorrect={isCorrect}
                    isSelected={isSelected}
                    colors={colors}
                    fontScale={fontScale}
                    onPress={() => {
                      if (confirmed) return;
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelected(opt);
                    }}
                  />
                );
              })}
            </View>

            {confirmed && currentQ.explanation && (
              <ExplanationCard
                explanation={currentQ.explanation}
                isCorrect={selected === currentQ.correct}
                colors={colors}
                fontScale={fontScale}
              />
            )}
          </ScrollView>

          <View style={[styles.actionBar, { paddingBottom: pb + 16 }]}>
            {!confirmed ? (
              <GradientButton
                label="Проверить"
                iconName="check"
                onPress={handleCheck}
                disabled={!selected}
              />
            ) : (
              <GradientButton
                label={questionIdx < totalQ - 1 ? "Далее" : "Завершить"}
                iconName={questionIdx < totalQ - 1 ? "arrow-right" : "award"}
                onPress={handleNext}
                variant={selected === currentQ.correct ? "success" : "danger"}
              />
            )}
          </View>
        </Animated.View>
      )}

      {/* Celebration overlay (pass or fail screen) */}
      {screen === "result" && result && !showStreak && (
        <CelebrationOverlay
          passed={result.passed}
          isTheory={isTheory}
          xpEarned={result.xpEarned}
          correct={result.correct}
          total={result.total}
          alreadyDone={result.alreadyDone}
          mascot={settings.mascot}
          onContinue={handleCelebrationContinue}
        />
      )}

      {/* Streak fire overlay — shown once per day after first lesson */}
      {showStreak && (
        <StreakFireOverlay
          streak={userStats.streak}
          onContinue={() => router.back()}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function OptionButton({
  opt, index, bg, borderColor, textColor, confirmed, isCorrect, isSelected, colors, fontScale, onPress,
}: {
  opt: string; index: number; bg: string; borderColor: string; textColor: string;
  confirmed: boolean; isCorrect: boolean; isSelected: boolean;
  colors: ReturnType<typeof useAppColors>; fontScale: number; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 200 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={() => {
          if (!confirmed) {
            scale.value = withSequence(
              withTiming(0.96, { duration: 80 }),
              withSpring(1, { damping: 10, stiffness: 200 })
            );
          }
          onPress();
        }}
        style={[
          styles.option,
          {
            backgroundColor: bg,
            borderColor,
            borderWidth: isSelected || (confirmed && isCorrect) ? 2 : 1.5,
          },
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.optionText, { color: textColor, fontSize: 16 * fontScale }]}>{opt}</Text>
        {confirmed && isCorrect && (
          <Feather name="check-circle" size={18} color={colors.green} />
        )}
        {confirmed && isSelected && !isCorrect && (
          <Feather name="x-circle" size={18} color={colors.red} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function TheoryContent({
  node, colors, pb, fontScale, onFinish,
}: {
  node: ReturnType<typeof findNode>;
  colors: ReturnType<typeof useAppColors>;
  pb: number;
  fontScale: number;
  onFinish: () => void;
}) {
  if (!node) return null;
  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.theoryContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary + "88"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.theoryBanner, { borderRadius: 16 }]}
        >
          <Feather name="book-open" size={28} color="white" />
          <Text style={[styles.theoryBannerTitle, { fontSize: 20 * fontScale }]}>{node.theoryTitle}</Text>
        </LinearGradient>

        <VideoPlayer videoUrl={node.videoUrl} title={node.theoryTitle} />

        <Text style={[styles.theoryText, { color: colors.subForeground, fontSize: 16 * fontScale, lineHeight: 26 * fontScale }]}>
          {node.theoryContent}
        </Text>

        {node.theoryKeyPoints && node.theoryKeyPoints.length > 0 && (
          <View
            style={[
              styles.keyPoints,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.keyPointsTitle, { color: colors.foreground, fontSize: 14 * fontScale }]}
            >
              Ключевые формулы
            </Text>
            {node.theoryKeyPoints.map((kp, i) => (
              <View key={i} style={styles.keyPointRow}>
                <View
                  style={[
                    styles.keyPointDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.keyPointText,
                    { color: colors.subForeground, fontSize: 14 * fontScale, lineHeight: 20 * fontScale },
                  ]}
                >
                  {kp}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: pb + 16 }]}>
        <GradientButton label="Понятно!" iconName="check" onPress={onFinish} />
      </View>
    </>
  );
}

type MascotType = "penguin" | "raccoon" | "bear";

function QuizIntro({
  node, colors, settings, pb, fontScale, onStart,
}: {
  node: ReturnType<typeof findNode>;
  colors: ReturnType<typeof useAppColors>;
  settings: { mascot: MascotType };
  pb: number;
  fontScale: number;
  onStart: () => void;
}) {
  if (!node) return null;

  const mascotScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    mascotScale.value = withSpring(1, { damping: 10, stiffness: 160 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
  }, []);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const typeLabel =
    node.type === "boss"
      ? "Босс-битва!"
      : node.type === "practice"
      ? "Практика"
      : "Мини-квиз";
  const typeDesc =
    node.type === "boss"
      ? "Финальное испытание главы. Только 80% даёт прохождение!"
      : "Нужно правильно ответить на 80% вопросов";

  return (
    <View style={[styles.flex, styles.introContent]}>
      <Animated.View style={mascotStyle}>
        <Mascot type={settings.mascot} size={120} mode="idle" />
      </Animated.View>
      <Animated.View style={[styles.introTextWrap, contentStyle]}>
        <Text style={[styles.introType, { color: colors.primary, fontSize: 28 * fontScale }]}>
          {typeLabel}
        </Text>
        <Text style={[styles.introDesc, { color: colors.subForeground, fontSize: 16 * fontScale, lineHeight: 24 * fontScale }]}>
          {typeDesc}
        </Text>
        <View
          style={[
            styles.introStats,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.introStat}>
            <Feather name="help-circle" size={18} color={colors.primary} />
            <Text
              style={[styles.introStatValue, { color: colors.foreground }]}
            >
              {(node.questions || []).length}
            </Text>
            <Text
              style={[styles.introStatLabel, { color: colors.subForeground }]}
            >
              вопросов
            </Text>
          </View>
          <View
            style={[
              styles.introStatDivider,
              { backgroundColor: colors.border },
            ]}
          />
          <View style={styles.introStat}>
            <Feather name="zap" size={18} color={colors.amber} />
            <Text
              style={[styles.introStatValue, { color: colors.foreground }]}
            >
              {node.xpReward}
            </Text>
            <Text
              style={[styles.introStatLabel, { color: colors.subForeground }]}
            >
              XP
            </Text>
          </View>
          <View
            style={[
              styles.introStatDivider,
              { backgroundColor: colors.border },
            ]}
          />
          <View style={styles.introStat}>
            <Feather name="target" size={18} color={colors.green} />
            <Text
              style={[styles.introStatValue, { color: colors.foreground }]}
            >
              80%
            </Text>
            <Text
              style={[styles.introStatLabel, { color: colors.subForeground }]}
            >
              для прохода
            </Text>
          </View>
        </View>
        <View
          style={[styles.actionBar, { paddingBottom: pb + 16, width: "100%" }]}
        >
          <GradientButton
            label="Начать"
            iconName="play"
            onPress={onStart}
            variant={node.type === "boss" ? "danger" : "primary"}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function ExplanationCard({
  explanation, isCorrect, colors, fontScale,
}: {
  explanation: string;
  isCorrect: boolean;
  colors: ReturnType<typeof useAppColors>;
  fontScale: number;
}) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <View
        style={[
          styles.explanation,
          {
            backgroundColor: isCorrect
              ? colors.green + "15"
              : colors.red + "15",
            borderColor: isCorrect ? colors.green : colors.red,
          },
        ]}
      >
        <Feather
          name={isCorrect ? "check-circle" : "info"}
          size={15}
          color={isCorrect ? colors.green : colors.red}
        />
        <Text
          style={[
            styles.explanationText,
            { color: isCorrect ? colors.green : colors.red, fontSize: 14 * fontScale, lineHeight: 20 * fontScale },
          ]}
        >
          {explanation}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  nodeLabel: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 16, textAlign: "center", marginTop: 100 },
  theoryContent: { paddingHorizontal: 20, gap: 16, paddingTop: 8 },
  theoryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
  },
  theoryBannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
    fontFamily: "Inter_700Bold",
  },
  theoryText: { fontSize: 16, lineHeight: 26, fontFamily: "Inter_400Regular" },
  keyPoints: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  keyPointsTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  keyPointRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  keyPointDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  keyPointText: { flex: 1, fontSize: 14, lineHeight: 20 },
  questionContent: { paddingHorizontal: 20, gap: 16, paddingTop: 8 },
  questionCounter: { fontSize: 13 },
  questionText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    fontFamily: "Inter_700Bold",
  },
  optionsContainer: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  explanation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  explanationText: { flex: 1, fontSize: 14, lineHeight: 20 },
  actionBar: { paddingHorizontal: 20, paddingTop: 12 },
  introContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
    paddingTop: 24,
  },
  introTextWrap: { width: "100%", alignItems: "center", gap: 12 },
  introType: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  introDesc: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  introStats: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: "100%",
    justifyContent: "space-around",
    marginTop: 4,
  },
  introStat: { alignItems: "center", gap: 4 },
  introStatValue: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  introStatLabel: { fontSize: 12 },
  introStatDivider: { width: 1, alignSelf: "stretch" },
});
