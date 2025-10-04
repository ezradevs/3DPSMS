import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import dayjs from 'dayjs';

import { colors, radii, spacing } from '../../constants/theme';

const DISPLAY_FORMAT = 'MMM D, YYYY';
const VALUE_FORMAT = 'YYYY-MM-DD';
const INLINE_CARD_WIDTH = 332;

function toDate(value) {
  if (!value) return new Date();
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : new Date();
}

export default function DatePickerField({
  label,
  value,
  onChange,
  helper,
  minimumDate,
  maximumDate,
  placeholder = 'Select date',
  disabled = false,
  allowClear = true,
}) {
  const [showInline, setShowInline] = useState(false);
  const selectedDate = useMemo(() => toDate(value), [value]);
  const [draftDate, setDraftDate] = useState(selectedDate);

  useEffect(() => {
    if (!showInline) {
      setDraftDate(selectedDate);
    }
  }, [selectedDate, showInline]);

  const displayValue = value ? dayjs(value).format(DISPLAY_FORMAT) : placeholder;
  const hasValue = Boolean(value);

  const handleSelect = date => {
    if (!date) return;
    const formatted = dayjs(date).format(VALUE_FORMAT);
    if (!dayjs(formatted, VALUE_FORMAT, true).isValid()) return;
    onChange?.(formatted);
  };

  const openPicker = () => {
    if (disabled) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'dismissed') return;
          handleSelect(date || selectedDate);
        },
        minimumDate,
        maximumDate,
      });
    } else {
      setShowInline(true);
    }
  };

  const clearValue = () => {
    onChange?.('');
    setShowInline(false);
  };

  const confirmInline = () => {
    handleSelect(draftDate);
    setShowInline(false);
  };

  const cancelInline = () => {
    setShowInline(false);
  };

  const handleInlineChange = (event, date) => {
    if (event.type === 'dismissed') return;
    if (date) setDraftDate(date);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {allowClear && hasValue ? (
          <Pressable accessibilityRole="button" onPress={clearValue} hitSlop={8}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={[styles.input, disabled && styles.disabled]}
      >
        <Text style={[styles.value, !hasValue && styles.placeholder]} numberOfLines={1}>
          {displayValue}
        </Text>
        <Ionicons name="calendar" size={18} color={colors.textMuted} />
      </Pressable>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}

      {Platform.OS === 'ios' && showInline ? (
        <View style={styles.inlineCard}>
          <View style={styles.inlineHeader}>
            <Pressable
              onPress={cancelInline}
              hitSlop={8}
              style={[styles.headerButton, styles.headerButtonGhost]}
            >
              <Text style={[styles.headerButtonText, styles.headerButtonGhostText]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmInline}
              hitSlop={8}
              style={[styles.headerButton, styles.headerButtonPrimary]}
            >
              <Text style={[styles.headerButtonText, styles.headerButtonPrimaryText]}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="inline"
            onChange={handleInlineChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant="light"
            textColor={colors.text}
            style={styles.inlinePicker}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  clear: {
    fontSize: 12,
    color: colors.textMuted,
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
  disabled: {
    opacity: 0.5,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
  inlineCard: {
    alignSelf: 'center',
    width: INLINE_CARD_WIDTH,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    overflow: 'hidden',
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs / 4,
  },
  inlinePicker: {
    width: '100%',
    alignSelf: 'center',
    marginTop: -spacing.sm,
    marginBottom: -spacing.sm,
  },
  headerButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtonGhost: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerButtonGhostText: {
    color: colors.text,
  },
  headerButtonPrimary: {
    backgroundColor: colors.primary,
  },
  headerButtonPrimaryText: {
    color: '#fff',
  },
});
