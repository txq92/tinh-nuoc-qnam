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
  const displayQuantity = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 });
  const detailedMoney = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
  let master = null;

  function renderHouseCalculation(split, house) {
    const isFirst = house === 1;
    const actual = isFirst ? split.firstVolume : split.secondVolume;
    const billed = isFirst ? split.firstBilledVolume : split.secondBilledVolume;
    const subtotal = isFirst ? split.firstSubtotal : split.secondSubtotal;
    const vat = isFirst ? split.firstVat : split.secondVat;
    const total = isFirst ? split.firstTotal : split.secondTotal;
    const container = document.getElementById(`house-${house}-calculation`);
    const heading = document.createElement('h3');
    heading.textContent = '1. Lượng dùng tính tiền';
    const formula = document.createElement('p');
    if (split.discrepancy < 0) {
      formula.textContent = `${quantities.format(split.volume)} × ${quantities.format(actual)} / (${quantities.format(split.firstVolume)} + ${quantities.format(split.secondVolume)}) ≈ ${displayQuantity.format(billed)} ${unit}`;
    } else if (split.discrepancy > 0) {
      formula.textContent = `${quantities.format(actual)} + ${quantities.format(split.discrepancy)} / 2 ≈ ${displayQuantity.format(billed)} ${unit}`;
    } else {
      formula.textContent = `${quantities.format(actual)} ${unit} thực tế = ${displayQuantity.format(billed)} ${unit} tính tiền.`;
    }
    const tierHeading = document.createElement('h3');
    tierHeading.textContent = '2. Tiền theo từng bậc';
    const explanation = document.createElement('p');
    explanation.textContent = 'Chia đều định mức giá thấp. Phần không dùng hết chuyển cho nhà kia.';
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    caption.textContent = `Chi tiết Nhà ${house}`;
    const body = document.createElement('tbody');
    let rawTotal = 0;
    for (const row of split.rows) {
      const used = isFirst ? row.firstUsed : row.secondUsed;
      const amount = used * row.rate;
      rawTotal += amount;
      const tr = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = row.label;
      const calculation = document.createElement('td');
      calculation.textContent = `${displayQuantity.format(used)} ${unit} × ${money.format(row.rate)} ≈ ${detailedMoney.format(amount)} đ`;
      tr.append(label, calculation);
      body.append(tr);
    }
    table.append(caption, body);
    const rounding = document.createElement('p');
    rounding.textContent = `Cộng các bậc ≈ ${detailedMoney.format(rawTotal)} đ; làm tròn: ${money.format(Math.round(rawTotal))} đ.`;
    const adjustment = document.createElement('p');
    const correction = subtotal - Math.round(rawTotal);
    adjustment.textContent = correction === 0 ? '' : `Cân đối làm tròn với hóa đơn chung: ${correction > 0 ? '+' : ''}${money.format(correction)} đ.`;
    adjustment.hidden = correction === 0;
    const finalHeading = document.createElement('h3');
    finalHeading.textContent = '3. Tiền phải trả';
    const final = document.createElement('p');
    final.className = 'house-final';
    final.textContent = isElectricity
      ? `${money.format(subtotal)} đ trước thuế + ${money.format(vat)} đ VAT = ${money.format(total)} đ`
      : `${money.format(total)} đ`;
    const tax = document.createElement('p');
    tax.hidden = !isElectricity;
    tax.textContent = `VAT 8%: ${money.format(subtotal)} × 8% ≈ ${money.format(Math.round(subtotal * 0.08))} đ.`;
    const taxCorrection = vat - Math.round(subtotal * 0.08);
    if (taxCorrection !== 0) tax.textContent += ` Cân đối thuế với hóa đơn chung: ${taxCorrection > 0 ? '+' : ''}${money.format(taxCorrection)} đ.`;
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Số lẻ hiển thị rút gọn; tiền tính theo giá trị đầy đủ. Nhà 2 nhận phần cân đối làm tròn để khớp hóa đơn chung.';
    container.replaceChildren(heading, formula, tierHeading, explanation, table, rounding, adjustment, finalHeading, tax, final, note);
  }

  function render() {
    document.dispatchEvent(new CustomEvent('utility-split-change', { detail: null }));
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
      const split = splitBill(master.volume, firstUsed, difference);
      document.getElementById('house-one-usage').textContent = `Tính tiền: ${displayQuantity.format(split.firstBilledVolume)} ${unit}`;
      document.getElementById('house-two-usage').textContent = `Tính tiền: ${displayQuantity.format(split.secondBilledVolume)} ${unit}`;
      document.getElementById('split-adjustment-note').textContent = difference < 0
        ? 'Chênh lệch âm: giảm theo tỷ lệ sử dụng, giữ nguyên số thực tế.'
        : difference > 0 ? 'Chênh lệch dương: chia đều phần dư cho 2 nhà.' : 'Không có chênh lệch.';
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
      renderHouseCalculation(split, 1);
      renderHouseCalculation(split, 2);
      results.hidden = false;
      document.dispatchEvent(new CustomEvent('utility-split-change', { detail: split }));
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
