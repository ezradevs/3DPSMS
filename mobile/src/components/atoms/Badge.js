import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

const variantStyles = {
  default: {
    backgroundColor: colors.surfaceSubtle,
    color: colors.textSecondary,
  },
  success: {
    backgroundColor: '#dcfce7',
    color: colors.success,
  },
  warning: {
    backgroundColor: '#fef3c7',
    color: colors.warning,
  },
  danger: {
    backgroundColor: '#fee2e2',
    color: colors.danger,
  },
  info: {
    backgroundColor: '#dbeafe',
    color: colors.primary,
  },
};

export default function Badge({ label, variant = 'default', style, textStyle }) {
  const palette = variantStyles[variant] || variantStyles.default;
  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }, style]}>
      <Text style={[styles.text, { color: palette.color }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
