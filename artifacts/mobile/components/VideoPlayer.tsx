import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";

// Conditionally import WebView only on native (web uses <iframe>)
let WebView: any = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
}

/**
 * Определяем, является ли ссылка embed-вставкой (VK Видео, Rutube и т.д.)
 * Если да — используем iframe/WebView. Если нет — прямой <video>.
 */
function isEmbedUrl(url: string): boolean {
  return (
    url.includes("vkvideo.ru/video_ext") ||
    url.includes("vk.com/video_ext") ||
    url.includes("rutube.ru/play/embed") ||
    url.includes("rutube.ru/video/embed")
  );
}

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const colors = useAppColors();

  // ─── Заглушка: видео не добавлено ─────────────────────────────────────────
  if (!videoUrl) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.placeholderIcon, { backgroundColor: colors.primary + "20" }]}>
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
            { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
          ]}
        >
          <Feather name="upload-cloud" size={12} color={colors.primary} />
          <Text style={[styles.uploadText, { color: colors.primary }]}>Скоро</Text>
        </View>
      </View>
    );
  }

  const embed = isEmbedUrl(videoUrl);

  // ─── Web ───────────────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
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
          {embed ? (
            // @ts-ignore — web-only element
            <iframe
              src={videoUrl}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
              frameBorder={0}
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: 14,
                backgroundColor: "#000",
              }}
            />
          ) : (
            // @ts-ignore — web-only element
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
          )}
        </View>
      </View>
    );
  }

  // ─── Native (iOS / Android) ────────────────────────────────────────────────
  if (embed && WebView) {
    return (
      <View style={styles.nativeContainer}>
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
          <WebView
            source={{ uri: videoUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
          />
        </View>
      </View>
    );
  }

  // ─── Native: прямой mp4 без WebView ───────────────────────────────────────
  // Если понадобится expo-video — добавить сюда позже
  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.placeholderIcon, { backgroundColor: colors.primary + "20" }]}>
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
  webContainer: { gap: 8 },
  nativeContainer: { gap: 8 },
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
  webview: {
    flex: 1,
    backgroundColor: "#000",
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
