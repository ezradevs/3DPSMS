function toCents(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }
  const number = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(number)) {
    throw new Error('Invalid currency amount');
  }
  return Math.round(number * 100);
}

function fromCents(cents) {
  if (cents === null || cents === undefined) {
    return 0;
  }
  return Number(cents) / 100;
}

module.exports = {
  toCents,
  fromCents,
};
