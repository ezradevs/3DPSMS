import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import Badge from '../components/atoms/Badge';
import ListRow from '../components/molecules/ListRow';
import EmptyState from '../components/molecules/EmptyState';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';
import AppButton from '../components/atoms/AppButton';

export default function InventoryScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');

  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: api.getItems });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    return itemsQuery.refetch();
  }, [queryClient, itemsQuery]);

  const items = useMemo(() => {
    const source = itemsQuery.data;
    if (!source) return [];
    if (!search.trim()) return source;
    const term = search.toLowerCase();
    return source.filter(item => item.name?.toLowerCase().includes(term) || item.tag?.toLowerCase().includes(term));
  }, [itemsQuery.data, search]);

  const lowStock = (itemsQuery.data ?? []).filter(item => item.quantity < 5);

  if (itemsQuery.isLoading || itemsQuery.isRefetching) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading inventory…" />
      </ScreenContainer>
    );
  }

  if (itemsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={itemsQuery.error?.message || 'Unable to load inventory'} onRetry={onRefresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={itemsQuery.isRefetching}>
      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.subtitle}>{itemsQuery.data?.length ?? 0} items · {lowStock.length} low stock</Text>

      <Card style={styles.searchCard}>
        <TextInput
          placeholder="Search items…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </Card>

      <SectionHeading
        title="Products"
        action={(
          <AppButton
            title="Add Item"
            onPress={() => navigation.navigate('InventoryForm', { mode: 'create' })}
            variant="primary"
          />
        )}
        style={{ marginBottom: spacing.md }}
      />
      <Card>
        {items.length ? (
          items.map(item => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={item.description || 'No description'}
              meta={
                <View style={styles.itemMeta}>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  <Badge
                    label={`${item.quantity} on hand`}
                    variant={item.quantity < 5 ? (item.quantity === 0 ? 'danger' : 'warning') : 'info'}
                  />
                </View>
              }
              onPress={() => navigation.navigate('InventoryDetail', { itemId: item.id })}
            >
              <View style={styles.itemTagRow}>
                {item.tag ? <Badge label={item.tag} /> : null}
                {item.totalSold ? (
                  <Text style={styles.itemMetaText}>Sold {item.totalSold} · Revenue {formatCurrency(item.totalRevenue)}</Text>
                ) : null}
              </View>
            </ListRow>
          ))
        ) : (
          <EmptyState message={search ? 'No items match your search.' : 'Inventory is empty.'} />
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
  searchInput: {
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  searchCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  itemMetaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
