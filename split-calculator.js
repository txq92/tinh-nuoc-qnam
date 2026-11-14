(function (root) {
  'use strict';
  function splitBill(bill, firstVolume, discrepancy = 0) {
    const totalVolume = bill.volume;
    if (typeof firstVolume !== 'number' || !Number.isFinite(firstVolume) || firstVolume < 0 || firstVolume > totalVolume) {
      throw new RangeError('Lượng sử dụng mỗi nhà phải nằm trong tổng đồng hồ chung.');
    }
    if (typeof discrepancy !== 'number' || !Number.isFinite(discrepancy) || discrepancy < 0 || discrepancy > totalVolume - firstVolume + 1e-10) {
      throw new RangeError('Tổng nhà 1 và chênh lệch không được vượt đồng hồ chung.');
    }
    const secondVolume = Math.max(0, Number((totalVolume - firstVolume - discrepancy).toFixed(10)));
    const firstBilledVolume = firstVolume + discrepancy / 2;
    const secondBilledVolume = secondVolume + discrepancy / 2;
    let remainingFirst = firstBilledVolume;
    let remainingSecond = secondBilledVolume;
    const rows = bill.rows.map(row => {
      let firstUsed = Math.min(remainingFirst, row.used / 2);
      const secondUsed = Math.min(remainingSecond, row.used - firstUsed);
      firstUsed += row.used - firstUsed - secondUsed;
      remainingFirst = Math.max(0, remainingFirst - firstUsed);
      remainingSecond = Math.max(0, remainingSecond - secondUsed);
      return { ...row, firstUsed, secondUsed };
    });
    const firstSubtotal = Math.round(rows.reduce((sum, row) => sum + row.firstUsed * row.rate, 0));
    const secondSubtotal = bill.total - firstSubtotal;
    const firstVat = Math.round(firstSubtotal * (bill.vatRate || 0));
    const secondVat = (bill.vatAmount || 0) - firstVat;
    const firstTotal = firstSubtotal + firstVat;
    const secondTotal = secondSubtotal + secondVat;
    return {
      volume: totalVolume, firstVolume, secondVolume, discrepancy,
      firstBilledVolume, secondBilledVolume, firstSubtotal, secondSubtotal,
      firstVat, secondVat, firstTotal, secondTotal,
      total: bill.totalWithVat ?? bill.total, rows
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { splitBill };
  else root.UtilityBillSplitter = { splitBill };
})(typeof globalThis !== 'undefined' ? globalThis : this);
