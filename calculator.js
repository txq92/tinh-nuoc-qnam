(function (root) {
  'use strict';
  const TIERS = Object.freeze([
    Object.freeze({ label: 'Bậc 1', range: '10 m³ đầu', capacity: 10, rate: 8954 }),
    Object.freeze({ label: 'Bậc 2', range: 'Trên 10–20 m³', capacity: 10, rate: 11177 }),
    Object.freeze({ label: 'Bậc 3', range: 'Trên 20–30 m³', capacity: 10, rate: 13400 }),
    Object.freeze({ label: 'Bậc 4', range: 'Trên 30 m³', capacity: Infinity, rate: 15624 })
  ]);

  function parseVolume(input) {
    const value = String(input).trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(value)) {
      throw new RangeError('Vui lòng nhập số m³ không âm, ví dụ: 43 hoặc 10,5.');
    }
    const volume = Number(value.replace(',', '.'));
    if (!Number.isFinite(volume) || volume > 1e9) {
      throw new RangeError('Vui lòng nhập lượng nước không vượt quá 1.000.000.000 m³.');
    }
    return volume;
  }

  function calculateBill(volume) {
    if (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0 || volume > 1e9) {
      throw new RangeError('Lượng nước phải là số không âm và không vượt quá 1.000.000.000 m³.');
    }
    let remaining = volume;
    const rows = TIERS.map(tier => {
      const used = Math.min(remaining, tier.capacity);
      remaining = Math.max(0, remaining - used);
      return { ...tier, used, amount: used * tier.rate };
    });
    // Round only the final bill to the nearest đồng.
    return { volume, rows, total: Math.round(rows.reduce((sum, row) => sum + row.amount, 0)) };
  }

  function splitBill(totalVolume, firstVolume, discrepancy = 0) {
    const splitter = typeof module !== 'undefined' && module.exports ? require('./split-calculator.js') : root.UtilityBillSplitter;
    return splitter.splitBill(calculateBill(totalVolume), firstVolume, discrepancy);
  }

  const api = { TIERS, parseVolume, calculateBill, splitBill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WaterCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
