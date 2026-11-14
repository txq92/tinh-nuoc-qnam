'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, ['scripts/build-google-apps-script.cjs']);

// Exercise the actual generated Apps Script with in-memory Google service adapters.
const rows = [];
let columnCount = 26;
let lockHeld = false;
const sheet = {
  getLastRow: () => rows.length,
  getMaxColumns: () => columnCount,
  insertColumnsAfter: (after, count) => { assert.equal(after, columnCount); columnCount += count; },
  appendRow: row => rows.push(Array.from(row)),
  setFrozenRows() {},
  getRange: (start, column, count, width) => ({
    setFontWeight() { return this; }, setBackground() { return this; }, setNumberFormat() { return this; },
    getValues: () => rows.slice(start - 1, start - 1 + count).map(row => row.slice(column - 1, column - 1 + width)),
    createTextFinder: id => ({ matchEntireCell() { return this; }, findNext() {
      const index = rows.findIndex((row, i) => i > 0 && row[0] === id);
      return index < 0 ? null : { getRow: () => index + 1 };
    } })
  })
};
const accessCode = 'local-test-access-code-only';
const server = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: name => name === 'SAVE_ACCESS_CODE' ? accessCode : null }) },
  Utilities: { formatDate: (_date, zone) => { assert.equal(zone, 'Asia/Bangkok'); return '2026-11-14 12:00:00'; } },
  LockService: { getScriptLock: () => ({ waitLock() { lockHeld = true; }, releaseLock() { lockHeld = false; } }) },
  SpreadsheetApp: { openById: id => { assert.equal(id, '1VO9q08GkoNdp68kOqoovL6dkpAXFpSQISW8iCxPB9Lo'); return {
    getSheetByName: () => rows.length ? sheet : null,
    insertSheet: name => { assert.equal(name, 'Lich_su_dien_nuoc'); return sheet; }
  }; }, flush() {} }
});
vm.runInContext(fs.readFileSync('google-apps-script/Code.gs', 'utf8'), server);
const record = {
  id: '00000000-0000-4000-8000-000000000001', period: '2026-11', type: 'water',
  input: { method: 'volume', volume: 100, start: null, end: null, houseOne: 20, houseTwo: 90 },
  total: 1 // Deliberately wrong client total must be ignored.
};
assert.throws(() => server.saveUtilityRecord({ accessCode: 'wrong', record }), /Mã lưu/);
assert.equal(rows.length, 0);
const result = server.saveUtilityRecord({ accessCode, record });
assert.equal(result.ok, true);
assert.equal(rows.length, 2);
assert.equal(rows[1][12], 1428990);
assert.equal(rows[1][13], 20);
assert.equal(rows[1][14], 90);
assert.equal(rows[1][15], -10);
assert.equal(rows[1][20] + rows[1][23], rows[1][12]);
assert.equal(rows[1].length, rows[0].length);
assert.equal(columnCount, rows[0].length);
assert(!JSON.stringify(rows).includes(accessCode));
assert.equal(lockHeld, false);
assert.equal(server.saveUtilityRecord({ accessCode, record }).duplicate, true);
assert.equal(rows.length, 2);
const electricRecord = JSON.parse(JSON.stringify(record));
electricRecord.id = '00000000-0000-4000-8000-000000000002';
electricRecord.type = 'electricity';
electricRecord.input = { method: 'readings', volume: 1000, start: 1000, end: 2000, houseOne: 200, houseTwo: 700 };
server.saveUtilityRecord({ accessCode, record: electricRecord });
assert.equal(rows[2][9], 3187800);
assert.equal(rows[2][11], 255024);
assert.equal(rows[2][12], 3442824);
assert.equal(rows[2][20] + rows[2][23], rows[2][12]);
assert.equal(rows[2][19] + rows[2][22], rows[2][11]);
const onlyMaster = JSON.parse(JSON.stringify(record));
onlyMaster.id = '00000000-0000-4000-8000-000000000003';
onlyMaster.input.houseOne = onlyMaster.input.houseTwo = null;
server.saveUtilityRecord({ accessCode, record: onlyMaster });
assert.equal(rows[3][13], '');
assert.equal(rows[3][24], '');
const invalid = JSON.parse(JSON.stringify(electricRecord));
invalid.input.end = 2001;
assert.throws(() => server.saveUtilityRecord({ accessCode, record: invalid }), /không khớp/);
invalid.input.end = 2000;
invalid.input.houseTwo = null;
assert.throws(() => server.saveUtilityRecord({ accessCode, record: invalid }), /Nhà 2/);
assert.equal(rows.length, 4);
console.log('PASS server: authorization, recalculation, water negative discrepancy, electricity VAT, deduplication and invalid input.');

class Element {
  constructor() { this.value = ''; this.textContent = ''; this.hidden = false; this.children = []; this.listeners = {}; this.attributes = {}; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  remove() { this.removed = true; }
}

async function testWebsite(electric) {
  const html = fs.readFileSync(electric ? 'electricity.html' : 'index.html', 'utf8');
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  elements['usage-discrepancy'].value = '0';
  const listeners = {}, messages = new Set(), timers = new Map();
  let sequence = 0;
  const document = {
    body: { dataset: { calculator: electric ? 'electricity' : 'water' }, children: [], append(node) { this.children.push(node); } },
    getElementById: id => elements[id], createElement: () => new Element(),
    addEventListener: (name, callback) => { (listeners[name] ||= []).push(callback); },
    dispatchEvent: event => { (listeners[event.type] || []).forEach(callback => callback(event)); }
  };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  const context = vm.createContext({
    document, CustomEvent, Intl, URL,
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` },
    location: { origin: 'https://txq92.github.io' },
    localStorage: { getItem: () => null, setItem(name, value) { assert.equal(name, 'utility-sheets-endpoint'); assert(!value.includes(accessCode)); } },
    setTimeout: (callback, ms) => { const id = ++sequence; timers.set(id, { callback, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    addEventListener: (name, callback) => { if (name === 'message') messages.add(callback); },
    removeEventListener: (name, callback) => { if (name === 'message') messages.delete(callback); }
  });
  context.window = context;
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) vm.runInContext(fs.readFileSync(src.split('?')[0], 'utf8'), context);
  const edit = (id, value) => { elements[id].value = value; elements[id].listeners.input(); };
  assert.equal(elements['save-sheet'].disabled, true);
  edit('volume', electric ? '1000' : '100');
  assert.equal(elements['save-sheet'].disabled, false);
  edit('house-one', '20');
  assert.equal(elements['save-sheet'].disabled, true);
  edit('house-two', electric ? '1100' : '90');
  assert.equal(elements['save-sheet'].disabled, false);
  await elements['save-sheet'].listeners.click();
  assert(elements['save-status'].textContent.includes('Web App'));
  elements['sheets-endpoint'].value = 'https://script.google.com/macros/s/example/exec';
  elements['sheets-access-code'].value = accessCode;
  const saving = elements['save-sheet'].listeners.click();
  assert.equal(elements['save-sheet'].textContent, 'Đang lưu…');
  const frame = document.body.children.at(-1);
  const nonce = new URL(frame.src).searchParams.get('nonce');
  let sent = null;
  const source = { postMessage: message => { sent = message; } };
  const emit = event => [...messages].forEach(callback => callback(event));
  const origin = 'https://example-script.googleusercontent.com';
  emit({ origin: 'https://attacker.invalid', source, data: { channel: 'utility-sheets', nonce, type: 'ready' } });
  assert.equal(sent, null);
  emit({ origin, source, data: { channel: 'utility-sheets', nonce, type: 'ready' } });
  assert.equal(sent.request.record.input.houseOne, 20);
  assert.equal(sent.request.record.input.houseTwo, electric ? 1100 : 90);
  const requestId = sent.request.record.id;
  emit({ origin, source: {}, data: { channel: 'utility-sheets', nonce, type: 'result', result: { ok: true, id: requestId, row: 5 } } });
  assert.equal(elements['save-sheet'].textContent, 'Đang lưu…');
  emit({ origin, source, data: { channel: 'utility-sheets', nonce, type: 'result', result: { ok: true, id: requestId, row: 5 } } });
  await saving;
  assert(elements['save-status'].textContent.includes('Đã lưu'));
  assert.equal(elements['save-sheet'].disabled, true);
  assert.equal(frame.removed, true);
  edit('house-two', electric ? '1050' : '80');
  assert.equal(elements['save-sheet'].disabled, false);
  const timedOutSave = elements['save-sheet'].listeners.click();
  const timedOutFrame = document.body.children.at(-1);
  const timedOutNonce = new URL(timedOutFrame.src).searchParams.get('nonce');
  emit({ origin, source, data: { channel: 'utility-sheets', nonce: timedOutNonce, type: 'ready' } });
  const timedOutId = sent.request.record.id;
  const timeout = [...timers.values()].find(timer => timer.ms === 45000);
  timeout.callback();
  await timedOutSave;
  assert(elements['save-status'].textContent.includes('Chưa nhận'));
  const retry = elements['save-sheet'].listeners.click();
  const retryFrame = document.body.children.at(-1);
  const retryNonce = new URL(retryFrame.src).searchParams.get('nonce');
  emit({ origin, source, data: { channel: 'utility-sheets', nonce: retryNonce, type: 'ready' } });
  const retryId = sent.request.record.id;
  assert.equal(retryId, timedOutId);
  emit({ origin, source, data: { channel: 'utility-sheets', nonce: retryNonce, type: 'result', result: { ok: true, id: retryId, row: 6, duplicate: true } } });
  await retry;
  assert(elements['save-status'].textContent.includes('không ghi trùng'));
  console.log(`PASS ${electric ? 'electricity' : 'water'} website: snapshots, incomplete split, confirmed save, origin/source checks, timeout and retry.`);
}
function testBridge() {
  const posted = [];
  let receive, success, failure, saved;
  const top = { postMessage: (data, origin) => posted.push({ data, origin }) };
  const run = {
    withSuccessHandler(fn) { success = fn; return this; },
    withFailureHandler(fn) { failure = fn; return this; },
    saveUtilityRecord(request) { saved = request; }
  };
  const config = { origin: 'https://txq92.github.io', nonce: '00000000-0000-4000-8000-000000000001' };
  const script = fs.readFileSync('google-apps-script/Bridge.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('<?!= configJson ?>', JSON.stringify(config));
  vm.runInNewContext(script, { window: { top, addEventListener: (_name, callback) => { receive = callback; } }, google: { script: { run } } });
  assert.equal(posted[0].data.type, 'ready');
  const data = { channel: 'utility-sheets', nonce: config.nonce, type: 'save', request: { accessCode, record } };
  receive({ source: top, origin: 'https://attacker.invalid', data });
  assert.equal(saved, undefined);
  receive({ source: top, origin: config.origin, data });
  assert.equal(saved.record.id, record.id);
  assert.equal(typeof failure, 'function');
  success({ ok: true, id: record.id, row: 2 });
  assert.equal(posted.at(-1).data.type, 'result');
  assert.equal(posted.at(-1).data.result.ok, true);
  assert.equal(posted.at(-1).origin, config.origin);
  console.log('PASS Apps Script bridge: trusted parent, Google callback and confirmed result.');
}
(async () => { testBridge(); await testWebsite(false); await testWebsite(true); })().catch(error => { console.error(error); process.exitCode = 1; });
