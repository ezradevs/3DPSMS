import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import CollapsibleCard from '../components/molecules/CollapsibleCard';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'quantity_desc', label: 'Quantity High-Low' },
  { value: 'quantity_asc', label: 'Quantity Low-High' },
  { value: 'price_desc', label: 'Price High-Low' },
  { value: 'price_asc', label: 'Price Low-High' },
];

export default function InventoryScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('name');

  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: api.getItems });

  const deleteItemMutation = useMutation({
    mutationFn: itemId => api.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Item deleted');
    },
    onError: err => {
      Alert.alert('Unable to delete item', err?.message || 'Please try again.');
    },
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    return itemsQuery.refetch();
  }, [queryClient, itemsQuery]);

  const items = useMemo(() => {
    const source = itemsQuery.data ?? [];
    const term = search.toLowerCase();
    const filtered = search.trim()
      ? source.filter(item => item.name?.toLowerCase().includes(term) || item.tag?.toLowerCase().includes(term))
      : source;

    const sorted = [...filtered];
    switch (sortOption) {
      case 'quantity_desc':
        sorted.sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
        break;
      case 'quantity_asc':
        sorted.sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'price_asc':
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'name':
      default:
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }
    return sorted;
  }, [itemsQuery.data, search, sortOption]);

  const lowStock = (itemsQuery.data ?? []).filter(item => item.quantity < 5);

  const confirmDeleteItem = item => {
    Alert.alert(
      'Delete item',
      `Remove ${item.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItemMutation.mutate(item.id),
        },
      ],
    );
  };

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

      <CollapsibleCard
        title="Sort"
        style={styles.sortCard}
        contentStyle={styles.sortContent}
      >
        <Text style={styles.sortLabel}>Sort by</Text>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(option => (
            <AppButton
              key={option.value}
              title={option.label}
              onPress={() => setSortOption(option.value)}
              variant={sortOption === option.value ? 'primary' : 'secondary'}
              style={styles.sortChip}
              textStyle={{ fontSize: 12 }}
            />
          ))}
        </View>
      </CollapsibleCard>

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
          items.map((item, index) => (
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
              onLongPress={() => confirmDeleteItem(item)}
              showDivider={index !== items.length - 1}
            >
              <View style={styles.itemTagRow}>
                {item.tag ? <Badge label={item.tag} /> : null}
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
  sortCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortContent: {
    gap: spacing.sm,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortChip: {
    minWidth: 150,
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
});
