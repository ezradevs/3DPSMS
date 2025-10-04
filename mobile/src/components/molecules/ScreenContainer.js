import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
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
  const blurHeight = insets.top + spacing.xxl + 24;

  const BlurBar = (
    <MaskedView
      pointerEvents="none"
      style={[
        styles.blurContainer,
        {
          height: blurHeight,
        },
      ]}
      maskElement={
        <LinearGradient
          colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={16} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(246, 247, 251, 0.85)', 'rgba(246, 247, 251, 0.05)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </MaskedView>
  );

  if (scrollable) {
    return (
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scroll}
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
        {BlurBar}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.staticContent,
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
      {BlurBar}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {},
  staticContent: {
    flex: 1,
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
