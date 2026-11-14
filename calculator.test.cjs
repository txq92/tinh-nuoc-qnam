'use strict';
const assert = require('node:assert/strict');
const { calculateBill, parseVolume } = require('./calculator.js');

const cases = [
  [43, 538422, [10, 10, 10, 13]],
  [47, 600918, [10, 10, 10, 17]],
  [20, 201310, [10, 10, 0, 0]],
  [11, 100717, [10, 1, 0, 0]],
  [0, 0, [0, 0, 0, 0]],
  [10, 89540, [10, 0, 0, 0]],
  [30, 335310, [10, 10, 10, 0]],
  [10.5, 95129, [10, 0.5, 0, 0]]
];
for (const [volume, expected, usage] of cases) {
  const bill = calculateBill(volume);
  assert.equal(bill.total, expected, `${volume} m³`);
  assert.deepEqual(bill.rows.map(row => row.used), usage);
  console.log(`PASS ${volume} m³ => ${bill.total} VND`);
}
assert.equal(parseVolume('10,5'), 10.5);
assert.equal(parseVolume(' 10.5 '), 10.5);
for (const input of ['', '-1', 'abc', '1e3', '1.000,5', 'Infinity', '1000000001']) {
  assert.throws(() => parseVolume(input), RangeError);
}
for (const input of [-1, NaN, Infinity, '43', 1000000001]) {
  assert.throws(() => calculateBill(input), RangeError);
}
console.log('PASS kiểm tra dữ liệu đầu vào và các mốc chuyển bậc.');
