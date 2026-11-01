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

      form.createResponse()
        .withItemResponse(nameItem.asTextItem().createResponse(studentName))
        .withItemResponse(idItem.asTextItem().createResponse(studentId))
        .withItemResponse(checkboxItem.asCheckboxItem().createResponse(unique))
        .submit();
      matches.forEach(oldResponse => form.deleteResponse(oldResponse.getId()));
      return reply({ok:true, action, requestId, updated:matches.length>0});
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return reply({ok:false, action, requestId, message:String(error.message || error)});
  }
}

function findResponses(form, idItem, studentId) {
  return form.getResponses().filter(response => {
    const itemResponse = response.getItemResponses().find(r => r.getItem().getId() === idItem.getId());
    return itemResponse && String(itemResponse.getResponse()).trim() === studentId;
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

