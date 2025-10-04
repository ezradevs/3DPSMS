import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import ListRow from '../components/molecules/ListRow';
import Badge from '../components/atoms/Badge';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import EmptyState from '../components/molecules/EmptyState';
import AppButton from '../components/atoms/AppButton';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

export default function FilamentScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const spoolsQuery = useQuery({ queryKey: ['filamentSpools'], queryFn: api.listFilamentSpools });

  const deleteSpoolMutation = useMutation({
    mutationFn: spoolId => api.deleteFilamentSpool(spoolId),
    onSuccess: (_data, spoolId) => {
      queryClient.invalidateQueries({ queryKey: ['filamentSpools'] });
      queryClient.invalidateQueries({ queryKey: ['filamentSpool', spoolId] });
      Alert.alert('Spool deleted');
    },
    onError: err => Alert.alert('Unable to delete spool', err?.message || 'Please try again.'),
  });

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['filamentSpools'] });
    return spoolsQuery.refetch();
  };

  const spools = useMemo(() => {
    const data = spoolsQuery.data ?? [];
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(spool =>
      [spool.material, spool.color, spool.brand, spool.owner]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term))
    );
  }, [spoolsQuery.data, search]);

  if (spoolsQuery.isLoading || spoolsQuery.isRefetching) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading filament spools…" />
      </ScreenContainer>
    );
  }

  if (spoolsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={spoolsQuery.error?.message || 'Unable to load spools'} onRetry={onRefresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={spoolsQuery.isRefetching} contentContainerStyle={{ paddingTop: spacing.lg }}>
      <Text style={styles.title}>Filament</Text>
      <Text style={styles.subtitle}>{spoolsQuery.data?.length ?? 0} spools</Text>

      <Card style={[styles.filterCard, { gap: spacing.md }]}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by material, color, brand, owner…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </Card>

      <SectionHeading
        title="Spools"
        action={<AppButton title="Add Spool" onPress={() => navigation.navigate('FilamentForm', { mode: 'create' })} />}
        style={{ marginBottom: spacing.md }}
      />

      <Card>
        {spools.length ? (
          spools.map((spool, index) => (
            <ListRow
              key={spool.id}
              title={[spool.material, spool.color, spool.brand].filter(Boolean).join(' • ') || `Spool #${spool.id}`}
              subtitle={spool.owner ? `Owner: ${spool.owner}` : 'Shared'}
              onPress={() => navigation.navigate('FilamentDetail', { spoolId: spool.id })}
              onLongPress={() => {
                Alert.alert(
                  'Delete spool',
                  `Remove ${[spool.material, spool.color, spool.brand].filter(Boolean).join(' • ') || 'this spool'}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: deleteSpoolMutation.isLoading ? 'Deleting…' : 'Delete',
                      style: 'destructive',
                      onPress: () => deleteSpoolMutation.mutate(spool.id),
                    },
                  ],
                );
              }}
              meta={(
                <View style={styles.meta}>
                  <Text style={styles.metaText}>
                    Remaining {spool.remainingGrams}g / {spool.weightGrams}g
                  </Text>
                  {spool.cost != null ? (
                    <Text style={styles.metaText}>{formatCurrency(spool.cost)}</Text>
                  ) : null}
                  {spool.usageCount ? (
                    <Badge label={`${spool.usageCount} uses`} variant="info" />
                  ) : null}
                </View>
              )}
              showDivider={index !== spools.length - 1}
            >
              {spool.notes ? <Text style={styles.note}>{spool.notes}</Text> : null}
            </ListRow>
          ))
        ) : (
          <EmptyState message={search ? 'No spools match your search.' : 'No filament spools yet.'} />
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
  meta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
  },
  filterCard: {
    marginBottom: spacing.md,
  },
});
