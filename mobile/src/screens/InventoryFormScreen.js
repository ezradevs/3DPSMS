import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import SectionHeading from '../components/molecules/SectionHeading';
import FormField from '../components/molecules/FormField';
import AppButton from '../components/atoms/AppButton';
import Badge from '../components/atoms/Badge';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { api, resolveUploadUrl } from '../api/client';
import { buildItemFormData, guessMimeType } from '../shared/formData';
import { colors, spacing } from '../constants/theme';

const TAG_OPTIONS = ['Decor', 'Fidget Toy', 'Functional/Practical Item', 'Gimmick'];

export default function InventoryFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { mode, itemId } = route.params ?? { mode: 'create' };
  const isEdit = mode === 'edit' && itemId;

  const itemQuery = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => api.getItem(itemId),
    enabled: Boolean(isEdit),
  });

  const spoolsQuery = useQuery({ queryKey: ['filamentSpools'], queryFn: api.listFilamentSpools });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [quantity, setQuantity] = useState('0');
  const [selectedFilamentId, setSelectedFilamentId] = useState(null);
  const [tag, setTag] = useState('');
  const [imageAsset, setImageAsset] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (isEdit && itemQuery.data) {
      const item = itemQuery.data;
      setName(item.name ?? '');
      setDescription(item.description ?? '');
      setPrice(item.price != null ? String(item.price) : '0');
      setQuantity(item.quantity != null ? String(item.quantity) : '0');
      setSelectedFilamentId(item.defaultFilamentId ?? null);
      setTag(item.tag ?? '');
      setRemoveImage(false);
      setImageAsset(null);
    }
  }, [isEdit, itemQuery.data]);

  const createMutation = useMutation({
    mutationFn: payload => api.createItem(payload),
    onSuccess: item => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Item created');
      navigation.replace('InventoryDetail', { itemId: item.id });
    },
    onError: err => Alert.alert('Unable to create item', err.message || 'Please try again.'),
  });

  const updateMutation = useMutation({
    mutationFn: payload => api.updateItem(itemId, payload),
    onSuccess: item => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      Alert.alert('Item updated');
      navigation.goBack();
    },
    onError: err => Alert.alert('Unable to update item', err.message || 'Please try again.'),
  });

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  const selectedFilament = useMemo(() => {
    const spools = spoolsQuery.data ?? [];
    return spools.find(spool => spool.id === selectedFilamentId) || null;
  }, [selectedFilamentId, spoolsQuery.data]);

  const currentImage = useMemo(() => {
    if (imageAsset) return imageAsset.uri;
    if (isEdit && itemQuery.data?.imagePath && !removeImage) {
      return resolveUploadUrl(itemQuery.data.imagePath);
    }
    return null;
  }, [imageAsset, isEdit, itemQuery.data, removeImage]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to pick an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      const mime = asset.mimeType || guessMimeType(asset.uri);
      setImageAsset({
        uri: asset.uri,
        name: asset.fileName || `item-${Date.now()}.jpg`,
        type: mime,
      });
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageAsset(null);
    setRemoveImage(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Name is required');
      return;
    }

    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      Alert.alert('Enter a valid price');
      return;
    }

    const quantityValue = Number(quantity);
    if (!Number.isInteger(quantityValue) || quantityValue < 0) {
      Alert.alert('Quantity must be zero or a positive whole number');
      return;
    }

    const payloadBase = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceValue,
      quantity: quantityValue,
      defaultFilamentId: selectedFilamentId != null ? selectedFilamentId : '',
      tag: tag || undefined,
      removeImage: removeImage ? 'true' : undefined,
    };

    const shouldUseFormData = Boolean(imageAsset) || removeImage;
    const payload = shouldUseFormData
      ? buildItemFormData({ ...payloadBase, image: imageAsset, removeImage })
      : payloadBase;

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && itemQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading item…" />
      </ScreenContainer>
    );
  }

  if (isEdit && itemQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={itemQuery.error?.message || 'Unable to load item'} onRetry={itemQuery.refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingTop: spacing.lg }}>
      <SectionHeading title={isEdit ? 'Edit Item' : 'Add Item'} />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.imageWrapper}>
          {currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}
          <View style={styles.imageActions}>
            <AppButton title="Choose photo" variant="secondary" onPress={handlePickImage} />
            {currentImage ? (
              <AppButton title="Remove" variant="ghost" onPress={handleRemoveImage} />
            ) : null}
          </View>
        </View>

        <View style={styles.formSectionSpacing}>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="Item name" />
        </View>
        <FormField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the item"
          multiline
        />
        <View style={styles.formRow}>
          <FormField
            label="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <FormField
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
        </View>

        <View style={[{ gap: spacing.sm }, styles.formSectionSpacing]}>
          <Text style={styles.label}>Default filament</Text>
          {spoolsQuery.isLoading ? (
            <Text style={styles.helper}>Loading filament spools…</Text>
          ) : (
            <ScrollChips
              data={spoolsQuery.data ?? []}
              keyExtractor={spool => String(spool.id)}
              selectedId={selectedFilamentId}
              onSelect={setSelectedFilamentId}
              renderLabel={spool => [spool.material, spool.color, spool.brand].filter(Boolean).join(' • ') || `Spool #${spool.id}`}
              emptyLabel="No filament spools yet"
            />
          )}
          {selectedFilament ? (
            <Text style={styles.helper}>
              Remaining {selectedFilament.remainingGrams}g of {selectedFilament.weightGrams}g initial • {selectedFilament.owner || 'Shared'}
            </Text>
          ) : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.tagGrid}>
            {TAG_OPTIONS.map(option => (
              <AppButton
                key={option}
                title={option}
                variant={tag === option ? 'primary' : 'secondary'}
                onPress={() => setTag(option === tag ? '' : option)}
                style={styles.tagChip}
                textStyle={{ fontSize: 12 }}
              />
            ))}
          </View>
        </View>

        <View style={styles.actionFooter}>
          <AppButton
            title={isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
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

function ScrollChips({ data, keyExtractor, renderLabel, selectedId, onSelect, emptyLabel }) {
  if (!data.length) {
    return <Text style={styles.helper}>{emptyLabel}</Text>;
  }
  return (
    <View style={styles.chipRow}>
      <AppButton
        title="None"
        variant={selectedId == null ? 'primary' : 'secondary'}
        onPress={() => onSelect(null)}
        style={styles.tagChip}
        textStyle={{ fontSize: 12 }}
      />
      {data.map(item => (
        <AppButton
          key={keyExtractor(item)}
          title={renderLabel(item)}
          variant={selectedId === item.id ? 'primary' : 'secondary'}
          onPress={() => onSelect(item.id)}
          style={styles.tagChip}
          textStyle={{ fontSize: 12 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    gap: spacing.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
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
  imageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    minWidth: 100,
  },
  formSectionSpacing: {
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
