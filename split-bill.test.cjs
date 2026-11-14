'use strict';
const assert = require('node:assert/strict');
const { calculateBill, splitBill } = require('./calculator.js');

for (const [total, first, difference, expectedFirst, expectedSecond] of [
  [100, 20, 0, 245775, 1183215],
  [100, 20, 10, 323895, 1105095],
  [100, 0, 10, 44770, 1384220],
  [100, 0, 0, 0, 1428990],
  [100, 100, 0, 1428990, 0],
  [10, 5, 0, 44770, 44770],
  [10, 1, 0, 8954, 80586],
  [0, 0, 0, 0, 0]
]) {
  const split = splitBill(total, first, difference);
  assert.equal(split.firstTotal, expectedFirst);
  assert.equal(split.secondTotal, expectedSecond);
  assert.equal(split.firstTotal + split.secondTotal, calculateBill(total).total);
}

// Cover fractional volumes, transferred allowances, zero usage and rounding.
for (const total of [0, 0.001, 0.3, 5, 10, 10.5, 20, 29.9, 30, 43, 100, 1000]) {
  for (const differenceFraction of [0, 0.1, 0.5, 1]) {
    const difference = Number((total * differenceFraction).toFixed(10));
    for (const fraction of [0, 0.1, 0.25, 0.5, 0.9, 1]) {
      const first = Number(((total - difference) * fraction).toFixed(10));
      const split = splitBill(total, first, difference);
      assert.equal(split.firstTotal + split.secondTotal, calculateBill(total).total);
      assert(split.firstTotal >= 0 && split.secondTotal >= 0);
      assert(Math.abs(split.firstVolume + split.secondVolume + difference - total) < 1e-8);
      assert(Math.abs(split.rows.reduce((sum, row) => sum + row.firstUsed, 0) - split.firstBilledVolume) < 1e-8);
      assert(Math.abs(split.rows.reduce((sum, row) => sum + row.secondUsed, 0) - split.secondBilledVolume) < 1e-8);
      for (const row of split.rows) assert(Math.abs(row.firstUsed + row.secondUsed - row.used) < 1e-8);
      const swapped = splitBill(total, split.secondVolume, difference);
      assert(Math.abs(swapped.firstTotal - split.secondTotal) <= 1);
    }
  }
}
for (const args of [[100, 101], [100, -1], [100, 20, -Infinity], [100, 20, 81], [100, NaN], [100, 20, Infinity]]) {
  assert.throws(() => splitBill(...args), RangeError);
}
console.log('PASS chia 2 nhà: ví dụ 20/80, chênh lệch, chuyển định mức, số lẻ, làm tròn và khớp tổng tiền.');

const electricity = require('./electricity.js');
const example = electricity.splitBill(1000, 200, 0);
assert.equal(example.firstTotal, 538812);
assert.equal(example.secondTotal, 2904012);
assert.equal(example.total, 3442824);
for (const total of [0, 0.001, 100, 101, 200, 250, 400, 401, 700, 701, 1000]) {
  for (const differenceFraction of [0, 0.1, 0.5, 1]) {
    const difference = Number((total * differenceFraction).toFixed(10));
    for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
      const first = Number(((total - difference) * fraction).toFixed(10));
      const split = electricity.splitBill(total, first, difference);
      const bill = electricity.calculateBill(total);
      assert.equal(split.firstTotal + split.secondTotal, bill.totalWithVat);
      assert.equal(split.firstSubtotal + split.secondSubtotal, bill.total);
      assert.equal(split.firstVat + split.secondVat, bill.vatAmount);
      assert.equal(split.firstSubtotal + split.firstVat, split.firstTotal);
      assert.equal(split.secondSubtotal + split.secondVat, split.secondTotal);
      assert(split.firstTotal >= 0 && split.secondTotal >= 0);
      assert(Math.abs(split.firstVolume + split.secondVolume + difference - total) < 1e-8);
      assert(Math.abs(split.rows.reduce((sum, row) => sum + row.firstUsed, 0) - split.firstBilledVolume) < 1e-8);
      assert(Math.abs(split.rows.reduce((sum, row) => sum + row.secondUsed, 0) - split.secondBilledVolume) < 1e-8);
    }
  }
}
for (const args of [[100, 101], [100, -1], [100, 20, -Infinity], [100, 20, 81], [100, NaN], [100, 20, Infinity]]) {
  assert.throws(() => electricity.splitBill(...args), RangeError);
}
console.log('PASS chia tiền điện: 5 bậc, chênh lệch, khớp tiền trước thuế, VAT và tổng sau thuế.');

for (const calculator of [{ calculateBill, splitBill }, electricity]) {
  const example = calculator.splitBill(100, 20, -10);
  assert.equal(example.firstVolume, 20);
  assert.equal(example.secondVolume, 90);
  assert(Math.abs(example.firstBilledVolume - 100 * 20 / 110) < 1e-10);
  assert(Math.abs(example.secondBilledVolume - 100 * 90 / 110) < 1e-10);
  for (const total of [0, 0.2, 10, 30, 100, 200, 400, 700, 1000]) {
    for (const excess of [0.1, 10, 100]) {
      for (const fraction of [0, 0.01, 0.2, 0.5, 1]) {
        const first = Number(((total + excess) * fraction).toFixed(10));
        const split = calculator.splitBill(total, first, -excess);
        const bill = calculator.calculateBill(total);
        assert.equal(split.firstTotal + split.secondTotal, bill.totalWithVat ?? bill.total);
        assert(split.firstTotal >= 0 && split.secondTotal >= 0);
        assert(Math.abs(split.firstBilledVolume + split.secondBilledVolume - total) < 1e-8);
        assert(Math.abs(split.firstBilledVolume - total * first / (total + excess)) < 1e-8);
        assert(Math.abs(split.rows.reduce((s, row) => s + row.firstUsed, 0) - split.firstBilledVolume) < 1e-8);
        assert(Math.abs(split.rows.reduce((s, row) => s + row.secondUsed, 0) - split.secondBilledVolume) < 1e-8);
        if (bill.vatAmount !== undefined) assert.equal(split.firstVat + split.secondVat, bill.vatAmount);
      }
    }
  }
}
console.log('PASS chênh lệch âm: giảm theo tỷ lệ, giữ số thực tế, vượt tổng, tổng bằng 0 và khớp tiền cả điện/nước.');
