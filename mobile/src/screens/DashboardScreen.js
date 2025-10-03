import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

function SummaryCard({ title, value, subtitle }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle ? <Text style={styles.metricSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
  });

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await refetch();
  }, [queryClient, refetch]);

  const todaySummary = data?.todaySummary;
  const lowStockItems = data?.lowStockItems ?? [];
  const recentSales = data?.recentSales ?? [];
  const recentTrend = data?.recentTrend ?? [];

  const sevenDayRevenue = recentTrend.reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
  const sevenDayItems = recentTrend.reduce((sum, day) => sum + (day.totalItems || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={(
        <RefreshControl refreshing={isRefetching || isLoading} onRefresh={onRefresh} />
      )}
    >
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Quick snapshot of the stall performance</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.card}>
          {todaySummary ? (
            <>
              <Text style={styles.cardTitle}>{todaySummary.title}</Text>
              <Text style={styles.cardSubtitle}>
                Status: {todaySummary.status?.toUpperCase?.() || 'N/A'}
              </Text>
              {todaySummary.weather ? (
                <Text style={styles.cardSubtitle}>Weather: {todaySummary.weather}</Text>
              ) : null}
              <View style={styles.metricRow}>
                <SummaryCard
                  title="Revenue"
                  value={formatCurrency(todaySummary.totalRevenue)}
                  subtitle="Gross sales"
                />
                <SummaryCard
                  title="Items"
                  value={String(todaySummary.totalItemsSold || 0)}
                  subtitle="Units sold"
                />
                <SummaryCard
                  title="Transactions"
                  value={String(todaySummary.saleCount || 0)}
                  subtitle="Sales logged"
                />
              </View>
              <View style={styles.divider} />
              <Text style={styles.sectionSubtitle}>Latest Sales</Text>
              {todaySummary.latestSales?.length ? (
                todaySummary.latestSales.map(sale => (
                  <View key={sale.id} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>
                        {sale.quantity} x {sale.itemName}
                      </Text>
                      <Text style={styles.listSubtitle}>{formatDateTime(sale.soldAt)}</Text>
                    </View>
                    <Text style={styles.listValue}>{formatCurrency(sale.totalPrice)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No sales recorded yet.</Text>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>No active session right now.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7 Day Trend</Text>
        <View style={styles.card}>
          <View style={styles.metricRow}>
            <SummaryCard
              title="Revenue"
              value={formatCurrency(sevenDayRevenue)}
              subtitle={`${sevenDayItems} items sold`}
            />
          </View>
          {recentTrend.length ? (
            recentTrend.map(day => (
              <View key={day.date} style={styles.listItem}>
                <Text style={styles.listTitle}>{formatDate(day.date)}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listValue}>{formatCurrency(day.totalRevenue)}</Text>
                  <Text style={styles.listSubtitle}>{day.totalItems} items</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Waiting on more sales history.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
        <View style={styles.card}>
          {lowStockItems.length ? (
            lowStockItems.map(item => (
              <View key={item.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.name}</Text>
                  <Text style={styles.listSubtitle}>{formatCurrency(item.price)}</Text>
                </View>
                <Text style={styles.badge}>{item.quantity} left</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>All inventory looks healthy.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sales</Text>
        <View style={styles.card}>
          {recentSales.length ? (
            recentSales.map(sale => (
              <View key={sale.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>
                    {sale.quantity} x {sale.itemName}
                  </Text>
                  <Text style={styles.listSubtitle}>{sale.sessionTitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listValue}>{formatCurrency(sale.totalPrice)}</Text>
                  <Text style={styles.listSubtitle}>{formatDateTime(sale.soldAt)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent sales logged.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#475569',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  listValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
});
