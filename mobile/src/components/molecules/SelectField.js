import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radii, spacing } from '../../constants/theme';

export default function SelectField({
  label,
  placeholder = 'Select',
  options = [],
  selectedValue,
  onSelect,
  renderOption,
  helper,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  const normalizedOptions = useMemo(() => {
    return (options ?? [])
      .filter(Boolean)
      .map(option => (typeof option === 'string'
        ? { label: option, value: option }
        : option))
      .filter(option => option && option.value !== undefined && option.value !== null);
  }, [options]);

  const selectedOption = useMemo(
    () => normalizedOptions.find(option => option.value === selectedValue) || null,
    [normalizedOptions, selectedValue],
  );

  const displayLabel = selectedOption?.label || placeholder;

  const handleOpen = () => {
    if (disabled) return;
    setVisible(true);
  };

  const handleSelect = option => {
    setVisible(false);
    if (option?.value === selectedValue) return;
    onSelect?.(option);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.input,
          disabled && styles.disabled,
          pressed && !disabled ? styles.pressed : null,
        ]}
        onPress={handleOpen}
      >
        <Text
          style={[styles.value, !selectedOption && styles.placeholder]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}

      <Modal
        visible={visible}
        transparent
        animationType={Platform.select({ ios: 'fade', default: 'slide' })}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || 'Select'}</Text>
              <Pressable onPress={() => setVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={normalizedOptions}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => {
                if (!item) return null;
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.optionContent}>
                      {renderOption ? (
                        renderOption(item, { isSelected })
                      ) : (
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      )}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={(
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No options available.</Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  input: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pressed: {
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionContent: {
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.xs / 2,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text,
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
  optionSelected: {
    backgroundColor: colors.surfaceSubtle,
  },
  optionPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
