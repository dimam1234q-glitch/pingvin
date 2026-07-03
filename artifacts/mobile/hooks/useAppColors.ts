import THEMES, { ThemeColors } from "@/constants/themes";
import { useApp } from "@/contexts/AppContext";

export function useAppColors(): ThemeColors {
  const { settings } = useApp();
  return THEMES[settings.theme].colors;
}
