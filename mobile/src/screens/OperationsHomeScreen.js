import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import AppButton from '../components/atoms/AppButton';
import { colors, spacing } from '../constants/theme';

const operations = [
  {
    title: 'Custom Orders',
    description: 'Track custom print requests, status, and payments.',
    route: 'OrdersHome',
  },
  {
    title: 'Filament',
    description: 'Manage spools and log usage.',
    route: 'FilamentHome',
  },
  {
    title: 'Print Queue',
    description: 'Schedule and manage print jobs.',
    route: 'PrintQueueHome',
  },
  {
    title: 'Expenses',
    description: 'Track stall expenses and payouts.',
    route: 'ExpensesHome',
  },
  {
    title: 'Admin Tools',
    description: 'Reset data, maintenance actions.',
    route: 'AdminHome',
  },
];

export default function OperationsHomeScreen() {
  const navigation = useNavigation();

  return (
    <ScreenContainer scrollable={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Operations</Text>
        <Text style={styles.subtitle}>Manage custom orders, filament, print queue, expenses, and admin tools.</Text>

        <View style={styles.grid}>
          {operations.map(operation => (
            <Card key={operation.title} style={styles.card}>
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.cardTitle}>{operation.title}</Text>
                <Text style={styles.cardDescription}>{operation.description}</Text>
                <AppButton
                  title="Open"
                  variant="secondary"
                  onPress={() => navigation.navigate(operation.route)}
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  grid: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
