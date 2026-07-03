import React, { useEffect } from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { LessonNode, NodeType } from "@/data/curriculum";
import { useAppColors } from "@/hooks/useAppColors";

type NodeStatus = "locked" | "active" | "done";

interface LessonNodeButtonProps {
  node: LessonNode;
  status: NodeStatus;
  onPress: () => void;
  chapterColor: string;
}

const NODE_SIZE = 78;

const TYPE_ICON: Record<NodeType, keyof typeof Feather.glyphMap> = {
  theory: "book-open",
  miniQuiz: "edit-3",
  practice: "cpu",
  boss: "zap",
};

const TYPE_LABEL: Record<NodeType, string> = {
  theory: "Теория",
  miniQuiz: "Квиз",
  practice: "Практика",
  boss: "Босс",
};

const TYPE_COLOR: Record<NodeType, string> = {
  theory: "#6366f1",
  miniQuiz: "#8b5cf6",
  practice: "#06b6d4",
  boss: "#ef4444",
};

export default function LessonNodeButton({
  node,
  status,
  onPress,
  chapterColor,
}: LessonNodeButtonProps) {
  const colors = useAppColors();
  const pulse = useSharedValue(1);
  const press = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (status === "active") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 1200, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) })
        ),
        -1
      );
    }
  }, [status]);

  const nodeAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * press.value }],
  }));

  const rippleAnim = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const handlePress = async () => {
    if (status === "locked") return;
    press.value = withSpring(0.9, { damping: 5, stiffness: 500 }, () => {
      press.value = withSpring(1, { damping: 10, stiffness: 200 });
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isDone = status === "done";
  const isActive = status === "active";
  const isLocked = status === "locked";

  const nodeColor = isDone
    ? chapterColor
    : isActive
    ? chapterColor + "18"
    : colors.track;

  const borderColor = isDone
    ? "transparent"
    : isActive
    ? chapterColor
    : colors.border;

  const iconColor = isDone
    ? "white"
    : isActive
    ? chapterColor
    : colors.mutedForeground;

  const iconName: keyof typeof Feather.glyphMap = isDone
    ? "check"
    : isLocked
    ? "lock"
    : TYPE_ICON[node.type] ?? "circle";

  return (
    <View style={styles.wrapper}>
      {/* Ripple ring for active */}
      {isActive && (
        <Animated.View
          style={[
            styles.ripple,
            { borderColor: chapterColor },
            rippleAnim,
          ]}
        />
      )}

      <Animated.View style={nodeAnim}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={isLocked ? 1 : 0.8}
          disabled={isLocked}
          style={[
            styles.node,
            {
              backgroundColor: nodeColor,
              borderColor,
              borderWidth: isActive ? 2.5 : 1.5,
              opacity: isLocked ? 0.35 : 1,
            },
          ]}
        >
          {/* Boss node gets special inner glow */}
          {node.type === "boss" && !isLocked && (
            <View
              style={[
                styles.bossGlow,
                {
                  backgroundColor: isDone
                    ? "rgba(255,255,255,0.15)"
                    : "#ef444420",
                },
              ]}
            />
          )}

          <Feather
            name={iconName}
            size={node.type === "boss" && !isLocked && !isDone ? 30 : 26}
            color={
              node.type === "boss" && isActive ? "#ef4444" : iconColor
            }
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            color: isLocked
              ? colors.mutedForeground
              : isDone
              ? colors.foreground
              : colors.foreground,
            opacity: isLocked ? 0.5 : 1,
          },
        ]}
        numberOfLines={1}
      >
        {node.label}
      </Text>

      {/* Type + XP badge row */}
      <View style={styles.badgeRow}>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isLocked
                ? colors.track
                : (TYPE_COLOR[node.type] ?? chapterColor) + "22",
              borderColor: isLocked
                ? colors.border
                : (TYPE_COLOR[node.type] ?? chapterColor) + "40",
            },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              {
                color: isLocked
                  ? colors.mutedForeground
                  : TYPE_COLOR[node.type] ?? chapterColor,
              },
            ]}
          >
            {TYPE_LABEL[node.type]}
          </Text>
        </View>

        {!isLocked && (
          <View
            style={[
              styles.xpBadge,
              {
                backgroundColor: isDone
                  ? colors.green + "20"
                  : colors.amber + "18",
              },
            ]}
          >
            <Feather
              name="zap"
              size={9}
              color={isDone ? colors.green : colors.amber}
            />
            <Text
              style={[
                styles.xpText,
                { color: isDone ? colors.green : colors.amber },
              ]}
            >
              {node.xpReward}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 5,
    position: "relative",
  },
  ripple: {
    position: "absolute",
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2.5,
    zIndex: -1,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bossGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: NODE_SIZE / 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: NODE_SIZE + 24,
    fontFamily: "Inter_600SemiBold",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },
  xpText: {
    fontSize: 9,
    fontWeight: "700",
  },
});
