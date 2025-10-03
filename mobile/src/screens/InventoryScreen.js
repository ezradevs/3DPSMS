import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';

function ItemCard({ item }) {
  return (
    <View style={styles.itemCard}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>
          {item.description || 'No description yet.'}
        </Text>
        <View style={styles.itemMetaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.quantity} on hand</Text>
          </View>
          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
        </View>
        <View style={styles.itemMetaRow}>
          <Text style={styles.itemSubtitle}>Sold: {item.totalSold}</Text>
          <Text style={styles.itemSubtitle}>Revenue: {formatCurrency(item.totalRevenue)}</Text>
        </View>
        {item.tag ? (
          <View style={[styles.badge, styles.tagBadge]}>
            <Text style={[styles.badgeText, styles.tagBadgeText]}>{item.tag}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: api.getItems,
  });

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['items'] });
    await refetch();
  }, [queryClient, refetch]);

  const items = data ?? [];
  const lowStockCount = items.filter(item => item.quantity < 5).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={(
          <RefreshControl refreshing={isRefetching || isLoading} onRefresh={onRefresh} />
        )}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle}>
              {items.length} items · {lowStockCount} low stock alerts
            </Text>
          </View>
        )}
        renderItem={({ item }) => <ItemCard item={item} />}
        ListEmptyComponent={(
          <Text style={styles.emptyText}>
            No items yet. Add products from the desktop admin to see them here.
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  itemMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  badge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  tagBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
  },
  tagBadgeText: {
    color: '#991b1b',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 32,
  },
});
