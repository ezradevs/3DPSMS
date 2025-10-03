import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import SectionHeading from '../components/molecules/SectionHeading';
import Badge from '../components/atoms/Badge';
import FormField from '../components/molecules/FormField';
import AppButton from '../components/atoms/AppButton';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import EmptyState from '../components/molecules/EmptyState';
import { api, resolveUploadUrl } from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

export default function InventoryDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { itemId } = route.params;
  const [adjustAmount, setAdjustAmount] = useState('1');

  const itemQuery = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => api.getItem(itemId),
  });

  const adjustMutation = useMutation({
    mutationFn: delta => api.adjustItemQuantity(itemId, {
      delta,
      reason: delta > 0 ? 'mobile_restock' : 'mobile_adjustment',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Stock updated');
      setAdjustAmount('1');
    },
    onError: err => {
      Alert.alert('Unable to adjust stock', err.message || 'Please try again.');
    },
  });

  if (itemQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading item details…" />
      </ScreenContainer>
    );
  }

  if (itemQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={itemQuery.error?.message || 'Unable to load item'} onRetry={itemQuery.refetch} />
      </ScreenContainer>
    );
  }

  const item = itemQuery.data;
  if (!item) {
    return (
      <ScreenContainer>
        <EmptyState message="Item not found." />
      </ScreenContainer>
    );
  }

  const imageUrl = resolveUploadUrl(item.imagePath);
  const filamentLabel = item.defaultFilament
    ? [item.defaultFilament.material, item.defaultFilament.color, item.defaultFilament.brand]
        .filter(Boolean)
        .join(' • ')
    : null;

  const handleEdit = () => {
    navigation.navigate('InventoryForm', { mode: 'edit', itemId });
  };

  const handleAdjust = () => {
    const delta = Number(adjustAmount);
    if (!Number.isInteger(delta) || delta === 0) {
      Alert.alert('Enter a non-zero whole number.');
      return;
    }
    adjustMutation.mutate(delta);
  };

  return (
    <ScreenContainer inset={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
      <SectionHeading
        title={item.name}
        action={<AppButton title="Edit" variant="secondary" onPress={handleEdit} />}
        style={{ marginBottom: spacing.md }}
      />
      <Card style={{ gap: spacing.md }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
        <Text style={styles.description}>{item.description || 'No description yet.'}</Text>
        <View style={styles.itemSummaryRow}>
          <SummaryTile label="Price" value={formatCurrency(item.price)} />
          <SummaryTile label="On hand" value={item.quantity} />
          <SummaryTile label="Sold" value={item.totalSold} />
        </View>
        <View style={styles.itemSummaryRow}>
          <SummaryTile label="Revenue" value={formatCurrency(item.totalRevenue)} />
          <SummaryTile label="Updated" value={formatDateTime(item.updatedAt)} small />
        </View>
        {item.tag ? <Badge label={item.tag} variant="info" /> : null}
        {filamentLabel ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.sectionLabel}>Default filament</Text>
            <Text style={styles.fieldValue}>{filamentLabel}</Text>
          </View>
        ) : null}
      </Card>

      <SectionHeading title="Adjust stock" style={{ marginTop: spacing.xl }} />
      <Card style={{ gap: spacing.md }}>
        <FormField
          label="Adjustment"
          value={adjustAmount}
          onChangeText={setAdjustAmount}
          keyboardType="number-pad"
          placeholder="Enter positive or negative quantity"
        />
        <Text style={styles.helper}>
          Positive numbers add stock (finished prints). Negative numbers remove stock for damages or losses.
        </Text>
        <AppButton
          title={adjustMutation.isLoading ? 'Updating…' : 'Apply adjustment'}
          onPress={handleAdjust}
          disabled={adjustMutation.isLoading}
        />
      </Card>
    </ScreenContainer>
  );
}

function SummaryTile({ label, value, small = false }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, small && styles.summaryValueSmall]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemSummaryRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryValueSmall: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
