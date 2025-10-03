import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenContainer from '../components/molecules/ScreenContainer';
import Card from '../components/atoms/Card';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import Badge from '../components/atoms/Badge';
import { colors, spacing } from '../constants/theme';

export default function SaleDetailScreen() {
  const { params } = useRoute();
  const sale = params?.sale;

  if (!sale) {
    return (
      <ScreenContainer>
        <Card>
          <Text style={styles.message}>Sale details unavailable.</Text>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Card style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={styles.title}>{sale.itemName}</Text>
          <Text style={styles.subtitle}>{formatDateTime(sale.soldAt)}</Text>
        </View>

        <View style={styles.row}>
          <SummaryField label="Quantity" value={sale.quantity} />
          <SummaryField label="Unit price" value={formatCurrency(sale.unitPrice)} />
          <SummaryField label="Total" value={formatCurrency(sale.totalPrice)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Session</Text>
          <Text style={styles.sectionValue}>{sale.sessionTitle}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Badge label={sale.paymentMethod.toUpperCase()} variant={sale.paymentMethod === 'cash' ? 'warning' : 'info'} />
            {sale.paymentMethod === 'cash' && sale.cashReceived != null ? (
              <Text style={styles.sectionValue}>
                Tendered {formatCurrency(sale.cashReceived)}
                {sale.changeGiven != null ? ` • Change ${formatCurrency(sale.changeGiven)}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {sale.note ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Note</Text>
            <Text style={styles.sectionValue}>{sale.note}</Text>
          </View>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

function SummaryField({ label, value }) {
  return (
    <View style={styles.summaryField}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryField: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sectionValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
