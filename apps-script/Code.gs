/**
 * Backend feedback cho web "Hôm nay ngồi đâu?".
 * Dán file này vào Apps Script của Google Sheet "Cafe finder - Feedback"
 * (Tiện ích mở rộng > Apps Script), rồi Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone.
 */
var HEADERS = ["time", "who", "type", "place_id", "name", "stars", "chips", "note", "hide", "unhide", "id"];

function sheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function doGet(e) {
  var sh = sheet_();
  var values = sh.getDataRange().getValues();
  var head = values.shift();
  var rows = values.map(function (r) {
    var o = {};
    head.forEach(function (h, i) {
      var v = r[i];
      o[h] = v instanceof Date ? v.toISOString() : v;
    });
    return o;
  });
  return ContentService.createTextOutput(JSON.stringify({ rows: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = sheet_();
    var ids = sh.getLastRow() > 1 ? sh.getRange(2, 11, sh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    if (d.id && ids.indexOf(d.id) !== -1) return ok_();
    sh.appendRow([
      d.time || new Date().toISOString(),
      String(d.who || "").slice(0, 40),
      String(d.type || "feedback").slice(0, 20),
      String(d.place_id || "").slice(0, 80),
      String(d.name || "").slice(0, 200),
      d.stars || "",
      (d.chips || []).join(", ").slice(0, 200),
      String(d.note || "").slice(0, 1000),
      d.hide ? "TRUE" : "FALSE",
      d.unhide ? "TRUE" : "FALSE",
      String(d.id || "").slice(0, 60)
    ]);
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
