(function () {
  'use strict';
  const isElectricity = document.body.dataset.calculator === 'electricity';
  const { parseVolume, splitBill } = isElectricity ? window.ElectricityCalculator : window.WaterCalculator;
  const unit = isElectricity ? 'kWh' : 'm³';
  const first = document.getElementById('house-one');
  const second = document.getElementById('house-two');
  const discrepancy = document.getElementById('usage-discrepancy');
  const error = document.getElementById('split-error');
  const results = document.getElementById('split-results');
  const meter = document.getElementById('split-meter');
  const quantities = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 10, useGrouping: false });
  const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
  let master = null;

  function render() {
    error.hidden = true;
    results.hidden = true;
    first.removeAttribute('aria-invalid');
    second.removeAttribute('aria-invalid');
    discrepancy.removeAttribute('aria-invalid');
    discrepancy.value = '0';
    if (!master) {
      meter.textContent = `Nhập tổng số ${unit} hợp lệ ở phần tính tiền phía trên.`;
      return;
    }
    const masterTotal = master.totalWithVat ?? master.total;
    meter.textContent = `Đồng hồ chung: ${quantities.format(master.volume)} ${unit} · ${money.format(masterTotal)} ₫${isElectricity ? ' (đã VAT)' : ''}`;
    if (!first.value.trim() || !second.value.trim()) return;
    try {
      const [firstUsed, secondUsed] = [first, second].map(field => {
        try {
          return parseVolume(field.value);
        } catch (exception) {
          field.setAttribute('aria-invalid', 'true');
          throw exception;
        }
      });
      const difference = Number((master.volume - firstUsed - secondUsed).toFixed(10));
      discrepancy.value = quantities.format(difference);
      if (difference < 0) {
        discrepancy.setAttribute('aria-invalid', 'true');
        throw new RangeError(`Tổng số ${unit} hai nhà vượt đồng hồ chung. Vui lòng kiểm tra lại chỉ số.`);
      }
      const split = splitBill(master.volume, firstUsed, difference);
      document.getElementById('split-volume-equality').textContent = `Nhà 1: ${quantities.format(split.firstVolume)} + Nhà 2: ${quantities.format(split.secondVolume)} + Chênh lệch: ${quantities.format(difference)} = ${quantities.format(master.volume)} ${unit}`;
      document.getElementById('house-one-total').textContent = `${money.format(split.firstTotal)} ₫`;
      document.getElementById('house-two-total').textContent = `${money.format(split.secondTotal)} ₫`;
      document.getElementById('split-total').textContent = `${money.format(split.firstTotal + split.secondTotal)} ₫`;
      document.getElementById('split-master-total').textContent = `${money.format(masterTotal)} ₫`;
      document.getElementById('split-equality').textContent = `✓ ${money.format(split.firstTotal)} + ${money.format(split.secondTotal)} = ${money.format(masterTotal)} đ`;
      if (isElectricity) {
        document.getElementById('house-one-tax').textContent = `Trước thuế: ${money.format(split.firstSubtotal)} đ · VAT: ${money.format(split.firstVat)} đ`;
        document.getElementById('house-two-tax').textContent = `Trước thuế: ${money.format(split.secondSubtotal)} đ · VAT: ${money.format(split.secondVat)} đ`;
      }
      const rows = split.rows.map(row => {
        const tr = document.createElement('tr');
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = row.label;
        const rate = document.createElement('small');
        rate.textContent = `${money.format(row.rate)} đ/${unit}`;
        label.append(rate);
        const a = document.createElement('td');
        a.textContent = `${quantities.format(row.firstUsed)} ${unit}`;
        const b = document.createElement('td');
        b.textContent = `${quantities.format(row.secondUsed)} ${unit}`;
        tr.append(label, a, b);
        return tr;
      });
      document.getElementById('split-breakdown').replaceChildren(...rows);
      results.hidden = false;
    } catch (exception) {
      error.textContent = exception.message;
      error.hidden = false;
    }
  }

  first.addEventListener('input', render);
  second.addEventListener('input', render);
  document.getElementById('split-form').addEventListener('submit', event => { event.preventDefault(); render(); });
  document.addEventListener('utility-bill-change', event => { master = event.detail; render(); });
})();
