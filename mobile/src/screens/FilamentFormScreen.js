import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import FormField from '../components/molecules/FormField';
import AppButton from '../components/atoms/AppButton';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api } from '../api/client';
import { colors, spacing } from '../constants/theme';

const DRYNESS_OPTIONS = ['vacuum', 'sealed', 'open'];

export default function FilamentFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { mode, spoolId } = route.params ?? { mode: 'create' };
  const isEdit = mode === 'edit' && spoolId;

  const spoolQuery = useQuery({
    queryKey: ['filamentSpool', spoolId],
    queryFn: () => api.getFilamentSpool(spoolId),
    enabled: Boolean(isEdit),
  });

  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [owner, setOwner] = useState('');
  const [dryness, setDryness] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [remainingGrams, setRemainingGrams] = useState('');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isEdit && spoolQuery.data) {
      const spool = spoolQuery.data;
      setMaterial(spool.material || '');
      setColor(spool.color || '');
      setBrand(spool.brand || '');
      setOwner(spool.owner || '');
      setDryness(spool.dryness || '');
      setWeightGrams(spool.weightGrams != null ? String(spool.weightGrams) : '');
      setRemainingGrams(spool.remainingGrams != null ? String(spool.remainingGrams) : '');
      setCost(spool.cost != null ? String(spool.cost) : '');
      setPurchaseDate(spool.purchaseDate ? spool.purchaseDate.slice(0, 10) : '');
      setNotes(spool.notes || '');
    }
  }, [isEdit, spoolQuery.data]);

  const createMutation = useMutation({
    mutationFn: payload => api.createFilamentSpool(payload),
    onSuccess: spool => {
      queryClient.invalidateQueries({ queryKey: ['filamentSpools'] });
      Alert.alert('Spool created');
      navigation.replace('FilamentDetail', { spoolId: spool.id });
    },
    onError: err => Alert.alert('Unable to create spool', err.message || 'Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: payload => api.updateFilamentSpool(spoolId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentSpools'] });
      queryClient.invalidateQueries({ queryKey: ['filamentSpool', spoolId] });
      Alert.alert('Spool updated');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to update spool', err.message || 'Please try again.'),
  });

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  const handleSubmit = () => {
    if (!material.trim()) {
      Alert.alert('Material is required');
      return;
    }

    const payload = {
      material: material.trim(),
      color: color.trim() || undefined,
      brand: brand.trim() || undefined,
      owner: owner.trim() || undefined,
      dryness: dryness || undefined,
      weightGrams: weightGrams !== '' ? Number(weightGrams) : null,
      remainingGrams: remainingGrams !== '' ? Number(remainingGrams) : null,
      cost: cost !== '' ? Number(cost) : null,
      purchaseDate: purchaseDate || undefined,
      notes: notes.trim() || undefined,
    };

    if (payload.weightGrams != null && !Number.isFinite(payload.weightGrams)) {
      Alert.alert('Weight must be a number');
      return;
    }
    if (payload.remainingGrams != null && !Number.isFinite(payload.remainingGrams)) {
      Alert.alert('Remaining grams must be a number');
      return;
    }
    if (payload.cost != null && !Number.isFinite(payload.cost)) {
      Alert.alert('Cost must be a number');
      return;
    }

    if (payload.remainingGrams != null && payload.weightGrams != null && payload.remainingGrams > payload.weightGrams) {
      Alert.alert('Remaining grams cannot exceed the total weight.');
      return;
    }

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && spoolQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading spool…" />
      </ScreenContainer>
    );
  }

  if (isEdit && spoolQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={spoolQuery.error?.message || 'Unable to load spool'} onRetry={spoolQuery.refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeading title={isEdit ? 'Edit Spool' : 'New Filament Spool'} />
      <Card style={{ gap: spacing.md }}>
        <FormField label="Material" value={material} onChangeText={setMaterial} placeholder="PLA, PETG…" />
        <FormField label="Color" value={color} onChangeText={setColor} placeholder="Nebula Purple" />
        <FormField label="Brand" value={brand} onChangeText={setBrand} placeholder="eSUN" />
        <FormField label="Owner" value={owner} onChangeText={setOwner} placeholder="Ezra" />

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Dryness</Text>
          <View style={styles.chipRow}>
            {DRYNESS_OPTIONS.map(option => (
              <AppButton
                key={option}
                title={option.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                variant={dryness === option ? 'primary' : 'secondary'}
                onPress={() => setDryness(option)}
                style={styles.chip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
            <AppButton
              title="None"
              variant={dryness === '' ? 'primary' : 'secondary'}
              onPress={() => setDryness('')}
              style={styles.chip}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <FormField
            label="Weight (g)"
            value={weightGrams}
            onChangeText={setWeightGrams}
            keyboardType="numeric"
          />
          <FormField
            label="Remaining (g)"
            value={remainingGrams}
            onChangeText={setRemainingGrams}
            keyboardType="numeric"
          />
        </View>
        <FormField
          label="Cost"
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <FormField
          label="Purchase Date"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
        />
        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Preferred settings, humidity, etc."
        />

        <AppButton
          title={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create spool'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
        <AppButton title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
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
    minWidth: 110,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
