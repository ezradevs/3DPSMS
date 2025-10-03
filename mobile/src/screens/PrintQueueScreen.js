import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import AppButton from '../components/atoms/AppButton';
import ListRow from '../components/molecules/ListRow';
import Badge from '../components/atoms/Badge';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import EmptyState from '../components/molecules/EmptyState';
import { api } from '../api/client';
import { formatDate } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'printing', label: 'Printing' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_VARIANTS = {
  queued: 'info',
  printing: 'warning',
  paused: 'default',
  completed: 'success',
  cancelled: 'danger',
};

export default function PrintQueueScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const jobsQuery = useQuery({
    queryKey: ['printQueue', statusFilter, assigneeFilter],
    queryFn: () => api.listPrintJobs({
      status: statusFilter || undefined,
      assignee: assigneeFilter || undefined,
    }),
  });

  const jobs = jobsQuery.data ?? [];

  const assignees = useMemo(() => {
    const set = new Set();
    jobs.forEach(job => {
      if (job.assignee) set.add(job.assignee);
    });
    return Array.from(set.values());
  }, [jobs]);

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['printQueue'] });
    return jobsQuery.refetch();
  };

  if (jobsQuery.isLoading || jobsQuery.isRefetching) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading print queue…" />
      </ScreenContainer>
    );
  }

  if (jobsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={jobsQuery.error?.message || 'Unable to load print queue'} onRetry={onRefresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={jobsQuery.isRefetching} contentContainerStyle={{ paddingTop: spacing.lg }}>
      <Text style={styles.title}>Print Queue</Text>
      <Text style={styles.subtitle}>{jobs.length} jobs</Text>

      <Card style={[styles.filterCard, { gap: spacing.md }]}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterRow}>
            {STATUS_OPTIONS.map(option => (
              <AppButton
                key={option.label}
                title={option.label}
                variant={statusFilter === option.value ? 'primary' : 'secondary'}
                onPress={() => setStatusFilter(option.value)}
                style={styles.filterChip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Assignee</Text>
          <View style={styles.filterRow}>
            <AppButton
              title="All"
              variant={assigneeFilter === '' ? 'primary' : 'secondary'}
              onPress={() => setAssigneeFilter('')}
              style={styles.filterChip}
              textStyle={{ fontSize: 12 }}
            />
            {assignees.map(name => (
              <AppButton
                key={name}
                title={name}
                variant={assigneeFilter === name ? 'primary' : 'secondary'}
                onPress={() => setAssigneeFilter(name)}
                style={styles.filterChip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>
      </Card>

      <SectionHeading
        title="Queue"
        action={<AppButton title="Add Job" onPress={() => navigation.navigate('PrintQueueForm', { mode: 'create' })} />}
      />

      <Card>
        {jobs.length ? (
          jobs.map(job => (
            <ListRow
              key={job.id}
              title={job.itemName}
              subtitle={job.notes || 'No notes yet.'}
              meta={
                <View style={styles.rowMeta}>
                  <Badge label={job.status.toUpperCase()} variant={STATUS_VARIANTS[job.status] || 'default'} />
                  {job.dueDate ? <Text style={styles.metaText}>Due {formatDate(job.dueDate)}</Text> : null}
                  {job.priority != null ? <Text style={styles.metaText}>Priority {job.priority}</Text> : null}
                  {job.filament ? (
                    <Text style={styles.metaText}>
                      Filament: {[job.filament.material, job.filament.color].filter(Boolean).join(' ')}
                    </Text>
                  ) : null}
                </View>
              }
              onPress={() => navigation.navigate('PrintQueueForm', { mode: 'edit', job })}
            >
              {job.assignee ? <Text style={styles.metaText}>Assigned to {job.assignee}</Text> : null}
            </ListRow>
          ))
        ) : (
          <EmptyState message={statusFilter || assigneeFilter ? 'No jobs match your filters.' : 'Queue is empty.'} />
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
  filterGroup: {
    gap: spacing.sm,
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
  filterChip: {
    minWidth: 90,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  filterCard: {
    marginBottom: spacing.md,
  },
});
