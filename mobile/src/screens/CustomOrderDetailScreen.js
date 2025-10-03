import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import SectionHeading from '../components/molecules/SectionHeading';
import AppButton from '../components/atoms/AppButton';
import Badge from '../components/atoms/Badge';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

const STATUS_OPTIONS = ['new', 'in_progress', 'ready', 'delivered', 'cancelled'];

const STATUS_VARIANTS = {
  new: 'info',
  in_progress: 'warning',
  ready: 'success',
  delivered: 'success',
  cancelled: 'danger',
};

export default function CustomOrderDetailScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const orderId = params?.orderId;

  const orderQuery = useQuery({
    queryKey: ['customOrder', orderId],
    queryFn: () => api.getCustomOrder(orderId),
    enabled: Boolean(orderId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: newStatus => api.updateCustomOrder(orderId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['customOrders'] });
    },
    onError: err => Alert.alert('Unable to update status', err.message || 'Please try again.'),
  });

  if (orderQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading order…" />
      </ScreenContainer>
    );
  }

  if (orderQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={orderQuery.error?.message || 'Unable to load order'} onRetry={orderQuery.refetch} />
      </ScreenContainer>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <ScreenContainer>
        <Card>
          <Text style={styles.message}>Order not found.</Text>
        </Card>
      </ScreenContainer>
    );
  }

  const statusLabel = order.status
    ? order.status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
    : 'Unknown';

  const handleStatusChange = newStatus => {
    updateStatusMutation.mutate(newStatus);
  };

  return (
    <ScreenContainer>
      <SectionHeading
        title={order.customerName}
        action={<AppButton title="Edit" variant="secondary" onPress={() => navigation.navigate('OrderForm', { mode: 'edit', orderId })} />}
      />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.headerRow}>
          <Badge label={statusLabel} variant={STATUS_VARIANTS[order.status] || 'default'} />
          <View style={{ alignItems: 'flex-end' }}>
            {order.dueDate ? (
              <Text style={styles.helper}>Due {formatDate(order.dueDate)}</Text>
            ) : null}
            <Text style={styles.helper}>Updated {formatDateTime(order.updatedAt)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Source</Text>
          <Text style={styles.value}>{(order.source || 'Unknown').replace(/_/g, ' ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Contact</Text>
          <Text style={styles.value}>{order.contactInfo || '—'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Request Details</Text>
          <Text style={styles.value}>{order.requestDetails || 'No details provided.'}</Text>
        </View>

        {order.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Pricing</Text>
          <Text style={styles.value}>
            Quote {formatCurrency(order.quotedPrice || 0)}
            {order.depositPaid != null ? ` • Deposit ${formatCurrency(order.depositPaid)}` : ''}
          </Text>
        </View>
      </Card>

      <SectionHeading title="Update status" />
      <Card>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map(status => (
            <AppButton
              key={status}
              title={status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              variant={order.status === status ? 'primary' : 'secondary'}
              onPress={() => handleStatusChange(status)}
              disabled={updateStatusMutation.isLoading}
              style={styles.statusChip}
              textStyle={{ fontSize: 12 }}
            />
          ))}
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  value: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    minWidth: 120,
  },
});
