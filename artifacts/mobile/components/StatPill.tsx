import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";

interface StatPillProps {
  iconName: keyof typeof Feather.glyphMap;
  value: string;
  color: string;
}

export default function StatPill({ iconName, value, color }: StatPillProps) {
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: color + "20",
          borderColor: color + "30",
        },
      ]}
    >
      <Feather name={iconName} size={14} color={color} />
      <Text style={[styles.text, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
