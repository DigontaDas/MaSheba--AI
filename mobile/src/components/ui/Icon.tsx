import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme";

export type IconName = keyof typeof MaterialIcons.glyphMap;

export function Icon({
  name,
  size = 22,
  color = colors.onSurface
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
