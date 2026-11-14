// Configure SAVE_ACCESS_CODE in Project Settings > Script properties. Never put it in GitHub.
var SAVE_SPREADSHEET_ID = '1VO9q08GkoNdp68kOqoovL6dkpAXFpSQISW8iCxPB9Lo';
var SAVE_SHEET_NAME = 'Lich_su_dien_nuoc';
var SAVE_HEADERS = [
  'Mã lưu', 'Thời gian lưu (GMT+7)', 'Kỳ tính', 'Loại', 'Cách nhập', 'Chỉ số đầu', 'Chỉ số cuối',
  'Tổng sử dụng', 'Đơn vị', 'Tiền trước thuế', 'Thuế suất', 'Tiền VAT', 'Tổng thanh toán',
  'Nhà 1 thực tế', 'Nhà 2 thực tế', 'Chênh lệch', 'Nhà 1 quy đổi', 'Nhà 2 quy đổi',
  'Nhà 1 trước thuế', 'Nhà 1 VAT', 'Nhà 1 thanh toán', 'Nhà 2 trước thuế', 'Nhà 2 VAT',
  'Nhà 2 thanh toán', 'Tổng tiền 2 nhà', 'Chi tiết bậc giá (JSON)', 'Chi tiết chia (JSON)'
];

function doGet(e) {
  var properties = PropertiesService.getScriptProperties();
  var origin = properties.getProperty('ALLOWED_ORIGIN') || 'https://txq92.github.io';
  if (!e || e.parameter.parentOrigin !== origin || !/^[a-f0-9-]{36}$/.test(e.parameter.nonce || '')) {
    return HtmlService.createHtmlOutput('Kết nối từ trang tính điện/nước để lưu kết quả.');
  }
  var template = HtmlService.createTemplateFromFile('Bridge');
  template.configJson = JSON.stringify({ origin: origin, nonce: e.parameter.nonce }).replace(/</g, '\\u003c');
  return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function saveUtilityRecord(request) {
  var secret = PropertiesService.getScriptProperties().getProperty('SAVE_ACCESS_CODE');
  if (!secret || secret.length < 16) throw new Error('Chủ bảng tính chưa cấu hình mã lưu tối thiểu 16 ký tự.');
  if (!request || typeof request.accessCode !== 'string' || request.accessCode !== secret) throw new Error('Mã lưu không đúng.');
  var data = request.record;
  if (!data || !/^[a-f0-9-]{36}$/.test(data.id || '') || !/^\d{4}-(0[1-9]|1[0-2])$/.test(data.period || '')) {
    throw new Error('Mã lưu hoặc kỳ tính không hợp lệ.');
  }
  if (data.type !== 'water' && data.type !== 'electricity') throw new Error('Loại hóa đơn không hợp lệ.');
  var calculator = data.type === 'electricity' ? globalThis.ElectricityCalculator : globalThis.WaterCalculator;
  var input = data.input;
  if (!input || typeof input.volume !== 'number') throw new Error('Thiếu lượng sử dụng.');
  var bill = calculator.calculateBill(input.volume);
  var start = '', end = '';
  if (input.method === 'readings') {
    start = requireQuantity_(input.start, 'Chỉ số đầu');
    end = requireQuantity_(input.end, 'Chỉ số cuối');
    if (end < start || Math.abs(Number((end - start).toFixed(10)) - bill.volume) > 1e-8) {
      throw new Error('Chỉ số đầu/cuối không khớp tổng sử dụng.');
    }
  } else if (input.method !== 'volume') throw new Error('Cách nhập không hợp lệ.');
  var split = null;
  if (input.houseOne !== null || input.houseTwo !== null) {
    var first = requireQuantity_(input.houseOne, 'Nhà 1');
    var second = requireQuantity_(input.houseTwo, 'Nhà 2');
    split = calculator.splitBill(bill.volume, first, Number((bill.volume - first - second).toFixed(10)));
  }
  var row = [
    data.id, Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss'), data.period, data.type === 'electricity' ? 'Điện' : 'Nước',
    input.method === 'readings' ? 'Chỉ số đầu/cuối' : 'Nhập trực tiếp', start, end,
    bill.volume, data.type === 'electricity' ? 'kWh' : 'm³', bill.total, bill.vatRate || 0,
    bill.vatAmount || 0, bill.totalWithVat === undefined ? bill.total : bill.totalWithVat,
    split ? split.firstVolume : '', split ? split.secondVolume : '', split ? split.discrepancy : '',
    split ? split.firstBilledVolume : '', split ? split.secondBilledVolume : '',
    split ? split.firstSubtotal : '', split ? split.firstVat : '', split ? split.firstTotal : '',
    split ? split.secondSubtotal : '', split ? split.secondVat : '', split ? split.secondTotal : '',
    split ? split.firstTotal + split.secondTotal : '', JSON.stringify(bill.rows), split ? JSON.stringify(split.rows) : ''
  ];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var workbook = SpreadsheetApp.openById(SAVE_SPREADSHEET_ID);
    var sheet = workbook.getSheetByName(SAVE_SHEET_NAME);
    if (!sheet) sheet = workbook.insertSheet(SAVE_SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      if (sheet.getMaxColumns() < SAVE_HEADERS.length) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), SAVE_HEADERS.length - sheet.getMaxColumns());
      }
      sheet.appendRow(SAVE_HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, SAVE_HEADERS.length).setFontWeight('bold').setBackground('#eaf4ed');
      sheet.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm:ss');
      sheet.getRange('C:C').setNumberFormat('@');
      sheet.getRange('K:K').setNumberFormat('0%');
    } else {
      var headers = sheet.getRange(1, 1, 1, SAVE_HEADERS.length).getValues()[0];
      if (JSON.stringify(headers) !== JSON.stringify(SAVE_HEADERS)) throw new Error('Tab lịch sử đã có cấu trúc khác. Hãy kiểm tra trước khi lưu.');
    }
    var lastRow = sheet.getLastRow();
    var existing = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext() : null;
    if (existing) return { ok: true, id: data.id, row: existing.getRow(), duplicate: true };
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return { ok: true, id: data.id, row: sheet.getLastRow(), duplicate: false };
  } finally {
    lock.releaseLock();
  }
}

function requireQuantity_(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e9) throw new Error(label + ' không hợp lệ.');
  return value;
}
