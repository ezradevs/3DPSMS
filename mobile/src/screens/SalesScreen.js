import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

function createSaleFormDefaults(previousPaymentMethod = 'card') {
  return {
    quantity: '1',
    unitPrice: '',
    note: '',
    paymentMethod: previousPaymentMethod,
    cashReceived: '',
  };
}

function createSessionFormDefaults() {
  return {
    title: '',
    location: '',
    sessionDate: dayjs().format('YYYY-MM-DD'),
    weather: '',
  };
}

function PaymentToggle({ value, onChange }) {
  return (
    <View style={styles.toggleGroup}>
      {['card', 'cash'].map(method => (
        <Pressable
          key={method}
          onPress={() => onChange(method)}
          style={[styles.toggleButton, value === method && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleLabel, value === method && styles.toggleLabelActive]}>
            {method.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SalesScreen() {
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [saleForm, setSaleForm] = useState(() => createSaleFormDefaults());
  const [sessionForm, setSessionForm] = useState(() => createSessionFormDefaults());

  const itemsQuery = useQuery({ queryKey: ['items'], queryFn: api.getItems });
  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: api.getSessions,
    onSuccess: sessions => {
      const openSession = sessions.find(session => session.status === 'open');
      if (openSession) {
        setSelectedSessionId(prev => prev ?? openSession.id);
      } else if (sessions.length) {
        setSelectedSessionId(prev => prev ?? sessions[0].id);
      }
    },
  });

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
      setSaleForm(prev => createSaleFormDefaults(prev.paymentMethod));
      Alert.alert('Sale recorded', 'Inventory and totals have been updated.');
    },
    onError: error => {
      Alert.alert('Unable to record sale', error.message || 'Please try again.');
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: api.createSession,
    onSuccess: session => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSelectedSessionId(session.id);
      setSessionForm(createSessionFormDefaults());
      Alert.alert('Session started', 'You can now log sales into the new session.');
    },
    onError: error => {
      Alert.alert('Unable to create session', error.message || 'Please try again.');
    },
  });

  const items = itemsQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const activeSession = useMemo(
    () => sessions.find(session => session.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );
  const selectedItem = items.find(item => item.id === selectedItemId) ?? null;
  const saleSummary = sessionDetailQuery.data;

  const handleSaleInputChange = (field, value) => {
    setSaleForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitSale = () => {
    if (!selectedSessionId) {
      Alert.alert('Select a session', 'Start or choose a session before logging sales.');
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

    const payload = {
      itemId: selectedItem.id,
      quantity,
      unitPrice:
        saleForm.unitPrice !== ''
          ? Number(saleForm.unitPrice)
          : selectedItem.price,
      note: saleForm.note || undefined,
      paymentMethod: saleForm.paymentMethod,
      cashReceived:
        saleForm.paymentMethod === 'cash' && saleForm.cashReceived !== ''
          ? Number(saleForm.cashReceived)
          : undefined,
    };

    createSaleMutation.mutate({ sessionId: selectedSessionId, payload });
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
      weather: sessionForm.weather || undefined,
    });
  };

  const estimatedUnitPrice = saleForm.unitPrice !== ''
    ? Number(saleForm.unitPrice)
    : selectedItem?.price ?? 0;
  const estimatedTotal = estimatedUnitPrice * Number(saleForm.quantity || 0);
  const changeDue = saleForm.paymentMethod === 'cash'
    ? Number(saleForm.cashReceived || 0) - estimatedTotal
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sales Sessions</Text>
        <Text style={styles.subtitle}>Log sales and keep inventory in sync while you trade.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Session</Text>
          <View style={styles.card}>
            {sessions.length ? (
              <View style={{ gap: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {sessions.map(session => (
                      <Pressable
                        key={session.id}
                        style={[
                          styles.sessionPill,
                          selectedSessionId === session.id && styles.sessionPillActive,
                        ]}
                        onPress={() => setSelectedSessionId(session.id)}
                      >
                        <Text
                          style={[
                            styles.sessionPillText,
                            selectedSessionId === session.id && styles.sessionPillTextActive,
                          ]}
                        >
                          {session.title}
                        </Text>
                        <Text style={styles.sessionPillMeta}>
                          {session.status.toUpperCase()} · {formatDate(session.sessionDate || session.startedAt)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                {activeSession ? (
                  <View style={styles.sessionStats}>
                    <View>
                      <Text style={styles.statLabel}>Revenue</Text>
                      <Text style={styles.statValue}>{formatCurrency(activeSession.totalRevenue)}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Items</Text>
                      <Text style={styles.statValue}>{activeSession.totalItemsSold}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Sales</Text>
                      <Text style={styles.statValue}>{activeSession.saleCount}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.emptyText}>No sessions yet. Start one below.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Sale</Text>
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>Select Item</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {items.map(item => (
                  <Pressable
                    key={item.id}
                    style={[styles.itemCard, selectedItemId === item.id && styles.itemCardActive]}
                    onPress={() => {
                      setSelectedItemId(item.id);
                      setSaleForm(prev => ({
                        ...prev,
                        unitPrice: '',
                      }));
                    }}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                    <Text style={styles.itemMeta}>{item.quantity} on hand</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {!items.length ? (
              <Text style={styles.emptyText}>Inventory is empty right now.</Text>
            ) : null}

            <View style={styles.formRow}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                value={saleForm.quantity}
                onChangeText={value => handleSaleInputChange('quantity', value)}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.label}>Unit Price (optional)</Text>
              <TextInput
                value={saleForm.unitPrice}
                onChangeText={value => handleSaleInputChange('unitPrice', value)}
                keyboardType="decimal-pad"
                placeholder={selectedItem ? String(selectedItem.price) : ''}
                style={styles.input}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.label}>Note</Text>
              <TextInput
                value={saleForm.note}
                onChangeText={value => handleSaleInputChange('note', value)}
                placeholder="Customer, bundle, discount..."
                style={styles.input}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.label}>Payment Method</Text>
              <PaymentToggle
                value={saleForm.paymentMethod}
                onChange={method => handleSaleInputChange('paymentMethod', method)}
              />
            </View>
            {saleForm.paymentMethod === 'cash' && (
              <View style={styles.formRow}>
                <Text style={styles.label}>Cash Received</Text>
                <TextInput
                  value={saleForm.cashReceived}
                  onChangeText={value => handleSaleInputChange('cashReceived', value)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(estimatedTotal)}</Text>
            </View>
            {saleForm.paymentMethod === 'cash' && (
              <Text style={styles.summaryAux}>
                Change due: {changeDue != null ? formatCurrency(Math.max(changeDue, 0)) : formatCurrency(0)}
              </Text>
            )}

            <Pressable
              style={[styles.primaryButton, createSaleMutation.isLoading && styles.buttonDisabled]}
              onPress={handleSubmitSale}
              disabled={createSaleMutation.isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {createSaleMutation.isLoading ? 'Saving...' : 'Record Sale'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Session</Text>
          <View style={styles.card}>
            <View style={styles.formRow}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                value={sessionForm.title}
                onChangeText={value => setSessionForm(prev => ({ ...prev, title: value }))}
                placeholder="Saturday Market"
                style={styles.input}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                value={sessionForm.location}
                onChangeText={value => setSessionForm(prev => ({ ...prev, location: value }))}
                placeholder="Fitzroy Gardens"
                style={styles.input}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                value={sessionForm.sessionDate}
                onChangeText={value => setSessionForm(prev => ({ ...prev, sessionDate: value }))}
                placeholder="YYYY-MM-DD"
                style={styles.input}
              />
            </View>
            <View style={styles.formRow}>
              <Text style={styles.label}>Weather</Text>
              <TextInput
                value={sessionForm.weather}
                onChangeText={value => setSessionForm(prev => ({ ...prev, weather: value }))}
                placeholder="Sunny 23C"
                style={styles.input}
              />
            </View>
            <Pressable
              style={[styles.secondaryButton, createSessionMutation.isLoading && styles.buttonDisabled]}
              onPress={handleCreateSession}
              disabled={createSessionMutation.isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {createSessionMutation.isLoading ? 'Starting...' : 'Start New Session'}
              </Text>
            </Pressable>
          </View>
        </View>

        {saleSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Sales</Text>
            <View style={styles.card}>
              {saleSummary.sales?.length ? (
                saleSummary.sales.slice(0, 10).map(sale => (
                  <View key={sale.id} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>
                        {sale.quantity} x {sale.itemName}
                      </Text>
                      <Text style={styles.listSubtitle}>{formatDateTime(sale.soldAt)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.listValue}>{formatCurrency(sale.totalPrice)}</Text>
                      <Text style={styles.listSubtitle}>{sale.paymentMethod.toUpperCase()}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No sales logged for this session yet.</Text>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#475569',
  },
  sessionPill: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sessionPillActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#e0e7ff',
  },
  sessionPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionPillTextActive: {
    color: '#1e3a8a',
  },
  sessionPillMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemCard: {
    width: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemCardActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#e0f2fe',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemPrice: {
    fontSize: 14,
    color: '#475569',
  },
  itemMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  formRow: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#1d4ed8',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  toggleLabelActive: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryAux: {
    fontSize: 12,
    color: '#64748b',
  },
  primaryButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  listValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
