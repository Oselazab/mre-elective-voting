const COURSE_LABELS = [
  "CSE 427 - Identification, Estimation and Learning", "CSE 479 — Vehicle Networking and Internet of Things",
  "EEC 346 - Digital Circuit Design", "EEC 347 - Microcontroller Engineering-2",
  "EEP 316 - Building Management Systems", "EEP 326 - Power Plant Systems and Control",
  "EEP 357 - Industrial Automation 2", "EMP 316 - Finite Element Analysis",
  "EMP 318 - Engineering Optimization", "MEC 317 - HVAC Systems and Control",
  "MEC 318 - Micro- Heat Exchanger Design", "MEC 346 - Industrial Mechanisms",
  "MEC 358 - Design of Mechatronic Systems-2", "MEC 359 - Smart Materials and Structures",
  "MEC 366 - Industrial Process Control", "MEC 457 - Motion Planning",
  "MEC 458 - Introduction to Biotronics Systems", "MEC 459 - CNC Machines",
  "MEC 466 - Biomechanics and Robotics", "MEC 467 - Rehabilitation Robotics",
  "MEC 468 - Mobile Robot", "MEC 469 - Micro robotics",
  "MEC 476 - Vehicle Dynamics and Control", "MEC 477 - Autonomous Vehicles",
  "MEC 478 - Vehicle Safety and Control", "MEC 479 - Introduction to Autotronics Systems"
];

function doPost(e) {
  const action = String(e.parameter.action || "");
  const studentName = String(e.parameter.studentName || "").trim();
  const studentId = normalizeStudentId(e.parameter.studentId || "");
  const requestId = String(e.parameter.requestId || "");

  try {
    if (!studentName || !studentId) throw new Error("Enter both your name and student ID.");
    if (action !== "lookup" && action !== "save") throw new Error("That action is not available.");
    const choices = (e.parameters.course || []).map(value => String(value).trim()).filter(Boolean);
    if (action === "save" && (choices.length !== 6 || new Set(choices).size !== 6)) {
      throw new Error("Select exactly six available courses.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getBallotSheet();
      const columns = getBallotColumns(sheet);
      const rows = findBallotRows(sheet, columns.id, studentId);
      if (action === "lookup") {
        if (!rows.length) return reply({ok:true, action, requestId, found:false});
        const latest = rows[rows.length - 1];
        const raw = String(sheet.getRange(latest, columns.choices).getDisplayValue() || "");
        const saved = parseSavedChoices(raw);
        return reply({ok:true, action, requestId, found:true, courses:saved});
      }

      let rowNumber;
      if (rows.length) {
        rowNumber = rows[rows.length - 1];
        rows.slice(0, -1).reverse().forEach(row => {
          sheet.deleteRow(row);
          if (row < rowNumber) rowNumber--;
        });
      } else {
        rowNumber = sheet.getLastRow() + 1;
      }
      const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
      row[columns.timestamp - 1] = new Date();
      row[columns.name - 1] = studentName;
      row[columns.id - 1] = studentId;
      row[columns.choices - 1] = JSON.stringify(choices);
      sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
      return reply({ok:true, action, requestId, updated:rows.length > 0});
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return reply({ok:false, action, requestId, message:String(error.message || error)});
  }
}

function parseSavedChoices(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) { /* Existing linked-form rows use a comma-separated value. */ }
  return COURSE_LABELS.filter(label => raw.includes(label));
}

function getBallotSheet() {
  const cache = CacheService.getScriptCache();
  let spreadsheetId = cache.get("ballot-spreadsheet-id");
  if (!spreadsheetId) {
    spreadsheetId = FormApp.getActiveForm().getDestinationId();
    if (!spreadsheetId) throw new Error("The ballot response sheet is not connected.");
    cache.put("ballot-spreadsheet-id", spreadsheetId, 21600);
  }
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const cachedName = cache.get("ballot-sheet-name");
  if (cachedName) {
    const cachedSheet = spreadsheet.getSheetByName(cachedName);
    if (cachedSheet) return cachedSheet;
  }
  for (const sheet of spreadsheet.getSheets()) {
    if (sheet.getLastRow() < 1) continue;
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
      .map(value => String(value).trim());
    if (header.includes("Student name") && header.includes("Student ID")) {
      cache.put("ballot-sheet-name", sheet.getName(), 21600);
      return sheet;
    }
  }
  throw new Error("The ballot response sheet could not be found.");
}

function getBallotColumns(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(value => String(value).trim());
  const timestamp = headers.indexOf("Timestamp") + 1;
  const name = headers.indexOf("Student name") + 1;
  const id = headers.indexOf("Student ID") + 1;
  const choices = headers.findIndex((value, index) => index >= 3 && value !== "") + 1;
  if (!timestamp || !name || !id || choices < 4) throw new Error("The ballot response columns could not be found.");
  return {timestamp, name, id, choices};
}

function findBallotRows(sheet, idColumn, studentId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, idColumn, lastRow - 1, 1).getDisplayValues()
    .map((row, index) => normalizeStudentId(row[0]) === studentId ? index + 2 : 0)
    .filter(row => row > 0);
}

function normalizeStudentId(value) {
  return String(value == null ? "" : value).trim().replace(/\s+/g, "").toUpperCase();
}

function reply(data) {
  const payload = encodeURIComponent(JSON.stringify(data));
  const html = '<!doctype html><html><body><script>' +
    'window.top.postMessage({source:"mre-voting-backend",payload:"' + payload + '"},"*");' +
    '</script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
