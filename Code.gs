/**
 * CML Registration — Google Apps Script Backend
 * Deploy: Extensions → Apps Script → Deploy → New deployment
 *   Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Paste the deployment URL into assets/js/book-page.js → SCRIPT_URL
 */

var SHEET_NAME  = 'CML Registrations';
var ADMIN_EMAIL = 'info@centralmdlax.com';
var LOCATION    = 'Long Reach High School\n6101 Old Dobbin Ln\nColumbia, MD 21045';

/* ── Health check ─────────────────────────────────────────────── */
function doGet(e) {
  return respond({ status: 'ok', version: '1.1', ts: new Date().toISOString() });
}

/* ── Registration handler ─────────────────────────────────────── */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    /* Required field validation */
    var required = [
      'sessionDate', 'sessionCohort',
      'athleteName', 'gradYear', 'positions',
      'parentName',  'parentEmail', 'parentPhone',
      'emergencyName', 'emergencyPhone',
      'waiverAgreed'
    ];
    for (var i = 0; i < required.length; i++) {
      var val = data[required[i]];
      if (!val || (Array.isArray(val) && !val.length)) {
        return respond({ error: 'Missing required field: ' + required[i] }, 400);
      }
    }
    if (!data.waiverAgreed) {
      return respond({ error: 'Waiver must be agreed to.' }, 400);
    }

    /* Email format sanity check */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parentEmail)) {
      return respond({ error: 'Invalid parent email address.' }, 400);
    }

    /* Write to sheet */
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 'Session Date', 'Session Time / Cohort',
        'Athlete Name', 'Club Team', 'Grade (Class of)', 'Position(s)',
        'Parent Name', 'Parent Email', 'Parent Phone',
        'Emergency Contact Name', 'Emergency Contact Phone',
        'Medical/Allergy Notes', 'Waiver Agreed', 'Source'
      ]);
      /* Freeze header row */
      sheet.setFrozenRows(1);
    }

    var positions = Array.isArray(data.positions)
      ? data.positions.join(', ')
      : String(data.positions);

    sheet.appendRow([
      new Date(),
      data.sessionDate,
      data.sessionCohort,
      data.athleteName,
      data.clubTeam || '',
      data.gradYear,
      positions,
      data.parentName,
      data.parentEmail,
      data.parentPhone,
      data.emergencyName,
      data.emergencyPhone,
      data.medicalNotes || '',
      data.waiverAgreed ? 'Y' : 'N',
      data.source || 'website-v1'
    ]);

    /* Emails — non-fatal: log errors, don't fail the registration */
    try {
      sendConfirmation(data);
      Logger.log('Confirmation email sent to: ' + data.parentEmail);
    } catch(err) {
      Logger.log('ERROR sending confirmation to ' + data.parentEmail + ': ' + err);
    }
    try {
      sendAdminNotification(data);
    } catch(err) {
      Logger.log('ERROR sending admin notification: ' + err);
    }

    return respond({ success: true });

  } catch(err) {
    Logger.log('doPost error: ' + err);
    return respond({ error: 'Server error. Please email info@centralmdlax.com.' }, 500);
  }
}

/* ── Helpers ──────────────────────────────────────────────────── */
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendConfirmation(data) {
  var subject = "You're registered — CML Clinic, " + data.sessionDate;
  var body = [
    'Hi ' + data.parentName + ',',
    '',
    data.athleteName + ' is confirmed for the CML Skill Development Clinic.',
    '',
    'DATE:     ' + data.sessionDate,
    'SESSION:  ' + data.sessionCohort,
    'LOCATION: ' + LOCATION,
    '',
    'WHAT TO BRING',
    '  — Full lacrosse gear (helmet, gloves, arm pads, stick)',
    '  — Water and a post-workout snack',
    '  — Cleats (turf or grass)',
    '',
    'WHAT TO EXPECT',
    'Attack and midfield work with Davis Whiting (4-year D1 offenseman, team captain).',
    'Defense and LSM work with Jack Simon (5-year D1 LSM / close defenseman).',
    '60 minutes of position-specific drills, live reps, and individual feedback.',
    '',
    'Questions? Reply here or reach us at ' + ADMIN_EMAIL + '.',
    '',
    '—',
    'Central Maryland Lax',
    'centralmdlax.com'
  ].join('\n');

  GmailApp.sendEmail(data.parentEmail, subject, body, {
    name:    'Central Maryland Lax',
    replyTo: ADMIN_EMAIL
  });
}

function sendAdminNotification(data) {
  var subject = 'New Registration: ' + data.athleteName + ' — ' + data.sessionDate;
  var positions = Array.isArray(data.positions)
    ? data.positions.join(', ')
    : String(data.positions);

  var body = [
    'New clinic registration received.',
    '',
    'ATHLETE:    ' + data.athleteName + '  (Class of ' + data.gradYear + ')',
    'CLUB:       ' + (data.clubTeam || '—'),
    'POSITION:   ' + positions,
    'SESSION:    ' + data.sessionDate + '  |  ' + data.sessionCohort,
    '',
    'PARENT:     ' + data.parentName,
    'EMAIL:      ' + data.parentEmail,
    'PHONE:      ' + data.parentPhone,
    '',
    'EMERGENCY:  ' + data.emergencyName + '  |  ' + data.emergencyPhone,
    'MEDICAL:    ' + (data.medicalNotes || 'None'),
    'WAIVER:     ' + (data.waiverAgreed ? 'Yes' : 'No'),
    'SOURCE:     ' + (data.source || 'website-v1'),
  ].join('\n');

  MailApp.sendEmail(ADMIN_EMAIL, subject, body, {
    name: 'CML Registration System'
  });
}
