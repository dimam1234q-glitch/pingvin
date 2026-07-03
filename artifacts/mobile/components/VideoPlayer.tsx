import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
}

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const colors = useAppColors();

  if (!videoUrl) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.placeholderIcon, { backgroundColor: colors.primary + "20" }]}
        >
          <Feather name="video" size={30} color={colors.primary} />
        </View>
        <View style={styles.placeholderText}>
          <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>
            Видео-лекция
          </Text>
          <Text style={[styles.placeholderSub, { color: colors.subForeground }]}>
            Видео по этой теме появится после загрузки
          </Text>
        </View>
        <View
          style={[
            styles.uploadBadge,
            {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <Feather name="upload-cloud" size={12} color={colors.primary} />
          <Text style={[styles.uploadText, { color: colors.primary }]}>Скоро</Text>
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.webVideoContainer}>
        {title && (
          <View style={styles.titleRow}>
            <Feather name="play-circle" size={16} color={colors.primary} />
            <Text
              style={[styles.titleText, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        )}
        <View style={styles.videoWrapper}>
          {/* @ts-ignore — web-only element */}
          <video
            src={videoUrl}
            controls
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#000",
              borderRadius: 14,
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.placeholderIcon, { backgroundColor: colors.primary + "20" }]}
      >
        <Feather name="smartphone" size={30} color={colors.primary} />
      </View>
      <View style={styles.placeholderText}>
        <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>
          Видео доступно
        </Text>
        <Text style={[styles.placeholderSub, { color: colors.subForeground }]}>
          Откройте в мобильном приложении для просмотра
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webVideoContainer: {
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  videoWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 14,
    overflow: "hidden",
  },
  placeholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  placeholderIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { flex: 1, gap: 3 },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  placeholderSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  uploadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  uploadText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
