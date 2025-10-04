import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Slider from '@react-native-community/slider';
import ScreenContainer from '../components/molecules/ScreenContainer';
import SectionHeading from '../components/molecules/SectionHeading';
import Card from '../components/atoms/Card';
import AppButton from '../components/atoms/AppButton';
import Badge from '../components/atoms/Badge';
import ListRow from '../components/molecules/ListRow';
import EmptyState from '../components/molecules/EmptyState';
import LoadingState from '../components/molecules/LoadingState';
import ErrorState from '../components/molecules/ErrorState';
import FormField from '../components/molecules/FormField';
import DatePickerField from '../components/molecules/DatePickerField';
import SelectField from '../components/molecules/SelectField';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { colors, spacing } from '../constants/theme';

function createSaleDefaults(paymentMethod = 'card') {
  return {
    quantity: '1',
    unitPrice: '',
    note: '',
    paymentMethod,
    cashReceived: '',
  };
}

const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Sunny', icon: '☀️' },
  { value: 'partly_cloudy', label: 'Partly Cloudy', icon: '🌤️' },
  { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
  { value: 'rainy', label: 'Rainy', icon: '🌧️' },
  { value: 'windy', label: 'Windy', icon: '🌬️' },
  { value: 'stormy', label: 'Stormy', icon: '⛈️' },
];

function createSessionDefaults() {
  return {
    title: '',
    location: '',
    sessionDate: dayjs().format('YYYY-MM-DD'),
    weatherCondition: 'sunny',
    weatherTemp: 24,
  };
}

function formatWeatherDescription(condition, temp) {
  if (!condition && !temp) return undefined;
  const option = WEATHER_OPTIONS.find(opt => opt.value === condition);
  const label = option ? option.label : condition;
  if (!label && !temp) return undefined;
  if (!label) return `${temp}°C`;
  if (temp == null) return label;
  return `${label} ${temp}°C`;
}

export default function SalesScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [saleForm, setSaleForm] = useState(() => createSaleDefaults());
  const [sessionForm, setSessionForm] = useState(() => createSessionDefaults());

  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: api.getItems });
  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: api.getSessions });

  const sessionDetailQuery = useQuery({
    queryKey: ['session', selectedSessionId],
    queryFn: () => (selectedSessionId ? api.getSession(selectedSessionId) : null),
    enabled: Boolean(selectedSessionId),
  });

  const createSaleMutation = useMutation({
    mutationFn: ({ sessionId, payload }) => api.createSale(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setSaleForm(prev => createSaleDefaults(prev.paymentMethod));
      Alert.alert('Sale recorded', 'Inventory and totals have been updated.');
    },
    onError: err => Alert.alert('Unable to record sale', err.message || 'Please try again.'),
  });

  const createSessionMutation = useMutation({
    mutationFn: api.createSession,
    onSuccess: session => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSelectedSessionId(session.id);
      setSessionForm(createSessionDefaults());
      Alert.alert('Session started', 'You can now log sales into the new session.');
    },
    onError: err => Alert.alert('Unable to start session', err.message || 'Please try again.'),
  });

  const closeSessionMutation = useMutation({
    mutationFn: sessionId => api.closeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Session closed');
    },
    onError: err => Alert.alert('Unable to close session', err.message || 'Please try again.'),
  });

  const items = itemsQuery.data ?? [];
  const itemOptions = useMemo(
    () => items.map(item => ({
      value: item.id,
      label: item.name,
      quantity: item.quantity,
      price: item.price,
      tag: item.tag,
    })),
    [items],
  );
  const sessions = sessionsQuery.data ?? [];
  const openSession = useMemo(
    () => sessions.find(session => session.status === 'open') ?? null,
    [sessions],
  );
  const selectedSession = useMemo(
    () => sessions.find(session => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );
  const selectedItem = items.find(item => item.id === selectedItemId) ?? null;
  const sessionDetails = sessionDetailQuery.data;

  useEffect(() => {
    if (openSession) {
      setSelectedSessionId(prev => (prev ? prev : openSession.id));
    } else if (sessions.length && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    } else if (!sessions.length) {
      setSelectedSessionId(null);
    }
  }, [openSession, sessions, selectedSessionId]);

  if (itemsQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading sessions and inventory…" />
      </ScreenContainer>
    );
  }

  if (itemsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={itemsQuery.error?.message || 'Unable to load items'} onRetry={itemsQuery.refetch} />
      </ScreenContainer>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState message={sessionsQuery.error?.message || 'Unable to load sessions'} onRetry={sessionsQuery.refetch} />
      </ScreenContainer>
    );
  }

  const handleSaleChange = (field, value) => {
    setSaleForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitSale = () => {
    if (!selectedSession || selectedSession.status !== 'open') {
      Alert.alert('Select an active session', 'Start or choose an open session before logging sales.');
      return;
    }
    if (!selectedItem) {
      Alert.alert('Choose an item', 'Select an inventory item to record the sale.');
      return;
    }

    const quantity = Number(saleForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert('Invalid quantity', 'Enter a quantity higher than zero.');
      return;
    }

    createSaleMutation.mutate({
      sessionId: selectedSession.id,
      payload: {
        itemId: selectedItem.id,
        quantity,
        unitPrice: saleForm.unitPrice !== '' ? Number(saleForm.unitPrice) : selectedItem.price,
        note: saleForm.note || undefined,
        paymentMethod: saleForm.paymentMethod,
        cashReceived:
          saleForm.paymentMethod === 'cash' && saleForm.cashReceived !== ''
            ? Number(saleForm.cashReceived)
            : undefined,
      },
    });
  };

  const handleCreateSession = () => {
    if (!sessionForm.title.trim()) {
      Alert.alert('Missing title', 'Give the session a name.');
      return;
    }
    createSessionMutation.mutate({
      title: sessionForm.title,
      location: sessionForm.location || undefined,
      sessionDate: sessionForm.sessionDate || undefined,
      weather: formatWeatherDescription(sessionForm.weatherCondition, sessionForm.weatherTemp),
    });
  };

  const estimatedUnitPrice = saleForm.unitPrice !== ''
    ? Number(saleForm.unitPrice)
    : selectedItem?.price ?? 0;
  const estimatedTotal = estimatedUnitPrice * Number(saleForm.quantity || 0);
  const changeDue = saleForm.paymentMethod === 'cash'
    ? Number(saleForm.cashReceived || 0) - estimatedTotal
    : null;
  const canLogSale = selectedSession?.status === 'open';

  return (
    <ScreenContainer>
      <Text style={styles.title}>Sales Sessions</Text>
      <Text style={styles.subtitle}>Track live performance and log new sales.</Text>

      <SectionHeading
        title={openSession ? 'Active session' : 'Start a session'}
        style={{ marginTop: spacing.md, marginBottom: spacing.md }}
      />
      <Card style={{ gap: spacing.md }}>
        {openSession ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sessionSummary}>
              <SummaryStat label="Title" value={openSession.title} />
              <SummaryStat label="Revenue" value={formatCurrency(openSession.totalRevenue)} />
              <SummaryStat label="Sales" value={openSession.saleCount} />
            </View>
            <AppButton
              title={closeSessionMutation.isLoading ? 'Closing…' : 'Close session'}
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  'Close session',
                  'Mark this session as closed? You can still view its history later.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Close',
                      style: 'destructive',
                      onPress: () => closeSessionMutation.mutate(openSession.id),
                    },
                  ],
                );
              }}
              disabled={closeSessionMutation.isLoading}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <FormField
              label="Title"
              value={sessionForm.title}
              onChangeText={value => setSessionForm(prev => ({ ...prev, title: value }))}
              placeholder="Saturday Session"
            />
            <FormField
              label="Location"
              value={sessionForm.location}
              onChangeText={value => setSessionForm(prev => ({ ...prev, location: value }))}
              placeholder="Lyne Park"
            />
            <DatePickerField
              label="Date"
              value={sessionForm.sessionDate}
              onChange={value => setSessionForm(prev => ({ ...prev, sessionDate: value }))}
              allowClear={false}
            />
            <View style={styles.weatherSection}>
              <Text style={styles.fieldLabel}>Weather</Text>
              <View style={styles.weatherChips}>
                {WEATHER_OPTIONS.map(option => (
                  <AppButton
                    key={option.value}
                    title={`${option.icon} ${option.label}`}
                    onPress={() => setSessionForm(prev => ({ ...prev, weatherCondition: option.value }))}
                    variant={sessionForm.weatherCondition === option.value ? 'primary' : 'secondary'}
                    style={styles.weatherChip}
                    textStyle={{ fontSize: 12 }}
                  />
                ))}
              </View>
              <View style={styles.weatherSliderHeader}>
                <Text style={styles.fieldLabel}>Temperature</Text>
                <Text style={styles.weatherTempValue}>{sessionForm.weatherTemp}°C</Text>
              </View>
              <Slider
                minimumValue={15}
                maximumValue={40}
                step={1}
                value={sessionForm.weatherTemp}
                onValueChange={value => setSessionForm(prev => ({ ...prev, weatherTemp: Math.round(value) }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.textMuted}
                thumbTintColor={colors.primary}
              />
            </View>
            <AppButton
              title={createSessionMutation.isLoading ? 'Starting…' : 'Start session'}
              variant="secondary"
              onPress={handleCreateSession}
              disabled={createSessionMutation.isLoading}
            />
          </View>
        )}
      </Card>

      <SectionHeading title="Log sale" style={{ marginTop: spacing.xl }} />
      <Card style={{ gap: spacing.md }}>
        {!canLogSale ? (
          <Text style={styles.helper}>Select an active session to enable sale logging.</Text>
        ) : null}
        <SelectField
          label="Item"
          placeholder={items.length ? 'Select an item' : 'No items available'}
          options={itemOptions}
          selectedValue={selectedItemId}
          onSelect={option => {
            setSelectedItemId(option.value);
            setSaleForm(prev => ({ ...prev, unitPrice: '' }));
          }}
          helper={selectedItem ? `${selectedItem.quantity} on hand · ${formatCurrency(selectedItem.price)} each` : 'Select an inventory item to record the sale.'}
          disabled={!items.length}
          renderOption={(option) => (
            <View style={styles.selectOptionRow}>
              <View style={styles.selectOptionInfo}>
                <Text style={styles.selectOptionTitle}>{option.label}</Text>
                {option.tag ? <Text style={styles.selectOptionSubtitle}>{option.tag}</Text> : null}
              </View>
              <View style={styles.selectOptionMeta}>
                <Text style={styles.selectOptionPrice}>{formatCurrency(option.price)}</Text>
                <Text style={styles.selectOptionHelper}>{option.quantity} on hand</Text>
              </View>
            </View>
          )}
        />
        {!items.length ? <EmptyState message="Inventory is empty." /> : null}

        <View class="form-grid" style={styles.formGrid}>
          <FormField
            label="Quantity"
            value={saleForm.quantity}
            onChangeText={value => handleSaleChange('quantity', value)}
            keyboardType="number-pad"
          />
          <FormField
            label="Unit price (optional)"
            value={saleForm.unitPrice}
            onChangeText={value => handleSaleChange('unitPrice', value)}
            keyboardType="decimal-pad"
            placeholder={selectedItem ? String(selectedItem.price) : ''}
          />
        </View>
        <FormField
          label="Note"
          value={saleForm.note}
          onChangeText={value => handleSaleChange('note', value)}
          placeholder="Customer, bundle, discount…"
        />

        <Text style={styles.fieldLabel}>Payment method</Text>
        <View style={styles.toggleGroup}>
          {['card', 'cash'].map(method => (
            <AppButton
              key={method}
              title={method.toUpperCase()}
              onPress={() => handleSaleChange('paymentMethod', method)}
              variant={saleForm.paymentMethod === method ? 'primary' : 'secondary'}
            />
          ))}
        </View>

        {saleForm.paymentMethod === 'cash' ? (
          <FormField
            label="Cash received"
            value={saleForm.cashReceived}
            onChangeText={value => handleSaleChange('cashReceived', value)}
            keyboardType="decimal-pad"
            placeholder="Amount tendered"
          />
        ) : null}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estimated total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(estimatedTotal)}</Text>
        </View>
        {saleForm.paymentMethod === 'cash' ? (
          <Text style={styles.changeText}>
            Change due: {formatCurrency(Math.max(changeDue ?? 0, 0))}
          </Text>
        ) : null}

        <AppButton
          title={createSaleMutation.isLoading ? 'Recording…' : 'Record sale'}
          onPress={handleSubmitSale}
          disabled={createSaleMutation.isLoading || !canLogSale}
        />
      </Card>

      {selectedSession && sessionDetails ? (
        <>
          <SectionHeading
            title={`Recent sales - ${selectedSession.title}`}
            style={{ marginTop: spacing.xl }}
          />
          <Card>
            {sessionDetails.sales?.length ? (
              sessionDetails.sales.slice(0, 10).map((sale, index, array) => (
                <ListRow
                  key={sale.id}
                  title={`${sale.quantity} × ${sale.itemName}`}
                  subtitle={formatDateTime(sale.soldAt)}
                  meta={
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.listValue}>{formatCurrency(sale.totalPrice)}</Text>
                      <Badge label={sale.paymentMethod.toUpperCase()} variant={sale.paymentMethod === 'cash' ? 'warning' : 'info'} />
                    </View>
                  }
                  onPress={() => navigation.navigate('SaleDetail', { sale })}
                  showDivider={index !== array.length - 1}
                />
              ))
            ) : (
              <EmptyState message="No sales logged for this session." />
            )}
          </Card>
        </>
      ) : null}

      <SectionHeading title="Past sessions" style={{ marginTop: spacing.xl }} />
      <Card>
        {sessions.length ? (
          sessions.map((session, index) => (
            <ListRow
              key={session.id}
              title={session.title}
              subtitle={session.location || '—'}
              meta={
                <View style={styles.sessionMeta}>
                  <Badge
                    label={session.status.toUpperCase()}
                    variant={session.status === 'open' ? 'info' : 'default'}
                  />
                  <Text style={styles.metaText}>{formatDate(session.sessionDate || session.startedAt)}</Text>
                  <Text style={styles.metaText}>{formatCurrency(session.totalRevenue)}</Text>
                </View>
              }
              onPress={() => setSelectedSessionId(session.id)}
              showDivider={index !== sessions.length - 1}
            />
          ))
        ) : (
          <EmptyState message="No sessions yet." />
        )}
      </Card>
    </ScreenContainer>
  );
}

function SummaryStat({ label, value, compact = false }) {
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
  sessionSummary: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: spacing.md,
  },
  formGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  changeText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  listValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  helper: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sessionMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
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
  selectOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  selectOptionInfo: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  selectOptionTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectOptionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selectOptionMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs / 2,
  },
  selectOptionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectOptionHelper: {
    fontSize: 12,
    color: colors.textMuted,
  },
  weatherSection: {
    gap: spacing.sm,
  },
  weatherChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weatherChip: {
    minWidth: 120,
  },
  weatherSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherTempValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
