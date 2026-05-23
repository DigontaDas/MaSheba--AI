import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export function ChatBubble({
  role,
  text,
  timestamp,
  warningCard
}: {
  role: "ai" | "user";
  text: string;
  timestamp?: string;
  warningCard?: { title: string; description: string };
}) {
  const isUser = role === "user";
  return (
    <View style={[styles.wrap, isUser && styles.userWrap]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{text}</Text>
        {warningCard ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>{warningCard.title}</Text>
            <Text style={styles.warningBody}>{warningCard.description}</Text>
          </View>
        ) : null}
      </View>
      {timestamp ? <Text style={[styles.time, isUser && styles.userTime]}>{timestamp}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-start",
    gap: spacing.xs
  },
  userWrap: {
    alignItems: "flex-end"
  },
  bubble: {
    borderRadius: radius.lg,
    maxWidth: "86%",
    padding: spacing.base
  },
  aiBubble: {
    backgroundColor: colors.surfaceContainerLow
  },
  userBubble: {
    backgroundColor: colors.primaryContainer
  },
  text: {
    ...typography.body,
    color: colors.onSurface
  },
  userText: {
    color: colors.onPrimary
  },
  time: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.xs
  },
  userTime: {
    textAlign: "right"
  },
  warning: {
    backgroundColor: colors.warningCard,
    borderColor: colors.primaryContainer,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  warningTitle: {
    ...typography.label,
    color: colors.onPrimaryContainer,
    fontFamily: typography.h2.fontFamily
  },
  warningBody: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
