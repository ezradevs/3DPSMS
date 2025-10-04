import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Card from '../atoms/Card';
import { colors, spacing } from '../../constants/theme';

export default function CollapsibleCard({
  title,
  children,
  defaultCollapsed = false,
  style,
  contentStyle,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Card style={[styles.card, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setCollapsed(prev => !prev)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {!collapsed ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
