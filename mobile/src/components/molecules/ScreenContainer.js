import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

export default function ScreenContainer({
  children,
  inset = true,
  scrollable = true,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
}) {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + spacing.xl;
  const horizontalPadding = inset ? spacing.lg : 0;
  const bottomPadding = inset ? spacing.xxl : spacing.lg;

  if (scrollable) {
    return (
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPadding,
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomPadding,
          },
          contentContainerStyle,
        ]}
        refreshControl={
          onRefresh
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: topPadding,
          paddingHorizontal: horizontalPadding,
          paddingBottom: bottomPadding,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {},
});
