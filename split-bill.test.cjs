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
for (const args of [[100, 101], [100, -1], [100, 20, -1], [100, 20, 81], [100, NaN], [100, 20, Infinity]]) {
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
for (const args of [[100, 101], [100, -1], [100, 20, -1], [100, 20, 81], [100, NaN], [100, 20, Infinity]]) {
  assert.throws(() => electricity.splitBill(...args), RangeError);
}
console.log('PASS chia tiền điện: 5 bậc, chênh lệch, khớp tiền trước thuế, VAT và tổng sau thuế.');
