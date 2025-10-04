import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import SectionHeading from '../components/molecules/SectionHeading';
import FormField from '../components/molecules/FormField';
import DatePickerField from '../components/molecules/DatePickerField';
import AppButton from '../components/atoms/AppButton';
import Badge from '../components/atoms/Badge';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api, resolveUploadUrl } from '../api/client';
import { colors, spacing } from '../constants/theme';

const STATUS_OPTIONS = ['queued', 'printing', 'paused', 'completed', 'cancelled'];
const ASSIGNEE_OPTIONS = ['Ezra', 'Dylan', 'Both'];

export default function PrintQueueFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { mode, job } = route.params ?? { mode: 'create' };
  const isEdit = mode === 'edit' && job;

  const spoolsQuery = useQuery({ queryKey: ['filamentSpools'], queryFn: api.listFilamentSpools });

  const [itemName, setItemName] = useState('');
  const [filamentSpoolId, setFilamentSpoolId] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [assignee, setAssignee] = useState(null);
  const [notes, setNotes] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [status, setStatus] = useState('queued');
  const [priority, setPriority] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [removeModelFile, setRemoveModelFile] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setItemName(job.itemName || '');
      setFilamentSpoolId(job.filamentSpoolId ?? null);
      setQuantity(job.quantity != null ? String(job.quantity) : '1');
      setAssignee(job.assignee ? job.assignee : null);
      setNotes(job.notes || '');
      setModelUrl(job.modelUrl || '');
      setStatus(job.status || 'queued');
      setPriority(job.priority != null ? String(job.priority) : '0');
      setDueDate(job.dueDate ? job.dueDate.slice(0, 10) : '');
      setRemoveModelFile(false);
    }
  }, [isEdit, job]);

  const createMutation = useMutation({
    mutationFn: payload => api.createPrintJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printQueue'] });
      Alert.alert('Print job created');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to create job', err.message || 'Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: payload => api.updatePrintJob(job.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printQueue'] });
      Alert.alert('Print job updated');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to update job', err.message || 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePrintJob(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printQueue'] });
      Alert.alert('Print job deleted');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to delete job', err.message || 'Please try again.'),
  });

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading;

  const spools = spoolsQuery.data ?? [];

  const currentModelFile = useMemo(() => {
    if (isEdit && job.modelFilePath && !removeModelFile) {
      return resolveUploadUrl(job.modelFilePath);
    }
    return null;
  }, [isEdit, job, removeModelFile]);

  const handleSubmit = () => {
    if (!itemName.trim()) {
      Alert.alert('Item name is required');
      return;
    }

    const quantityValue = Number(quantity);
    if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
      Alert.alert('Quantity must be a positive whole number');
      return;
    }

    const priorityValue = priority !== '' ? Number(priority) : 0;
    if (!Number.isFinite(priorityValue)) {
      Alert.alert('Priority must be numeric');
      return;
    }

    const payload = {
      itemName: itemName.trim(),
      filamentSpoolId: filamentSpoolId != null ? filamentSpoolId : '',
      quantity: quantityValue,
      assignee: assignee || undefined,
      notes: notes.trim() || undefined,
      modelUrl: modelUrl.trim() || undefined,
      status,
      priority: priorityValue,
      dueDate: dueDate || undefined,
      ...(removeModelFile ? { modelFilePath: null } : {}),
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete job',
      'This will permanently remove the print queue job.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  if (spoolsQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading filament spools…" />
      </ScreenContainer>
    );
  }

  if (spoolsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={spoolsQuery.error?.message || 'Unable to load filament spools'} onRetry={spoolsQuery.refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={{ paddingTop: spacing.lg }}>
      <SectionHeading title={isEdit ? 'Edit Print Job' : 'New Print Job'} />
      <Card style={{ gap: spacing.md }}>
        <FormField label="Item name" value={itemName} onChangeText={setItemName} placeholder="e.g. articulated dragon" />
        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
          <Text style={styles.label}>Filament</Text>
          <View style={styles.chipRow}>
            <AppButton
              title="None"
              variant={filamentSpoolId == null ? 'primary' : 'secondary'}
              onPress={() => setFilamentSpoolId(null)}
              style={styles.chip}
              textStyle={{ fontSize: 12 }}
            />
            {spools.map(spool => (
              <AppButton
                key={spool.id}
                title={[spool.material, spool.color].filter(Boolean).join(' • ') || `Spool #${spool.id}`}
                variant={filamentSpoolId === spool.id ? 'primary' : 'secondary'}
                onPress={() => setFilamentSpoolId(spool.id)}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        <View style={[styles.formRow, styles.sectionSpacing]}>
          <FormField
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
          <FormField
            label="Priority"
            value={priority}
            onChangeText={setPriority}
            keyboardType="number-pad"
          />
        </View>
        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
          <Text style={styles.label}>Assignee</Text>
          <View style={styles.chipRow}>
            {ASSIGNEE_OPTIONS.map(option => (
              <AppButton
                key={option}
                title={option}
                variant={assignee === option ? 'primary' : 'secondary'}
                onPress={() => setAssignee(prev => (prev === option ? null : option))}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Settings, color swaps, warnings…" />
        <FormField label="Model link" value={modelUrl} onChangeText={setModelUrl} placeholder="https://" />
        <DatePickerField label="Due date" value={dueDate} onChange={setDueDate} allowClear />

        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map(option => (
              <AppButton
                key={option}
                title={option.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                variant={status === option ? 'primary' : 'secondary'}
                onPress={() => setStatus(option)}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        {currentModelFile ? (
          <View style={[{ gap: spacing.xs }, styles.sectionSpacing]}>
            <Text style={styles.label}>Attached model</Text>
            <View style={styles.linkRow}>
              <Badge label="Existing file" variant="info" />
              <AppButton
                title="Open"
                variant="ghost"
                onPress={() => Linking.openURL(currentModelFile)}
              />
              <AppButton
                title={removeModelFile ? 'Keeping' : 'Remove'}
                variant={removeModelFile ? 'secondary' : 'ghost'}
                onPress={() => setRemoveModelFile(prev => !prev)}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.actionFooter}>
          <AppButton
            title={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create job'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
          {isEdit ? (
            <AppButton
              title="Delete job"
              variant="danger"
              onPress={handleDelete}
              disabled={isSubmitting}
            />
          ) : null}
          <AppButton title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 120,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  actionFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
});
