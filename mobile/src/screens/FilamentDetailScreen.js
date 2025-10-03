import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import FormField from '../components/molecules/FormField';
import AppButton from '../components/atoms/AppButton';
import Badge from '../components/atoms/Badge';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import EmptyState from '../components/molecules/EmptyState';
import ListRow from '../components/molecules/ListRow';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

export default function FilamentDetailScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const spoolId = params?.spoolId;
  const [usedGrams, setUsedGrams] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  const spoolQuery = useQuery({
    queryKey: ['filamentSpool', spoolId],
    queryFn: () => api.getFilamentSpool(spoolId),
    enabled: Boolean(spoolId),
  });

  const usageQuery = useQuery({
    queryKey: ['filamentUsage', spoolId],
    queryFn: () => api.listFilamentUsage(spoolId),
    enabled: Boolean(spoolId),
  });

  const logUsageMutation = useMutation({
    mutationFn: body => api.logFilamentUsage(spoolId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentSpool', spoolId] });
      queryClient.invalidateQueries({ queryKey: ['filamentSpools'] });
      queryClient.invalidateQueries({ queryKey: ['filamentUsage', spoolId] });
      Alert.alert('Usage logged');
      setUsedGrams('');
      setReason('');
      setReference('');
    },
    onError: err => Alert.alert('Unable to log usage', err.message || 'Please try again.'),
  });

  if (spoolQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading spool…" />
      </ScreenContainer>
    );
  }

  if (spoolQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={spoolQuery.error?.message || 'Unable to load spool'} onRetry={spoolQuery.refetch} />
      </ScreenContainer>
    );
  }

  const spool = spoolQuery.data;
  if (!spool) {
    return (
      <ScreenContainer>
        <EmptyState message="Spool not found." />
      </ScreenContainer>
    );
  }

  const handleLogUsage = () => {
    const grams = Number(usedGrams);
    if (!Number.isFinite(grams) || grams <= 0) {
      Alert.alert('Enter how many grams were used.');
      return;
    }
    logUsageMutation.mutate({
      usedGrams: grams,
      reason: reason || undefined,
      reference: reference || undefined,
    });
  };

  return (
    <ScreenContainer>
      <SectionHeading
        title={[spool.material, spool.color, spool.brand].filter(Boolean).join(' • ') || `Spool #${spool.id}`}
        action={<AppButton title="Edit" variant="secondary" onPress={() => navigation.navigate('FilamentForm', { mode: 'edit', spoolId })} />}
      />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.summaryRow}>
          <SummaryTile label="Remaining" value={`${spool.remainingGrams}g`} />
          <SummaryTile label="Weight" value={`${spool.weightGrams}g`} />
          <SummaryTile label="Uses" value={spool.usageCount} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryTile label="Cost" value={spool.cost != null ? formatCurrency(spool.cost) : '—'} />
          <SummaryTile label="Owner" value={spool.owner || 'Shared'} />
          <SummaryTile label="Dryness" value={spool.dryness || 'Unknown'} />
        </View>
        {spool.notes ? (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{spool.notes}</Text>
          </View>
        ) : null}
        {spool.purchaseDate ? (
          <Text style={styles.helper}>Purchased {formatDate(spool.purchaseDate)}</Text>
        ) : null}
      </Card>

      <SectionHeading title="Log usage" />
      <Card style={{ gap: spacing.md }}>
        <FormField
          label="Used grams"
          value={usedGrams}
          onChangeText={setUsedGrams}
          keyboardType="decimal-pad"
          placeholder="e.g. 18"
        />
        <FormField label="Reason" value={reason} onChangeText={setReason} placeholder="Print job, purge, failed print…" />
        <FormField label="Reference" value={reference} onChangeText={setReference} placeholder="Order, queue job, etc." />
        <AppButton
          title={logUsageMutation.isLoading ? 'Logging…' : 'Log usage'}
          onPress={handleLogUsage}
          disabled={logUsageMutation.isLoading}
        />
      </Card>

      <SectionHeading title="Usage history" />
      <Card>
        {usageQuery.isLoading ? (
          <LoadingState message="Loading usage…" />
        ) : usageQuery.isError ? (
          <ErrorState message={usageQuery.error?.message || 'Unable to load usage'} onRetry={usageQuery.refetch} />
        ) : usageQuery.data?.length ? (
          usageQuery.data.map(entry => (
            <ListRow
              key={entry.id}
              title={`${entry.usedGrams}g used`}
              subtitle={entry.reason || '—'}
              meta={<Text style={styles.helper}>{formatDate(entry.createdAt)}</Text>}
            >
              {entry.reference ? <Text style={styles.value}>Reference: {entry.reference}</Text> : null}
            </ListRow>
          ))
        ) : (
          <EmptyState message="No usage logged yet." />
        )}
      </Card>
    </ScreenContainer>
  );
}

function SummaryTile({ label, value }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    gap: spacing.xs,
  },
  value: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
