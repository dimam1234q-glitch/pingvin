import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppColors } from "@/hooks/useAppColors";

interface GradientButtonProps {
  label: string;
  iconName?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "success" | "danger";
  size?: "small" | "medium" | "large";
}

export default function GradientButton({
  label,
  iconName,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "large",
}: GradientButtonProps) {
  const colors = useAppColors();

  const gradients: Record<string, [string, string]> = {
    primary: [colors.primary, colors.primary + "CC"],
    success: [colors.green, colors.green + "CC"],
    danger: [colors.red, colors.red + "CC"],
  };

  const heights = { small: 44, medium: 50, large: 56 };
  const fontSizes = { small: 14, medium: 15, large: 16 };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const gradient = gradients[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[styles.wrapper, { opacity: disabled ? 0.5 : 1 }]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { height: heights[size], borderRadius: colors.radius }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.inner}>
            {iconName && <Feather name={iconName} size={18} color="white" />}
            <Text style={[styles.label, { fontSize: fontSizes[size] }]}>
              {label}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "white",
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
