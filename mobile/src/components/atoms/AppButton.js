import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

const variants = {
  primary: {
    backgroundColor: colors.primary,
    color: '#fff',
  },
  secondary: {
    backgroundColor: colors.surfaceSubtle,
    color: colors.primary,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
    color: '#fff',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.primary,
  },
};

function renderAdornment(adornment, color) {
  if (!adornment) return null;
  if (typeof adornment === 'string') {
    return <Text style={[styles.icon, { color }]}>{adornment}</Text>;
  }
  return <View style={styles.iconContainer}>{adornment}</View>;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  leading,
  trailing,
}) {
  const variantStyles = variants[variant] || variants.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor || 'transparent',
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {renderAdornment(leading, variantStyles.color)}
      <Text style={[styles.label, { color: variantStyles.color }, textStyle]} numberOfLines={1}>
        {title}
      </Text>
      {renderAdornment(trailing, variantStyles.color)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    fontSize: 14,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
