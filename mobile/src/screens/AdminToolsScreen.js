import React from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import AppButton from '../components/atoms/AppButton';
import { api } from '../api/client';
import { colors, spacing } from '../constants/theme';

export default function AdminToolsScreen() {
  const handleReset = () => {
    Alert.alert(
      'Reset database',
      'This will delete all items, sales, and uploads. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.resetDatabase();
              Alert.alert('Database reset complete');
            } catch (error) {
              Alert.alert('Unable to reset database', error.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer contentContainerStyle={{ paddingTop: spacing.lg }}>
      <Card style={styles.card}>
        <Text style={styles.title}>Admin Tools</Text>
        <Text style={styles.message}>Perform maintenance tasks like resetting data for demos.</Text>
        <AppButton title="Reset database" variant="danger" onPress={handleReset} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
