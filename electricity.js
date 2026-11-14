(function (root) {
  'use strict';
  const TIERS = Object.freeze([
    Object.freeze({ label: 'Bậc 1', range: 'Đến 100 kWh', capacity: 100, rate: 1901 }),
    Object.freeze({ label: 'Bậc 2', range: 'Trên 100–200 kWh', capacity: 100, rate: 2289 }),
    Object.freeze({ label: 'Bậc 3', range: 'Trên 200–400 kWh', capacity: 200, rate: 2894 }),
    Object.freeze({ label: 'Bậc 4', range: 'Trên 400–700 kWh', capacity: 300, rate: 3456 }),
    Object.freeze({ label: 'Bậc 5', range: 'Trên 700 kWh', capacity: Infinity, rate: 3844 })
  ]);

  function parseVolume(input) {
    const value = String(input).trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(value)) {
      throw new RangeError('Vui lòng nhập số kWh không âm, ví dụ: 100 hoặc 100,5.');
    }
    const volume = Number(value.replace(',', '.'));
    if (!Number.isFinite(volume) || volume > 1e9) {
      throw new RangeError('Vui lòng nhập chỉ số không vượt quá 1.000.000.000 kWh.');
    }
    return volume;
  }

  function calculateBill(volume) {
    if (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0 || volume > 1e9) {
      throw new RangeError('Số kWh phải là số không âm và không vượt quá 1.000.000.000.');
    }
    let remaining = volume;
    const rows = TIERS.map(tier => {
      const used = Math.min(remaining, tier.capacity);
      remaining = Math.max(0, remaining - used);
      return { ...tier, used, amount: used * tier.rate };
    });
    return { volume, rows, total: Math.round(rows.reduce((sum, row) => sum + row.amount, 0)) };
  }

  const api = { TIERS, parseVolume, calculateBill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ElectricityCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
