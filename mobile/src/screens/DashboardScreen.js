import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import ListRow from '../components/molecules/ListRow';
import Badge from '../components/atoms/Badge';
import EmptyState from '../components/molecules/EmptyState';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import { colors, spacing } from '../constants/theme';

const BANNER_IMAGE_KEY = '@dashboard_banner_image';

export default function DashboardScreen() {
  const queryClient = useQueryClient();
  const [bannerImage, setBannerImage] = useState(null);

  useEffect(() => {
    loadBannerImage();
  }, []);

  const loadBannerImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(BANNER_IMAGE_KEY);
      if (savedImage) {
        setBannerImage(savedImage);
      }
    } catch (error) {
      console.log('Error loading banner image:', error);
    }
  };

  const saveBannerImage = async (uri) => {
    try {
      await AsyncStorage.setItem(BANNER_IMAGE_KEY, uri);
      setBannerImage(uri);
    } catch (error) {
      console.log('Error saving banner image:', error);
    }
  };
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    return refetch();
  }, [queryClient, refetch]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library to upload a banner image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 6],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      saveBannerImage(result.assets[0].uri);
    }
  };

  if (isLoading || isRefetching) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading dashboard…" />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <ErrorState message={error?.message || 'Unable to load dashboard'} onRetry={onRefresh} />
      </ScreenContainer>
    );
  }

  const today = data?.todaySummary;
  const lowStock = data?.lowStockItems ?? [];
  const recentSales = data?.recentSales ?? [];
  const recentTrend = data?.recentTrend ?? [];
  const sevenDayRevenue = recentTrend.reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
  const sevenDayItems = recentTrend.reduce((sum, day) => sum + (day.totalItems || 0), 0);

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={isRefetching}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Your stall at a glance.</Text>

      <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
        {bannerImage ? (
          <Image source={{ uri: bannerImage }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerPlaceholderText}>📷 Tap to add a banner photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <SectionHeading title="Today" style={{ marginTop: spacing.md }} />
      <Card style={{ gap: spacing.lg }}>
        {today ? (
          <View style={styles.heroHeader}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.heroTitle}>{today.title}</Text>
              <Text style={styles.heroSubtitle}>
                Status: {today.status ? today.status.toUpperCase() : 'UNKNOWN'}
              </Text>
              {today.weather ? <Text style={styles.heroSubtitle}>Weather: {today.weather}</Text> : null}
            </View>
            <View style={styles.heroStats}>
              <HeroStat label="Revenue" value={formatCurrency(today.totalRevenue)} />
              <HeroStat label="Items" value={today.totalItemsSold} />
              <HeroStat label="Sales" value={today.saleCount} />
            </View>
          </View>
        ) : (
          <EmptyState title="No active session" message="Start a sales session to begin tracking." />
        )}

        <View>
          <Text style={styles.sectionLabel}>Latest Sales</Text>
          {today?.latestSales?.length ? (
            today.latestSales.map(sale => (
              <ListRow
                key={sale.id}
                title={`${sale.quantity} × ${sale.itemName}`}
                subtitle={formatDateTime(sale.soldAt)}
                meta={<Text style={styles.listValue}>{formatCurrency(sale.totalPrice)}</Text>}
              />
            ))
          ) : (
            <EmptyState message="No sales yet for the active session." />
          )}
        </View>
      </Card>

      <SectionHeading title="7 Day Performance" style={{ marginTop: spacing.xl }} />
      <Card>
        <View style={styles.trendSummary}>
          <HeroStat label="Revenue" value={formatCurrency(sevenDayRevenue)} compact />
          <HeroStat label="Items" value={sevenDayItems} compact />
        </View>
        {recentTrend.length ? (
          recentTrend.map(day => (
            <ListRow
              key={day.date}
              title={formatDate(day.date)}
              meta={
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listValue}>{formatCurrency(day.totalRevenue)}</Text>
                  <Text style={styles.listMeta}>{day.totalItems} items</Text>
                </View>
              }
            />
          ))
        ) : (
          <EmptyState message="Collect more data to display the trend." />
        )}
      </Card>

      <SectionHeading title="Low Stock" style={{ marginTop: spacing.xl }} />
      <Card>
        {lowStock.length ? (
          lowStock.map(item => (
            <ListRow
              key={item.id}
              title={item.name}
              subtitle={formatCurrency(item.price)}
              meta={<Badge label={`${item.quantity} left`} variant={item.quantity === 0 ? 'danger' : 'warning'} />}
            />
          ))
        ) : (
          <EmptyState message="All inventory looks healthy." />
        )}
      </Card>

      <SectionHeading title="Recent Sales" style={{ marginTop: spacing.xl }} />
      <Card>
        {recentSales.length ? (
          recentSales.map(sale => (
            <ListRow
              key={sale.id}
              title={`${sale.quantity} × ${sale.itemName}`}
              subtitle={sale.sessionTitle}
              meta={
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.listValue}>{formatCurrency(sale.totalPrice)}</Text>
                  <Text style={styles.listMeta}>{formatDateTime(sale.soldAt)}</Text>
                </View>
              }
            />
          ))
        ) : (
          <EmptyState message="No recent sales recorded." />
        )}
      </Card>
    </ScreenContainer>
  );
}

function HeroStat({ label, value, compact = false }) {
  return (
    <View style={[styles.heroStat, compact && { flex: 0 }]}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroStat: {
    alignItems: 'flex-start',
    gap: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  trendSummary: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  listValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  listMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  bannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bannerPlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
