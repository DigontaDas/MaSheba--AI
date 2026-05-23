import { useId } from "react";
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { colors } from "@/theme";
import type { RiskLevel } from "@/types/schema";

export function RiskGauge({
  score,
  level,
  size = 168
}: {
  score: number;
  level: RiskLevel;
  size?: number;
}) {
  const gradientId = `riskGradient-${useId().replace(/:/g, "")}`;
  const normalized = Math.max(0, Math.min(1, score));
  const strokeWidth = Math.max(12, Math.round(size * 0.09));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const half = circumference / 2;
  const strokeDashoffset = half * (1 - normalized);
  const center = size / 2;
  const scoreText = Math.round(normalized * 100).toString();

  return (
    <Svg width={size} height={size / 2 + strokeWidth + 28} viewBox={`0 0 ${size} ${size / 2 + strokeWidth + 28}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor={colors.secondary} />
          <Stop offset="0.52" stopColor={colors.primaryContainer} />
          <Stop offset="1" stopColor={colors.primary} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.surfaceContainerHighest}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${half} ${circumference}`}
        strokeLinecap="round"
        rotation="180"
        origin={`${center}, ${center}`}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${half} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="180"
        origin={`${center}, ${center}`}
      />
      <SvgText
        x={center}
        y={center - 6}
        textAnchor="middle"
        fontSize={30}
        fontWeight="700"
        fill={colors.onSurface}
      >
        {scoreText}
      </SvgText>
      <SvgText
        x={center}
        y={center + 18}
        textAnchor="middle"
        fontSize={13}
        fontWeight="600"
        fill={colors.onSurfaceVariant}
      >
        {level}
      </SvgText>
    </Svg>
  );
}
