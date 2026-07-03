import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  RadialGradient,
  Circle,
} from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const { width: SW } = Dimensions.get("window");

// Flame path (outer)
const FLAME_OUTER =
  "M 50 96 C 22 88 6 66 18 46 C 24 60 28 54 26 42 C 24 26 33 10 50 4 C 67 10 76 26 74 42 C 72 54 76 60 82 46 C 94 66 78 88 50 96 Z";

// Inner hot core
const FLAME_INNER =
  "M 50 80 C 33 74 26 60 33 50 C 37 58 39 54 38 46 C 37 34 44 22 50 16 C 56 22 63 34 62 46 C 61 54 63 58 67 50 C 74 60 67 74 50 80 Z";

const SPARK_COUNT = 10;
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => ({
  id: i,
  x: 40 + ((i * 17) % 22),
  delay: i * 80,
  duration: 900 + ((i * 113) % 500),
  xDrift: ((i % 2 === 0 ? 1 : -1) * (10 + ((i * 23) % 30))),
  size: 5 + ((i * 7) % 7),
  color: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f97316" : "#fde68a",
}));

function Spark({ x, delay, duration, xDrift, size, color }: typeof SPARKS[0]) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay + 700,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [0, -90]);
    const tx = interpolate(progress.value, [0, 1], [0, xDrift]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [1, 0.8, 0]);
    const scale = interpolate(progress.value, [0, 0.2, 1], [0, 1, 0.4]);
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity,
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 20,
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

interface StreakFireOverlayProps {
  streak: number;
  onContinue: () => void;
}

export default function StreakFireOverlay({
  streak,
  onContinue,
}: StreakFireOverlayProps) {
  const [displayStreak, setDisplayStreak] = useState(0);
  const [btnReady, setBtnReady] = useState(false);

  // Layers
  const overlayOp = useSharedValue(0);
  const grayFlameScale = useSharedValue(0);
  const grayFlameOp = useSharedValue(0);
  const orangeFlameScale = useSharedValue(0);
  const orangeFlameOp = useSharedValue(0);
  const numberScale = useSharedValue(0);
  const textOp = useSharedValue(0);
  const btnScale = useSharedValue(0);
  const flameGlow = useSharedValue(1);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // 1. Overlay fades in
    overlayOp.value = withTiming(1, { duration: 320 });

    // 2. Gray flame springs in
    grayFlameScale.value = withDelay(
      200,
      withSpring(1, { damping: 11, stiffness: 160 })
    );
    grayFlameOp.value = withDelay(200, withTiming(1, { duration: 300 }));

    // 3. Gray flame fades out, orange flames in
    grayFlameOp.value = withDelay(
      900,
      withTiming(0, { duration: 500 })
    );
    orangeFlameScale.value = withDelay(
      800,
      withSpring(1, { damping: 9, stiffness: 140 })
    );
    orangeFlameOp.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Glow pulse after fire appears
    flameGlow.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      )
    );

    // 4. Streak number counts up
    numberScale.value = withDelay(
      1200,
      withSpring(1, { damping: 8, stiffness: 180 })
    );
    const DURATION = 800;
    setTimeout(() => {
      let start: number | null = null;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / DURATION, 1);
        setDisplayStreak(Math.round(p * streak));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 1200);

    // 5. Text + button appear
    textOp.value = withDelay(1600, withTiming(1, { duration: 400 }));
    btnScale.value = withDelay(
      2000,
      withSpring(1, { damping: 10, stiffness: 180 })
    );
    setTimeout(() => setBtnReady(true), 2100);
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOp.value }));
  const grayStyle = useAnimatedStyle(() => ({
    transform: [{ scale: grayFlameScale.value }],
    opacity: grayFlameOp.value,
  }));
  const orangeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orangeFlameScale.value * flameGlow.value }],
    opacity: orangeFlameOp.value,
  }));
  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOp.value }));
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      {/* Fire graphic */}
      <View style={styles.fireContainer}>
        {/* Gray flame */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.flameCentered, grayStyle]}>
          <Svg viewBox="0 0 100 100" width={120} height={140}>
            <Path d={FLAME_OUTER} fill="#4b5563" />
            <Path d={FLAME_INNER} fill="#374151" />
          </Svg>
        </Animated.View>

        {/* Orange flame */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.flameCentered, orangeStyle]}>
          <Svg viewBox="0 0 100 100" width={120} height={140}>
            <Defs>
              <SvgGrad id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#fde68a" />
                <Stop offset="0.35" stopColor="#f97316" />
                <Stop offset="1" stopColor="#ef4444" />
              </SvgGrad>
              <SvgGrad id="coreGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
                <Stop offset="0.4" stopColor="#fef08a" />
                <Stop offset="1" stopColor="#fb923c" />
              </SvgGrad>
            </Defs>
            <Path d={FLAME_OUTER} fill="url(#fireGrad)" />
            <Path d={FLAME_INNER} fill="url(#coreGrad)" />
          </Svg>
        </Animated.View>

        {/* Sparks */}
        {SPARKS.map((s) => (
          <Spark key={s.id} {...s} />
        ))}
      </View>

      {/* Streak number */}
      <Animated.View style={numberStyle}>
        <Text style={styles.streakNumber}>{displayStreak}</Text>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.streakLabel}>дней подряд! 🔥</Text>
        <Text style={styles.streakSub}>Стрик обновлён. Продолжай в том же духе!</Text>
      </Animated.View>

      {/* Continue button */}
      <Animated.View style={[styles.btnWrap, btnStyle]}>
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.85}
          disabled={!btnReady}
          style={{ opacity: btnReady ? 1 : 0.5 }}
        >
          <LinearGradient
            colors={["#f97316", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>Продолжить</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(5,5,15,0.96)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 1000,
  },
  fireContainer: {
    width: 140,
    height: 160,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    marginBottom: 8,
  },
  flameCentered: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  streakNumber: {
    fontSize: 80,
    fontWeight: "900",
    color: "white",
    fontFamily: "Inter_700Bold",
    lineHeight: 88,
    letterSpacing: -2,
  },
  textBlock: { alignItems: "center", gap: 6 },
  streakLabel: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fbbf24",
    fontFamily: "Inter_700Bold",
  },
  streakSub: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  btnWrap: { marginTop: 24, width: SW * 0.78, maxWidth: 320 },
  continueBtn: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
