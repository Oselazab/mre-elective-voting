function doPost(e) {
  const action = String(e.parameter.action || "");
  const studentName = String(e.parameter.studentName || "").trim();
  const studentId = String(e.parameter.studentId || "").trim();
  const requestId = String(e.parameter.requestId || "");

  try {
    if (!studentName || !studentId) throw new Error("Enter both your name and student ID.");
    const form = FormApp.getActiveForm();
    const items = form.getItems();
    const nameItem = items.find(item => String(item.getTitle() || "").trim() === "Student name");
    const idItem = items.find(item => String(item.getTitle() || "").trim() === "Student ID");
    const checkboxItem = items.find(item => item.getType() === FormApp.ItemType.CHECKBOX);
    if (!nameItem || !idItem || !checkboxItem) throw new Error("The vote fields could not be found.");

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const matches = findResponses(form, idItem, studentId);
      if (action === "lookup") {
        if (!matches.length) return reply({ok:true, action, requestId, found:false});
        const latest = matches[matches.length - 1];
        const checkboxResponse = latest.getItemResponses().find(r => r.getItem().getId() === checkboxItem.getId());
        return reply({ok:true, action, requestId, found:true, courses:checkboxResponse ? checkboxResponse.getResponse() : []});
      }
      if (action !== "save") throw new Error("That action is not available.");

      const courseLabels = (e.parameters.course || []).map(value => String(value));
      const allowed = checkboxItem.asCheckboxItem().getChoices().map(choice => choice.getValue());
      const unique = Array.from(new Set(courseLabels));
      if (unique.length !== 6 || unique.some(value => !allowed.includes(value))) {
        throw new Error("Select exactly six available courses.");
      }

      const savedResponse = form.createResponse()
        .withItemResponse(nameItem.asTextItem().createResponse(studentName))
        .withItemResponse(idItem.asTextItem().createResponse(studentId))
        .withItemResponse(checkboxItem.asCheckboxItem().createResponse(unique))
        .submit();
      matches.forEach(oldResponse => form.deleteResponse(oldResponse.getId()));
      if (matches.length) deduplicateResponseSheet(form, studentId);
      cacheResponseId(studentId, savedResponse.getId());
      return reply({ok:true, action, requestId, updated:matches.length>0});
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return reply({ok:false, action, requestId, message:String(error.message || error)});
  }
}

function findResponses(form, idItem, studentId) {
  const wanted = normalizeStudentId(studentId);
  const cachedId = getCachedResponseId(studentId);
  if (cachedId) {
    try {
      const cachedResponse = form.getResponse(cachedId);
      const cachedItem = cachedResponse.getItemResponses().find(r => r.getItem().getId() === idItem.getId());
      if (cachedItem && normalizeStudentId(cachedItem.getResponse()) === wanted) return [cachedResponse];
    } catch (error) {
      // A deleted or expired cached response falls through to the full lookup.
    }
  }
  const responses = form.getResponses().filter(response => {
    const itemResponse = response.getItemResponses().find(r => r.getItem().getId() === idItem.getId());
    return itemResponse && normalizeStudentId(itemResponse.getResponse()) === wanted;
  });
  if (responses.length) cacheResponseId(studentId, responses[responses.length - 1].getId());
  return responses;
}

function responseCacheKey(studentId) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalizeStudentId(studentId));
  return "response:" + Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, "");
}

function getCachedResponseId(studentId) {
  return CacheService.getScriptCache().get(responseCacheKey(studentId));
}

function cacheResponseId(studentId, responseId) {
  CacheService.getScriptCache().put(responseCacheKey(studentId), responseId, 21600);
}

function normalizeStudentId(value) {
  return String(value == null ? "" : value).trim().replace(/\s+/g, "").toUpperCase();
}

function deduplicateResponseSheet(form, studentId) {
  const spreadsheetId = form.getDestinationId();
  if (!spreadsheetId) return;
  const wanted = normalizeStudentId(studentId);
  SpreadsheetApp.openById(spreadsheetId).getSheets().some(sheet => {
    const rowCount = sheet.getLastRow();
    const columnCount = sheet.getLastColumn();
    if (rowCount < 2 || columnCount < 1) return false;
    const header = sheet.getRange(1, 1, 1, columnCount).getDisplayValues()[0];
    const idColumn = header.findIndex(value => String(value).trim() === "Student ID");
    if (idColumn < 0) return false;
    const ids = sheet.getRange(2, idColumn + 1, rowCount - 1, 1).getDisplayValues();
    const matches = ids.map((row, index) => normalizeStudentId(row[0]) === wanted ? index + 2 : -1)
      .filter(rowNumber => rowNumber > 0)
      .sort((a, b) => b - a);
    // Keep the newest row; delete only older matches, bottom-up, grouping adjacent rows.
    const oldRows = matches.slice(1);
    for (let index = 0; index < oldRows.length;) {
      let end = oldRows[index];
      let start = end;
      index++;
      while (index < oldRows.length && oldRows[index] === start - 1) {
        start = oldRows[index];
        index++;
      }
      sheet.deleteRows(start, end - start + 1);
    }
    return true;
  });
}

function reply(data) {
  const payload = encodeURIComponent(JSON.stringify(data));
  const html = '<!doctype html><html><body><script>' +
    'window.top.postMessage({source:"mre-voting-backend",payload:"' + payload + '"},"*");' +
    '</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function authorizeSpreadsheetAccess() {
  return SpreadsheetApp.openById(FormApp.getActiveForm().getDestinationId()).getName();
}

