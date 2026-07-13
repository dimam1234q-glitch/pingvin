/**
 * TheoryReader — красивый рендер структурированного содержания теоретического урока.
 *
 * Поддерживаемые блоки:
 *   paragraph  — обычный абзац
 *   definition — карточка с термином, описанием и необязательными примерами-чипсами
 *   note       — выделенная плашка-подсказка с иконкой лампочки
 *   formula    — строка с математической формулой (моноширинный стиль)
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";

import type { TheoryBlock } from "@/data/curriculum";
export type { TheoryBlock };

// Цветовая палитра для definition-карточек (по порядку)
const DEF_COLORS = ["#6366F1", "#F59E0B", "#10B981", "#EC4899", "#3B82F6", "#8B5CF6"];

interface Props {
  blocks: TheoryBlock[];
  fontScale?: number;
}

export default function TheoryReader({ blocks, fontScale = 1 }: Props) {
  const colors = useAppColors();
  let defIndex = 0;

  return (
    <View style={styles.root}>
      {blocks.map((block, i) => {
        switch (block.type) {

          // ── Абзац ────────────────────────────────────────────────────────
          case "paragraph":
            return (
              <Text
                key={i}
                style={[
                  styles.paragraph,
                  { color: colors.subForeground, fontSize: 15 * fontScale, lineHeight: 24 * fontScale },
                ]}
              >
                {block.text}
              </Text>
            );

          // ── Карточка определения ─────────────────────────────────────────
          case "definition": {
            const accent = block.color ?? DEF_COLORS[defIndex % DEF_COLORS.length];
            defIndex++;
            return (
              <View
                key={i}
                style={[
                  styles.defCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {/* Левая цветная полоска */}
                <View style={[styles.defAccent, { backgroundColor: accent }]} />

                <View style={styles.defBody}>
                  {/* Заголовок-термин */}
                  <View style={styles.defTitleRow}>
                    <View style={[styles.defDot, { backgroundColor: accent }]} />
                    <Text
                      style={[
                        styles.defTerm,
                        { color: accent, fontSize: 14 * fontScale },
                      ]}
                    >
                      {block.term}
                    </Text>
                  </View>

                  {/* Описание */}
                  <Text
                    style={[
                      styles.defText,
                      { color: colors.foreground, fontSize: 14 * fontScale, lineHeight: 21 * fontScale },
                    ]}
                  >
                    {block.text}
                  </Text>

                  {/* Примеры-чипсы */}
                  {block.examples && block.examples.length > 0 && (
                    <View style={styles.examplesRow}>
                      <Text style={[styles.examplesLabel, { color: colors.mutedForeground, fontSize: 12 * fontScale }]}>
                        Например:
                      </Text>
                      {block.examples.map((ex, ei) => (
                        <View
                          key={ei}
                          style={[
                            styles.exampleChip,
                            { backgroundColor: accent + "1A", borderColor: accent + "44" },
                          ]}
                        >
                          <Text style={[styles.exampleText, { color: accent, fontSize: 13 * fontScale }]}>
                            {ex}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          }

          // ── Заметка / подсказка ──────────────────────────────────────────
          case "note":
            return (
              <View
                key={i}
                style={[
                  styles.noteCard,
                  { backgroundColor: colors.amber + "14", borderColor: colors.amber + "40" },
                ]}
              >
                <View style={[styles.noteIconWrap, { backgroundColor: colors.amber + "22" }]}>
                  <Feather name="zap" size={14} color={colors.amber} />
                </View>
                <Text
                  style={[
                    styles.noteText,
                    { color: colors.foreground, fontSize: 14 * fontScale, lineHeight: 21 * fontScale },
                  ]}
                >
                  {block.text}
                </Text>
              </View>
            );

          // ── Формула ──────────────────────────────────────────────────────
          case "formula":
            return (
              <View
                key={i}
                style={[
                  styles.formulaCard,
                  { backgroundColor: colors.primary + "10", borderColor: colors.primary + "35" },
                ]}
              >
                <Feather name="code" size={13} color={colors.primary} style={{ marginTop: 1 }} />
                <Text
                  style={[
                    styles.formulaText,
                    { color: colors.primary, fontSize: 15 * fontScale, lineHeight: 22 * fontScale },
                  ]}
                >
                  {block.text}
                </Text>
              </View>
            );

          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },

  // paragraph
  paragraph: {
    fontFamily: "Inter_400Regular",
  },

  // definition card
  defCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  defAccent: {
    width: 4,
    borderRadius: 2,
  },
  defBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  defTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  defDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  defTerm: {
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.1,
  },
  defText: {
    fontFamily: "Inter_400Regular",
  },
  examplesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  examplesLabel: {
    fontFamily: "Inter_400Regular",
  },
  exampleChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  exampleText: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },

  // note
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
  },

  // formula
  formulaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  formulaText: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontWeight: "600",
  },
});
