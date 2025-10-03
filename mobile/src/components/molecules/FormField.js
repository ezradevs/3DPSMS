import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  right,
  error,
  ...rest
}) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          keyboardType={keyboardType}
          style={[styles.input, multiline && styles.multiline]}
          {...rest}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  right: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  error: {
    fontSize: 12,
    color: colors.danger,
  },
});
