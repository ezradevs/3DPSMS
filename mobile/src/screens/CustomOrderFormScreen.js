import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import SectionHeading from '../components/molecules/SectionHeading';
import FormField from '../components/molecules/FormField';
import DatePickerField from '../components/molecules/DatePickerField';
import AppButton from '../components/atoms/AppButton';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api } from '../api/client';
import { colors, spacing } from '../constants/theme';

const STATUS_OPTIONS = ['new', 'in_progress', 'ready', 'delivered', 'cancelled'];
const SOURCE_OPTIONS = ['email', 'instagram', 'in_person', 'other'];

export default function CustomOrderFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { mode, orderId } = route.params ?? { mode: 'create' };
  const isEdit = mode === 'edit' && orderId;

  const orderQuery = useQuery({
    queryKey: ['customOrder', orderId],
    queryFn: () => api.getCustomOrder(orderId),
    enabled: Boolean(isEdit),
  });

  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [source, setSource] = useState('email');
  const [status, setStatus] = useState('new');
  const [dueDate, setDueDate] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [depositPaid, setDepositPaid] = useState('');

  useEffect(() => {
    if (isEdit && orderQuery.data) {
      const order = orderQuery.data;
      setCustomerName(order.customerName || '');
      setContactInfo(order.contactInfo || '');
      setSource(order.source || 'other');
      setStatus(order.status || 'new');
      setDueDate(order.dueDate ? order.dueDate.slice(0, 10) : '');
      setRequestDetails(order.requestDetails || '');
      setNotes(order.notes || '');
      setQuotedPrice(order.quotedPrice != null ? String(order.quotedPrice) : '');
      setDepositPaid(order.depositPaid != null ? String(order.depositPaid) : '');
    }
  }, [isEdit, orderQuery.data]);

  const createMutation = useMutation({
    mutationFn: payload => api.createCustomOrder(payload),
    onSuccess: order => {
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      Alert.alert('Order created');
      navigation.replace('OrderDetail', { orderId: order.id });
    },
    onError: err => Alert.alert('Unable to create order', err.message || 'Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: payload => api.updateCustomOrder(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customOrder', orderId] });
      Alert.alert('Order updated');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to update order', err.message || 'Please try again.'),
  });

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  const handleSubmit = () => {
    if (!customerName.trim()) {
      Alert.alert('Customer name is required');
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      contactInfo: contactInfo.trim() || undefined,
      source,
      status,
      dueDate: dueDate || undefined,
      requestDetails: requestDetails.trim() || undefined,
      notes: notes.trim() || undefined,
      quotedPrice: quotedPrice !== '' ? Number(quotedPrice) : null,
      depositPaid: depositPaid !== '' ? Number(depositPaid) : null,
    };

    if (payload.quotedPrice != null && !Number.isFinite(payload.quotedPrice)) {
      Alert.alert('Enter a valid quoted price');
      return;
    }
    if (payload.depositPaid != null && !Number.isFinite(payload.depositPaid)) {
      Alert.alert('Enter a valid deposit amount');
      return;
    }

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && orderQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading order…" />
      </ScreenContainer>
    );
  }

  if (isEdit && orderQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={orderQuery.error?.message || 'Unable to load order'} onRetry={orderQuery.refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={{ paddingTop: spacing.lg }}>
      <SectionHeading title={isEdit ? 'Edit Order' : 'New Custom Order'} />
      <Card style={{ gap: spacing.md }}>
        <FormField
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="John Doe"
        />
        <FormField
          label="Contact Info"
          value={contactInfo}
          onChangeText={setContactInfo}
          placeholder="Email, phone, handle…"
        />

        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
          <Text style={styles.label}>Source</Text>
          <View style={styles.chipRow}>
            {SOURCE_OPTIONS.map(option => (
              <AppButton
                key={option}
                title={option.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                variant={source === option ? 'primary' : 'secondary'}
                onPress={() => setSource(option)}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        <View style={[{ gap: spacing.sm }, styles.sectionSpacing, { marginBottom: spacing.sm }]}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map(option => (
              <AppButton
                key={option}
                title={option.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                variant={status === option ? 'primary' : 'secondary'}
                onPress={() => setStatus(option)}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        <DatePickerField label="Due Date" value={dueDate} onChange={setDueDate} allowClear />

        <FormField
          label="Request Details"
          value={requestDetails}
          onChangeText={setRequestDetails}
          placeholder="Describe model, size, filament, finish…"
          multiline
        />
        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Internal notes"
          multiline
        />

        <View style={styles.formRow}>
          <FormField
            label="Quoted Price"
            value={quotedPrice}
            onChangeText={setQuotedPrice}
            keyboardType="decimal-pad"
          />
          <FormField
            label="Deposit Paid"
            value={depositPaid}
            onChangeText={setDepositPaid}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.actionFooter}>
          <AppButton
            title={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create order'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
          <AppButton
            title="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
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
    minWidth: 110,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
