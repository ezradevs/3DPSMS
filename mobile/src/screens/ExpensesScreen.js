import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import ListRow from '../components/molecules/ListRow';
import Badge from '../components/atoms/Badge';
import AppButton from '../components/atoms/AppButton';
import EmptyState from '../components/molecules/EmptyState';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';
import Card from '../components/atoms/Card';
import CollapsibleCard from '../components/molecules/CollapsibleCard';

const PAYERS = ['', 'Business', 'Ezra', 'Dylan'];
const CATEGORIES = ['', 'Market Stall', 'Filament', 'Plants', 'Display/Decor', 'Equipment', 'Other'];

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [payerFilter, setPayerFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const expensesQuery = useQuery({
    queryKey: ['expenses', payerFilter, categoryFilter],
    queryFn: () => api.listExpenses({
      payer: payerFilter || undefined,
      category: categoryFilter || undefined,
    }),
  });

  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);

  const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const deleteExpenseMutation = useMutation({
    mutationFn: expenseId => api.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Alert.alert('Expense deleted');
    },
    onError: err => Alert.alert('Unable to delete expense', err?.message || 'Please try again.'),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    return expensesQuery.refetch();
  };

  if (expensesQuery.isLoading || expensesQuery.isRefetching) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading expenses…" />
      </ScreenContainer>
    );
  }

  if (expensesQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={expensesQuery.error?.message || 'Unable to load expenses'} onRetry={onRefresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={expensesQuery.isRefetching} contentContainerStyle={{ paddingTop: spacing.lg }}>
      <Text style={styles.title}>Expenses</Text>
      <Text style={styles.subtitle}>
        {expenses.length} entries · {formatCurrency(totalAmount)} total
      </Text>

      <CollapsibleCard
        title="Filters"
        style={styles.filterCard}
        contentStyle={styles.filterContent}
        defaultCollapsed
      >
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Payer</Text>
          <View style={styles.filterRow}>
            {PAYERS.map(payer => (
              <AppButton
                key={payer || 'all'}
                title={payer || 'All'}
                variant={payerFilter === payer ? 'primary' : 'secondary'}
                onPress={() => setPayerFilter(payer)}
                style={styles.filterChip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.filterRow}>
            {CATEGORIES.map(category => (
              <AppButton
                key={category || 'all'}
                title={category || 'All'}
                variant={categoryFilter === category ? 'primary' : 'secondary'}
                onPress={() => setCategoryFilter(category)}
                style={styles.filterChip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>
      </CollapsibleCard>

      <SectionHeading
        title="Entries"
        action={<AppButton title="Add Expense" onPress={() => navigation.navigate('ExpensesForm', { mode: 'create' })} />}
        style={{ marginBottom: spacing.md }}
      />

      <Card>
        {expenses.length ? (
          expenses.map((expense, index) => (
            <ListRow
              key={expense.id}
              title={expense.description}
              subtitle={expense.notes || 'No notes'}
              onPress={() => navigation.navigate('ExpensesForm', { mode: 'edit', expense })}
              meta={
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{formatDate(expense.expenseDate)}</Text>
                  <Text style={styles.metaValue}>{formatCurrency(expense.amount)}</Text>
                  {expense.category ? <Badge label={expense.category} variant="info" /> : null}
                </View>
              }
              onLongPress={() => {
                Alert.alert(
                  'Delete expense',
                  `Remove expense “${expense.description}”?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: deleteExpenseMutation.isLoading ? 'Deleting…' : 'Delete',
                      style: 'destructive',
                      onPress: () => deleteExpenseMutation.mutate(expense.id),
                    },
                  ],
                );
              }}
              showDivider={index !== expenses.length - 1}
            >
              <Text style={styles.metaText}>Payer: {expense.payer || '—'}</Text>
            </ListRow>
          ))
        ) : (
          <EmptyState message="No expenses recorded yet." />
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  filterGroup: {
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterCard: {
    marginBottom: spacing.md,
  },
  filterContent: {
    gap: spacing.md,
  },
  filterChip: {
    minWidth: 100,
  },
  meta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
