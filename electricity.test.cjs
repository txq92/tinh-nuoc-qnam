'use strict';
const assert = require('node:assert/strict');
const { calculateBill, parseVolume } = require('./electricity.js');
const cases = [
  [0, 0, [0, 0, 0, 0, 0]],
  [100, 190100, [100, 0, 0, 0, 0]],
  [101, 192389, [100, 1, 0, 0, 0]],
  [200, 419000, [100, 100, 0, 0, 0]],
  [201, 421894, [100, 100, 1, 0, 0]],
  [250, 563700, [100, 100, 50, 0, 0]],
  [400, 997800, [100, 100, 200, 0, 0]],
  [401, 1001256, [100, 100, 200, 1, 0]],
  [700, 2034600, [100, 100, 200, 300, 0]],
  [701, 2038444, [100, 100, 200, 300, 1]],
  [100.5, 191245, [100, 0.5, 0, 0, 0]]
];
for (const [volume, total, usage] of cases) {
  const bill = calculateBill(volume);
  assert.equal(bill.total, total, `${volume} kWh`);
  assert.deepEqual(bill.rows.map(row => row.used), usage);
  console.log(`PASS ${volume} kWh => ${total} VND (chưa VAT)`);
}
assert.equal(parseVolume('100,5'), 100.5);
for (const [volume, vat, totalWithVat] of [[0, 0, 0], [100, 15208, 205308], [250, 45096, 608796], [701, 163076, 2201520], [100.5, 15300, 206545]]) {
  const bill = calculateBill(volume);
  assert.equal(bill.vatRate, 0.08);
  assert.equal(bill.vatAmount, vat);
  assert.equal(bill.totalWithVat, totalWithVat);
  assert.equal(bill.total + bill.vatAmount, bill.totalWithVat);
  console.log(`PASS ${volume} kWh: VAT ${vat} VND, sau VAT ${totalWithVat} VND`);
}
for (const input of ['', '-1', 'abc', 'Infinity', '1000000001']) assert.throws(() => parseVolume(input), RangeError);
for (const input of [-1, NaN, Infinity, '100', 1000000001]) assert.throws(() => calculateBill(input), RangeError);
