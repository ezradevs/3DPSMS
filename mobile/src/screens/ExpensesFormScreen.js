import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import FormField from '../components/molecules/FormField';
import DatePickerField from '../components/molecules/DatePickerField';
import AppButton from '../components/atoms/AppButton';
import { api } from '../api/client';
import { colors, spacing } from '../constants/theme';

const PAYERS = ['Business', 'Ezra', 'Dylan'];
const CATEGORIES = ['Market Stall', 'Filament', 'Plants', 'Display/Decor', 'Equipment', 'Other'];

export default function ExpensesFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { mode, expense } = route.params ?? { mode: 'create' };
  const isEdit = mode === 'edit' && expense;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(null);
  const [payer, setPayer] = useState(null);
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isEdit) {
      setDescription(expense.description || '');
      setAmount(expense.amount != null ? String(expense.amount) : '');
      setCategory(expense.category ?? null);
      setPayer(expense.payer ?? null);
      setExpenseDate(expense.expenseDate ? expense.expenseDate.slice(0, 10) : '');
      setNotes(expense.notes || '');
    }
  }, [isEdit, expense]);

  const createMutation = useMutation({
    mutationFn: payload => api.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Alert.alert('Expense recorded');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to record expense', err.message || 'Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: payload => api.updateExpense(expense.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Alert.alert('Expense updated');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to update expense', err.message || 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteExpense(expense.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      Alert.alert('Expense deleted');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to delete expense', err.message || 'Please try again.'),
  });

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading;

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Description is required');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      Alert.alert('Enter a valid amount');
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      category: category || undefined,
      payer: payer || undefined,
      expenseDate: expenseDate || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete expense',
      'This will permanently remove the expense entry.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  return (
    <ScreenContainer contentContainerStyle={{ paddingTop: spacing.lg }}>
      <SectionHeading title={isEdit ? 'Edit Expense' : 'New Expense'} />
      <Card style={{ gap: spacing.md }}>
        <FormField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Expense description"
        />
        <View style={styles.sectionSpacing}>
          <FormField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        </View>

        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(cat => (
              <AppButton
                key={cat}
                title={cat}
                variant={category === cat ? 'primary' : 'secondary'}
                onPress={() => setCategory(prev => (prev === cat ? null : cat))}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
            <AppButton
              title="None"
              variant={category == null ? 'primary' : 'secondary'}
              onPress={() => setCategory(null)}
              style={styles.chip}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </View>

        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
          <Text style={styles.label}>Payer</Text>
          <View style={styles.chipRow}>
            {PAYERS.map(name => (
              <AppButton
                key={name}
                title={name}
                variant={payer === name ? 'primary' : 'secondary'}
                onPress={() => setPayer(prev => (prev === name ? null : name))}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
            <AppButton
              title="None"
              variant={payer == null ? 'primary' : 'secondary'}
              onPress={() => setPayer(null)}
              style={styles.chip}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </View>

        <View style={styles.sectionSpacing}>
          <DatePickerField label="Date" value={expenseDate} onChange={setExpenseDate} allowClear />
        </View>
        <View style={styles.sectionSpacing}>
          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Details, receipt numbers, etc."
          />
        </View>

        <View style={styles.actionFooter}>
          <AppButton
            title={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create expense'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
          {isEdit ? (
            <AppButton title="Delete expense" variant="danger" onPress={handleDelete} disabled={isSubmitting} />
          ) : null}
          <AppButton title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 100,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  actionFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
