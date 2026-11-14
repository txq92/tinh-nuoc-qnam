'use strict';
const { parseVolume, calculateBill } = window.WaterCalculator;
const form = document.getElementById('water-form');
const input = document.getElementById('volume');
const error = document.getElementById('input-error');
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 10 });
const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

function render() {
  try {
    const bill = calculateBill(parseVolume(input.value));
    error.hidden = true;
    input.removeAttribute('aria-invalid');
    document.getElementById('total').textContent = money.format(bill.total);
    document.getElementById('summary').textContent = `Cho ${number.format(bill.volume)} m³ nước sử dụng trong kỳ`;
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
    document.querySelectorAll('[data-volume]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.volume) === bill.volume));
    });
  } catch (exception) {
    error.textContent = exception.message;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    document.getElementById('total').textContent = '—';
    document.getElementById('summary').textContent = 'Vui lòng kiểm tra lượng nước đã nhập.';
    document.getElementById('breakdown').replaceChildren();
    document.querySelectorAll('[data-volume]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  }
}

form.addEventListener('submit', event => { event.preventDefault(); render(); });
input.addEventListener('input', render);
document.querySelectorAll('[data-volume]').forEach(button => {
  button.addEventListener('click', () => { input.value = button.dataset.volume; render(); });
});
render();
