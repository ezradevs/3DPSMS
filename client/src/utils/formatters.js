import dayjs from 'dayjs';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'AUD',
});

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return dayjs(value).format('MMM D, YYYY');
}

export function formatDateTime(value) {
  if (!value) return '—';
  return dayjs(value).format('MMM D, YYYY h:mm A');
}
