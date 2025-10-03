import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import ListRow from '../components/molecules/ListRow';
import Badge from '../components/atoms/Badge';
import AppButton from '../components/atoms/AppButton';
import EmptyState from '../components/molecules/EmptyState';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_VARIANTS = {
  new: 'info',
  in_progress: 'warning',
  ready: 'success',
  delivered: 'success',
  cancelled: 'danger',
};

export default function CustomOrdersScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['customOrders', statusFilter],
    queryFn: () => api.listCustomOrders(statusFilter ? { status: statusFilter } : {}),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['customOrders', statusFilter] });
    return ordersQuery.refetch();
  };

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  if (ordersQuery.isLoading || ordersQuery.isRefetching) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading custom orders…" />
      </ScreenContainer>
    );
  }

  if (ordersQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          message={ordersQuery.error?.message || 'Unable to load custom orders'}
          onRetry={onRefresh}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={ordersQuery.isRefetching} contentContainerStyle={{ paddingTop: spacing.lg }}>
      <Text style={styles.title}>Custom Orders</Text>
      <Text style={styles.subtitle}>{orders.length} orders</Text>

      <Card style={styles.filterCard}>
        <Text style={styles.filterLabel}>Filter by status</Text>
        <View style={styles.filterRow}>
          {STATUS_OPTIONS.map(option => (
            <AppButton
              key={option.value}
              title={option.label}
              variant={statusFilter === option.value ? 'primary' : 'secondary'}
              onPress={() => setStatusFilter(option.value)}
              style={styles.filterChip}
              textStyle={{ fontSize: 12 }}
            />
          ))}
        </View>
      </Card>

      <SectionHeading
        title="Orders"
        action={<AppButton title="New Order" onPress={() => navigation.navigate('OrderForm', { mode: 'create' })} />}
        style={{ marginBottom: spacing.md }}
      />

      <Card>
        {orders.length ? (
          orders.map(order => (
            <ListRow
              key={order.id}
              title={order.customerName}
              subtitle={order.requestDetails || order.source || 'No details provided'}
              meta={
                <View style={styles.orderMeta}>
                  {order.dueDate ? (
                    <Text style={styles.metaText}>Due {formatDate(order.dueDate)}</Text>
                  ) : null}
                  <Text style={styles.metaText}>
                    {order.depositPaid != null
                      ? `${formatCurrency(order.depositPaid)} / ${formatCurrency(order.quotedPrice || 0)}`
                      : formatCurrency(order.quotedPrice || 0)}
                  </Text>
                  <Badge
                    label={STATUS_OPTIONS.find(opt => opt.value === order.status)?.label || order.status}
                    variant={STATUS_VARIANTS[order.status] || 'default'}
                  />
                </View>
              }
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            />
          ))
        ) : (
          <EmptyState message={statusFilter ? 'No orders in this status.' : 'No custom orders yet.'} />
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
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    minWidth: 90,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
