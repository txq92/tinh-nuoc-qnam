'use strict';
const { parseVolume, calculateBill } = window.WaterCalculator;
const form = document.getElementById('water-form');
const input = document.getElementById('volume');
const startInput = document.getElementById('start-reading');
const endInput = document.getElementById('end-reading');
const error = document.getElementById('input-error');
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 10 });
const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const volumeFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 10, useGrouping: false });
let inputMethod = 'volume';
const toast = document.getElementById('calculation-toast');
let toastTimer;

function hideCalculationToast() {
  clearTimeout(toastTimer);
  toast.hidden = true;
  toast.textContent = '';
}

function showCalculationToast() {
  toast.textContent = '✓ Đã tính xong';
  toast.hidden = false;
  toastTimer = setTimeout(hideCalculationToast, 3000);
}

function render() {
  hideCalculationToast();
  error.hidden = true;
  startInput.removeAttribute('aria-invalid');
  endInput.removeAttribute('aria-invalid');
  input.removeAttribute('aria-invalid');
  if (inputMethod === 'readings') input.value = '';
  document.getElementById('total').textContent = '—';
  document.getElementById('summary').textContent = 'Nhập chỉ số hoặc số m³ để tính.';
  document.getElementById('breakdown').replaceChildren();
  try {
    let volume;
    if (inputMethod === 'volume') {
      if (!input.value.trim()) return;
      try {
        volume = parseVolume(input.value);
      } catch (exception) {
        input.setAttribute('aria-invalid', 'true');
        throw exception;
      }
    } else {
    const readings = [startInput, endInput].map(field => {
      if (!field.value.trim()) return null;
      try {
        return parseVolume(field.value);
      } catch (exception) {
        field.setAttribute('aria-invalid', 'true');
        throw exception;
      }
    });
    if (readings.includes(null)) return;
    const [start, end] = readings;
    if (end < start) {
      endInput.setAttribute('aria-invalid', 'true');
      throw new RangeError('Số cuối phải lớn hơn hoặc bằng số đầu.');
    }
    // Remove floating-point subtraction noise for decimal meter readings.
    volume = Number((end - start).toFixed(10));
    input.value = volumeFormat.format(volume);
    }
    const bill = calculateBill(volume);
    document.getElementById('total').textContent = money.format(bill.total);
    document.getElementById('summary').textContent = `${number.format(bill.volume)} m³ trong kỳ`;
    const rows = bill.rows.map(row => {
      const tr = document.createElement('tr');
      if (row.used === 0) tr.className = 'unused';
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = `${row.label} · ${row.range}`;
      const rate = document.createElement('small');
      rate.textContent = `${money.format(row.rate)} đ / m³`;
      label.append(rate);
      const used = document.createElement('td');
      used.textContent = `${number.format(row.used)} m³`;
      const amount = document.createElement('td');
      amount.textContent = `${money.format(row.amount)} ₫`;
      tr.append(label, used, amount);
      return tr;
    });
    document.getElementById('breakdown').replaceChildren(...rows);
    showCalculationToast();
  } catch (exception) {
    error.textContent = exception.message;
    error.hidden = false;
    document.getElementById('total').textContent = '—';
    document.getElementById('summary').textContent = 'Vui lòng kiểm tra lượng nước đã nhập.';
    document.getElementById('breakdown').replaceChildren();
  }
}

form.addEventListener('submit', event => { event.preventDefault(); render(); });
input.addEventListener('input', () => { inputMethod = 'volume'; render(); });
startInput.addEventListener('input', () => { inputMethod = 'readings'; render(); });
endInput.addEventListener('input', () => { inputMethod = 'readings'; render(); });
render();
