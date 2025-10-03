import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export default function LoadingState({ message = 'Loading…' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
