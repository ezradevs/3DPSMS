import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
