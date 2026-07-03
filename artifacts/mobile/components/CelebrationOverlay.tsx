import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Mascot from "@/components/Mascot";
import type { MascotType } from "@/contexts/AppContext";

const { width: SW, height: SH } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#F97316",
  "#06B6D4", "#A3E635", "#FBBF24", "#C084FC",
];
const CONFETTI_COUNT = 44;
const PARTICLES = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  id: i,
  x: (i / CONFETTI_COUNT) * SW + Math.sin(i * 2.3) * 28,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  w: 6 + ((i * 7) % 11),
  h: 4 + ((i * 5) % 9),
  delay: (i % 12) * 70,
  duration: 1700 + ((i * 137) % 1300),
  rotDeg: 180 + ((i * 113) % 360),
  xDrift: (i % 2 === 0 ? 1 : -1) * (22 + ((i * 31) % 85)),
  isCircle: i % 6 === 0,
}));

function ConfettiParticle({ x, color, w, h, delay, duration, rotDeg, xDrift, isCircle }: typeof PARTICLES[0]) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(p.value, [0, 1], [0, xDrift]) },
      { translateY: interpolate(p.value, [0, 1], [-80, SH + 80]) },
      { rotate: `${interpolate(p.value, [0, 1], [0, rotDeg])}deg` },
      { scale: interpolate(p.value, [0, 0.1, 1], [0, 1, 0.75]) },
    ],
    opacity: interpolate(p.value, [0, 0.65, 1], [1, 1, 0]),
  }));
  return (
    <Animated.View
      style={[{
        position: "absolute", left: x, top: 0,
        width: isCircle ? w : w, height: isCircle ? w : h,
        borderRadius: isCircle ? w / 2 : 2,
        backgroundColor: color,
      }, style]}
    />
  );
}

function StarRay({ angle, delay }: { angle: number; delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.3)) }),
      withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })
    ));
  }, []);
  const rad = (angle * Math.PI) / 180;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(rad) * interpolate(p.value, [0, 1], [18, 95]) },
      { translateY: Math.sin(rad) * interpolate(p.value, [0, 1], [18, 95]) },
    ],
    opacity: interpolate(p.value, [0, 0.3, 1], [0, 1, 0]),
  }));
  return (
    <Animated.View style={[styles.starRay, style]}>
      <Feather name="star" size={13} color="#FBBF24" />
    </Animated.View>
  );
}

function AnimatedStar({ index, lit }: { index: number; lit: boolean }) {
  const scale = useSharedValue(0);
  const op = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(380 + index * 110, withSpring(lit ? 1 : 0.55, { damping: 8, stiffness: 200 }));
    op.value = withDelay(380 + index * 110, withTiming(1, { duration: 280 }));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: op.value,
  }));
  return (
    <Animated.View style={style}>
      <Feather name="star" size={34} color={lit ? "#FBBF24" : "#374151"} />
    </Animated.View>
  );
}

interface Props {
  passed: boolean;
  isTheory: boolean;
  xpEarned: number;
  correct: number;
  total: number;
  alreadyDone: boolean;
  mascot: MascotType;
  onContinue: () => void;
}

export default function CelebrationOverlay({
  passed, isTheory, xpEarned, correct, total, alreadyDone, mascot, onContinue,
}: Props) {
  const [displayXp, setDisplayXp] = useState(0);
  const [btnReady, setBtnReady] = useState(false);

  const overlayOp = useSharedValue(0);
  const cardScale = useSharedValue(0.45);
  const cardOp = useSharedValue(0);
  const mascotScale = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const xpPillScale = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
    }

    overlayOp.value = withTiming(1, { duration: 220 });
    cardScale.value = withDelay(80, withSpring(1, { damping: 13, stiffness: 175 }));
    cardOp.value = withDelay(80, withTiming(1, { duration: 220 }));
    mascotScale.value = withDelay(180, withSpring(1, { damping: 9, stiffness: 190 }));
    titleScale.value = withDelay(320, withSpring(1, { damping: 12, stiffness: 220 }));

    if (xpEarned > 0) {
      xpPillScale.value = withDelay(480, withSpring(1, { damping: 9, stiffness: 200 }));
      const DURATION = 1100;
      setTimeout(() => {
        let start: number | null = null;
        const tick = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / DURATION, 1);
          setDisplayXp(Math.round(p * xpEarned));
          if (p < 1) requestAnimationFrame(tick);
          else setBtnReady(true);
        };
        requestAnimationFrame(tick);
      }, 550);
    } else {
      xpPillScale.value = withDelay(480, withSpring(1, { damping: 10, stiffness: 200 }));
      setTimeout(() => setBtnReady(true), 750);
    }
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOp.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOp.value,
  }));
  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));
  const xpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpPillScale.value }],
  }));

  const title = isTheory ? "Материал изучен!" : passed ? "Пройдено! 🎉" : "Попробуй ещё раз";
  const subtitle = isTheory
    ? "Теория усвоена. Молодец!"
    : passed
    ? total > 0 ? `${correct} из ${total} правильно` : "Отличная работа!"
    : `${correct} из ${total} — нужно 80% для прохождения`;

  const accuracy = total > 0 ? correct / total : 1;
  const stars = isTheory ? 3 : accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : 1;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      {passed && (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" } as any]}>
          {PARTICLES.map((p) => <ConfettiParticle key={p.id} {...p} />)}
        </View>
      )}

      <Animated.View style={[styles.card, cardStyle]}>
        {/* Mascot — dances on pass, fails on fail */}
        <View style={styles.mascotWrap}>
          <Animated.View style={mascotStyle}>
            <Mascot
              type={mascot}
              size={118}
              mode={passed ? "dance" : "fail"}
            />
          </Animated.View>
          {passed && (
            <View style={[styles.starsRing, { pointerEvents: "none" } as any]}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <StarRay key={angle} angle={angle} delay={280 + i * 45} />
              ))}
            </View>
          )}
        </View>

        <Animated.View style={titleStyle}>
          <Text style={[styles.title, { color: passed ? "#A78BFA" : "#FBBF24" }]}>
            {title}
          </Text>
        </Animated.View>

        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Stars row (only on pass or theory) */}
        {(passed || isTheory) && (
          <View style={styles.starsRow}>
            {[1, 2, 3].map((s) => (
              <AnimatedStar key={s} index={s} lit={s <= stars} />
            ))}
          </View>
        )}

        {/* XP pill */}
        {!alreadyDone && xpEarned > 0 && (
          <Animated.View style={xpStyle}>
            <LinearGradient
              colors={passed ? ["#6366F1", "#8B5CF6"] : ["#F59E0B", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.xpPill}
            >
              <Feather name="zap" size={18} color="white" />
              <Text style={styles.xpText}>+{displayXp} XP</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {alreadyDone && (
          <View style={styles.alreadyBadge}>
            <Feather name="check-circle" size={14} color="#6366F1" />
            <Text style={styles.alreadyText}>Уже пройдено</Text>
          </View>
        )}

        {/* Hint for fail */}
        {!passed && !isTheory && (
          <View style={styles.retryHint}>
            <Feather name="info" size={14} color="#64748b" />
            <Text style={styles.retryHintText}>
              Нужно {Math.ceil(total * 0.8)} правильных ответов из {total}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueBtn, !btnReady && { opacity: 0.55 }]}
          onPress={onContinue}
          disabled={!btnReady}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={passed ? ["#6366F1", "#8B5CF6"] : ["#F59E0B", "#EF4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnInner}
          >
            <Text style={styles.continueBtnText}>
              {passed ? "Продолжить" : "Попробовать снова"}
            </Text>
            <Feather name={passed ? "arrow-right" : "refresh-cw"} size={18} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(5,5,15,0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  card: {
    width: SW * 0.88,
    maxWidth: 380,
    backgroundColor: "#13132A",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#1E1E40",
    elevation: 16,
  },
  mascotWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    height: 130,
  },
  starsRing: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    height: 130,
  },
  starRay: { position: "absolute" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  starsRow: { flexDirection: "row", gap: 12, marginVertical: 2 },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 50,
  },
  xpText: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  alreadyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#6366F115",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6366F130",
  },
  alreadyText: { fontSize: 13, color: "#6366F1", fontFamily: "Inter_500Medium" },
  retryHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1e293b",
    borderRadius: 12,
  },
  retryHintText: { fontSize: 12, color: "#64748b" },
  continueBtn: { width: "100%", marginTop: 4 },
  continueBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  continueBtnText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
