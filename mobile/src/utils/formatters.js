import dayjs from 'dayjs';

export function formatCurrency(value, locale = undefined, currency = 'AUD') {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return formatter.format(numeric || 0);
}

export function formatDate(value, fallback = 'N/A') {
  if (!value) return fallback;
  return dayjs(value).format('MMM D, YYYY');
}

export function formatDateTime(value, fallback = 'N/A') {
  if (!value) return fallback;
  return dayjs(value).format('MMM D, YYYY h:mm A');
}
