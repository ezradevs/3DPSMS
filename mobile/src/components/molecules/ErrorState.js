import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import AppButton from '../atoms/AppButton';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      {onRetry ? <AppButton title="Try again" variant="ghost" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: 14,
    color: colors.danger,
  },
});
