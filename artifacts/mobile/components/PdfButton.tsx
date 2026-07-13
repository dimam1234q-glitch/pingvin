import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useAppColors } from "@/hooks/useAppColors";
import PDF_PATHS from "@/data/pdfAssets";

interface PdfButtonProps {
  pdfKey: string;
  label?: string;
  fontScale?: number;
}

export default function PdfButton({
  pdfKey,
  label = "Открыть конспект",
  fontScale = 1,
}: PdfButtonProps) {
  const colors = useAppColors();
  const [loading, setLoading] = useState(false);

  const relativePath = PDF_PATHS[pdfKey];
  if (!relativePath) return null;

  async function handleOpen() {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        // Expo web отдаёт public/ как статику — открываем в новой вкладке
        window.open(relativePath, "_blank");
      } else {
        // Мобильный: строим полный URL из переменной окружения
        const domain =
          process.env.EXPO_PUBLIC_DOMAIN ??
          "localhost:8081";
        const url = `https://${domain}${relativePath}`;
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle:
            WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
      }
    } catch (e) {
      console.warn("PDF open error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Иконка */}
      <View style={[styles.iconWrap, { backgroundColor: "#E53E3E18" }]}>
        <Feather name="file-text" size={20} color="#E53E3E" />
      </View>

      {/* Текст */}
      <View style={styles.textBlock}>
        <Text
          style={[
            styles.label,
            { color: colors.foreground, fontSize: 14 * fontScale },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.sub,
            { color: colors.mutedForeground, fontSize: 12 * fontScale },
          ]}
        >
          PDF · нажми, чтобы прочитать
        </Text>
      </View>

      {/* Спиннер / стрелка */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Feather name="external-link" size={16} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1, gap: 2 },
  label: {
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontFamily: "Inter_400Regular",
  },
});
