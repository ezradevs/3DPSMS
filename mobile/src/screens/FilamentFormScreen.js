import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import FormField from '../components/molecules/FormField';
import DatePickerField from '../components/molecules/DatePickerField';
import AppButton from '../components/atoms/AppButton';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import SelectField from '../components/molecules/SelectField';
import { api } from '../api/client';
import { colors, spacing } from '../constants/theme';

const DRYNESS_OPTIONS = ['vacuum', 'sealed', 'open'];
const CUSTOM_OPTION = '__custom__';

const MATERIAL_OPTIONS = [
  'PLA',
  'PLA-CF',
  'PLA Matte',
  'PLA+',
  'PLA-Lite',
  'PLA Silk',
  'PLA Galaxy',
  'PETG',
  'TPU',
  CUSTOM_OPTION,
].map(option => ({
  label: option === CUSTOM_OPTION ? 'Custom' : option,
  value: option === CUSTOM_OPTION ? CUSTOM_OPTION : option,
}));

const COLOR_OPTIONS = [
  { label: 'None', value: '' },
  'Black',
  'White',
  'Gray',
  'Clear',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Orange',
  'Pink',
  'Silver',
  'Gold',
  'Copper',
  'Rainbow',
  CUSTOM_OPTION,
].map(option => (typeof option === 'string'
  ? { label: option === CUSTOM_OPTION ? 'Custom' : option, value: option === CUSTOM_OPTION ? CUSTOM_OPTION : option }
  : option));

const BRAND_OPTIONS = [
  'Bambu Lab',
  'Polymaker',
  'eSUN',
  'Sunlu',
  'Overture',
  'Prusament',
  'Creality',
  CUSTOM_OPTION,
].map(option => (typeof option === 'string'
  ? { label: option === CUSTOM_OPTION ? 'Custom' : option, value: option === CUSTOM_OPTION ? CUSTOM_OPTION : option }
  : option));

const OWNER_OPTIONS = [
  { label: 'Ezra', value: 'Ezra' },
  { label: 'Dylan', value: 'Dylan' },
  { label: 'Shared', value: 'Shared' },
  { label: 'Custom', value: CUSTOM_OPTION },
];

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
  const [materialCustom, setMaterialCustom] = useState('');
  const [color, setColor] = useState('');
  const [colorCustom, setColorCustom] = useState('');
  const [brand, setBrand] = useState('');
  const [brandCustom, setBrandCustom] = useState('');
  const [owner, setOwner] = useState('');
  const [ownerCustom, setOwnerCustom] = useState('');
  const [dryness, setDryness] = useState(null);
  const [weightGrams, setWeightGrams] = useState('');
  const [remainingGrams, setRemainingGrams] = useState('');
  const [cost, setCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  const applyInitialOption = (value, options, setOption, setCustom) => {
    if (!value) {
      setOption('');
      setCustom('');
      return;
    }
    const match = options.find(opt => opt.value && opt.value !== CUSTOM_OPTION && opt.value.toLowerCase() === value.toLowerCase());
    if (match) {
      setOption(match.value);
      setCustom('');
    } else {
      setOption(CUSTOM_OPTION);
      setCustom(value);
    }
  };

  useEffect(() => {
    if (isEdit && spoolQuery.data) {
      const spool = spoolQuery.data;
      applyInitialOption(spool.material || '', MATERIAL_OPTIONS, setMaterial, setMaterialCustom);
      applyInitialOption(spool.color || '', COLOR_OPTIONS, setColor, setColorCustom);
      applyInitialOption(spool.brand || '', BRAND_OPTIONS, setBrand, setBrandCustom);
      applyInitialOption(spool.owner || '', OWNER_OPTIONS, setOwner, setOwnerCustom);
      setDryness(spool.dryness ?? null);
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
    const resolvedMaterial = material === CUSTOM_OPTION ? materialCustom.trim() : material.trim();
    const resolvedColor = color === CUSTOM_OPTION ? colorCustom.trim() : color.trim();
    const resolvedBrand = brand === CUSTOM_OPTION ? brandCustom.trim() : brand.trim();
    const resolvedOwner = owner === CUSTOM_OPTION ? ownerCustom.trim() : owner.trim();

    if (!resolvedMaterial) {
      Alert.alert('Material is required');
      return;
    }

    const payload = {
      material: resolvedMaterial,
      color: resolvedColor ? resolvedColor : undefined,
      brand: resolvedBrand ? resolvedBrand : undefined,
      owner: resolvedOwner ? resolvedOwner : undefined,
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
    <ScreenContainer contentContainerStyle={{ paddingTop: spacing.lg }}>
      <SectionHeading title={isEdit ? 'Edit Spool' : 'New Filament Spool'} />
      <Card style={{ gap: spacing.md }}>
        <SelectField
          label="Material"
          placeholder="Select material"
          options={MATERIAL_OPTIONS}
          selectedValue={material}
          onSelect={option => {
            setMaterial(option.value);
            if (option.value !== CUSTOM_OPTION) setMaterialCustom('');
          }}
        />
        {material === CUSTOM_OPTION ? (
          <FormField
            label="Custom material"
            value={materialCustom}
            onChangeText={setMaterialCustom}
            placeholder="PLA, PETG…"
          />
        ) : null}

        <SelectField
          label="Color"
          placeholder="Select color"
          options={COLOR_OPTIONS}
          selectedValue={color}
          onSelect={option => {
            setColor(option.value);
            if (option.value !== CUSTOM_OPTION) setColorCustom('');
          }}
        />
        {color === CUSTOM_OPTION ? (
          <FormField
            label="Custom color"
            value={colorCustom}
            onChangeText={setColorCustom}
            placeholder="Nebula Purple"
          />
        ) : null}

        <View style={styles.brandSection}>
          <Text style={[styles.label, styles.brandLabelSpacing]}>Brand</Text>
          <OptionChips
            label={null}
            options={BRAND_OPTIONS}
            value={brand}
            onSelect={value => {
              setBrand(value);
              if (value !== CUSTOM_OPTION) setBrandCustom('');
            }}
          />
          {brand === CUSTOM_OPTION ? (
            <FormField
              label="Custom brand"
              value={brandCustom}
              onChangeText={setBrandCustom}
              placeholder="eSUN"
              style={styles.customFieldSpacing}
            />
          ) : null}
        </View>

        <View style={styles.ownerSection}>
          <Text style={[styles.label, styles.ownerLabelSpacing]}>Owner</Text>
          <OptionChips
            label={null}
            options={OWNER_OPTIONS}
            value={owner}
            onSelect={value => {
              setOwner(value);
              if (value !== CUSTOM_OPTION) setOwnerCustom('');
            }}
          />
          {owner === CUSTOM_OPTION ? (
            <FormField
              label="Custom owner"
              value={ownerCustom}
              onChangeText={setOwnerCustom}
              placeholder="Ezra"
              style={styles.customFieldSpacing}
            />
          ) : null}
        </View>

        <View style={[{ gap: spacing.sm }, styles.sectionSpacing]}>
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

        <View style={[styles.formRow, styles.weightRow]}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Weight (g)"
              value={weightGrams}
              onChangeText={setWeightGrams}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Remaining (g)"
              value={remainingGrams}
              onChangeText={setRemainingGrams}
              keyboardType="numeric"
            />
          </View>
        </View>
        <FormField
          label="Cost"
          value={cost}
          onChangeText={setCost}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <DatePickerField
          label="Purchase Date"
          value={purchaseDate}
          onChange={setPurchaseDate}
          allowClear
          style={styles.fieldWithSpacing}
        />

        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Preferred settings, humidity, etc."
          style={styles.fieldWithSpacing}
        />

        <View style={styles.actionFooter}>
          <AppButton
            title={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create spool'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
          <AppButton
            title="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}

function OptionChips({ label, options, value, onSelect }) {
  return (
    <View style={styles.optionGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chipRow}>
        {options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <AppButton
              key={optionValue}
              title={optionLabel}
              onPress={() => onSelect(optionValue)}
              variant={value === optionValue ? 'primary' : 'secondary'}
              style={styles.chip}
              textStyle={{ fontSize: 12 }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionGroup: {
    gap: spacing.xs,
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
  weightRow: {
    marginTop: spacing.md,
  },
  fieldWithSpacing: {
    marginTop: spacing.md,
  },
  customFieldSpacing: {
    marginTop: spacing.md + spacing.xs,
  },
  actionFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  brandSection: {
    marginTop: spacing.sm,
  },
  ownerSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  brandLabelSpacing: {
    marginBottom: spacing.sm,
  },
  ownerLabelSpacing: {
    marginBottom: spacing.sm,
  },
  sectionSpacing: {
    marginTop: spacing.xs / 3,
  },
});
