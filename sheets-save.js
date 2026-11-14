(function () {
  'use strict';
  const config = window.GoogleSheetsConfig;
  const electric = document.body.dataset.calculator === 'electricity';
  const button = document.getElementById('save-sheet');
  const status = document.getElementById('save-status');
  const period = document.getElementById('save-period');
  const endpoint = document.getElementById('sheets-endpoint');
  const accessCode = document.getElementById('sheets-access-code');
  const settings = document.getElementById('sheets-settings');
  let master = null, split = null, saving = false, savedKey = '', savedNotice = '', pending = null;
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  period.value = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}`;
  try { endpoint.value = config.endpoint || localStorage.getItem('utility-sheets-endpoint') || ''; }
  catch (_) { endpoint.value = config.endpoint || ''; }
  settings.open = !endpoint.value;

  function validatedEndpoint(value) {
    const url = new URL(value);
    if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) || url.search || url.hash) {
      throw new Error('Nhập URL Web App dạng https://script.google.com/macros/s/…/exec.');
    }
    return url.href;
  }

  function snapshot() {
    if (!master) throw new Error('Hãy tính điện hoặc nước trước khi lưu.');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period.value)) throw new Error('Vui lòng chọn kỳ tính.');
    const hasHouse = document.getElementById('house-one').value.trim() || document.getElementById('house-two').value.trim();
    if (hasHouse && !split) throw new Error('Nhập đủ số thực tế hợp lệ của cả hai nhà trước khi lưu.');
    return {
      period: period.value, type: electric ? 'electricity' : 'water',
      input: { method: master.inputMethod, volume: master.volume,
        start: master.startReading, end: master.endReading,
        houseOne: hasHouse ? split.firstVolume : null, houseTwo: hasHouse ? split.secondVolume : null }
    };
  }

  function update(resetNotice = false) {
    if (saving) return;
    try {
      const key = JSON.stringify(snapshot());
      button.disabled = key === savedKey;
      button.textContent = key === savedKey ? 'Đã lưu kết quả này' : 'Lưu vào Google Sheets';
      if (resetNotice) {
        status.textContent = key === savedKey ? savedNotice : 'Kết quả hiện tại chưa được lưu. Bấm nút để lưu vào tab Lich_su_dien_nuoc.';
        status.setAttribute('data-state', key === savedKey ? 'success' : 'idle');
      }
    } catch (error) {
      button.disabled = true;
      button.textContent = 'Lưu vào Google Sheets';
      if (resetNotice) {
        status.textContent = error.message;
        status.setAttribute('data-state', 'idle');
      }
    }
  }

  function sendRecord(url, request) {
    return new Promise((resolve, reject) => {
      const frame = document.createElement('iframe');
      frame.hidden = true;
      frame.title = 'Kết nối lưu Google Sheets';
      const nonce = crypto.randomUUID();
      let source = null;
      const target = new URL(url);
      target.searchParams.set('nonce', nonce);
      target.searchParams.set('parentOrigin', window.location.origin);
      const timer = setTimeout(() => finish(new Error('Chưa nhận được xác nhận từ Google. Bạn có thể thử lưu lại; lần thử lại dùng cùng mã để tránh ghi trùng.')), 45000);
      function finish(error, result) {
        clearTimeout(timer);
        window.removeEventListener('message', receive);
        frame.remove();
        if (error) reject(error); else resolve(result);
      }
      function receive(event) {
        const data = event.data;
        if (!/^https:\/\/[a-z0-9-]+(?:-script)?\.googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
        if (!data || data.channel !== 'utility-sheets' || data.nonce !== nonce) return;
        if (data.type === 'ready' && !source) {
          source = event.source;
          source.postMessage({ channel: 'utility-sheets', nonce, type: 'save', request }, event.origin);
        } else if (data.type === 'result' && event.source === source) {
          const result = data.result;
          if (!result || !result.ok || result.id !== request.record.id) finish(new Error(result?.error || 'Google chưa xác nhận lưu thành công.'));
          else finish(null, result);
        }
      }
      window.addEventListener('message', receive);
      frame.src = target.href;
      document.body.append(frame);
    });
  }

  button.addEventListener('click', async () => {
    if (saving) return;
    try {
      const data = snapshot();
      if (!endpoint.value.trim() || !accessCode.value) {
        settings.open = true;
        throw new Error('Mở phần kết nối bên dưới để nhập URL Web App và mã lưu.');
      }
      if (accessCode.value.length < 16) {
        settings.open = true;
        throw new Error('Mã lưu phải có ít nhất 16 ký tự và khớp SAVE_ACCESS_CODE trong Apps Script.');
      }
      const url = validatedEndpoint(endpoint.value.trim());
      const key = JSON.stringify(data);
      if (!pending || pending.key !== key || pending.url !== url) pending = { key, url, record: { id: crypto.randomUUID(), ...data } };
      try { localStorage.setItem('utility-sheets-endpoint', url); } catch (_) { /* Optional preference only. */ }
      saving = true;
      button.disabled = true;
      button.textContent = 'Đang lưu…';
      status.textContent = 'Đang chờ Google xác nhận…';
      status.setAttribute('data-state', 'saving');
      const result = await sendRecord(url, { accessCode: accessCode.value, record: pending.record });
      savedKey = key;
      savedNotice = `✓ Đã lưu kỳ ${data.period} vào tab Lich_su_dien_nuoc, dòng ${result.row}${result.duplicate ? ' (đã có, không ghi trùng)' : ''}.`;
      let currentKey = '';
      try { currentKey = JSON.stringify(snapshot()); } catch (_) { /* Form may have changed while saving. */ }
      status.textContent = savedNotice + (currentKey === key ? '' : ' Dữ liệu hiện tại đã thay đổi và chưa được lưu.');
      status.setAttribute('data-state', 'success');
    } catch (error) {
      status.textContent = error.message;
      status.setAttribute('data-state', 'error');
    } finally {
      saving = false;
      update();
    }
  });
  endpoint.addEventListener('input', () => { savedKey = ''; update(true); });
  accessCode.addEventListener('input', () => update(true));
  period.addEventListener('input', () => update(true));
  document.addEventListener('utility-bill-change', event => { master = event.detail; update(true); });
  document.addEventListener('utility-split-change', event => { split = event.detail; update(true); });
  update();
})();
