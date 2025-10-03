import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export default function ListRow({ title, subtitle, meta, children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}
      >
        <RowContent title={title} subtitle={subtitle} meta={meta}>
          {children}
        </RowContent>
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <RowContent title={title} subtitle={subtitle} meta={meta}>
        {children}
      </RowContent>
    </View>
  );
}

function RowContent({ title, subtitle, meta, children }) {
  return (
    <>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
      {meta ? <View style={styles.meta}>{meta}</View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  left: {
    flex: 1,
    paddingRight: spacing.lg,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
