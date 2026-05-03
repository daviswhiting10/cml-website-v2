/**
 * CML Registration Form — book.html logic
 *
 * SETUP: Replace the placeholder below with your Apps Script deployment URL.
 * Extensions → Apps Script → Deploy → New deployment → Web app
 * Execute as: Me | Who has access: Anyone
 */
(function () {
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEuEU55QMaYb50egJ5tJhqLhnZFdXuo6NNcdCB1EsMvP5mT_BWTxWz2_-ryetZ1t-N/exec';

  /* ── Session definitions (mirrors clinic-dates.js) ────────────── */
  var DATES = [
    { value: '2026-05-23', label: 'Saturday, May 23, 2026', badge: 'FREE' },
    { value: '2026-06-06', label: 'Saturday, June 6, 2026',  badge: '' }
  ];
  var COHORTS = [
    { value: 'S1', label: '10:00–11:00 AM',   years: 'Grad Years 2036–2033' },
    { value: 'S2', label: '11:00 AM–12:00 PM', years: 'Grad Years 2032–2026' }
  ];

  /* ── Build session date cards ──────────────────────────────────── */
  function buildDateCards() {
    var grid = document.getElementById('reg-date-grid');
    if (!grid) return;

    var params  = new URLSearchParams(window.location.search);
    var preDate = params.get('date'); // "2026-05-23"

    var html = '';
    DATES.forEach(function (d) {
      var checked = d.value === preDate;
      html += '<label class="reg-card' + (checked ? ' selected' : '') + '">'
        + '<input type="radio" name="sessionDate" value="' + escAttr(d.value) + '" required'
        + (checked ? ' checked' : '') + '>'
        + '<span class="rc-main">' + escHtml(d.label) + '</span>'
        + (d.badge ? '<span class="rc-badge">' + escHtml(d.badge) + '</span>' : '')
        + '</label>';
    });
    grid.innerHTML = html;
    wireRadioCards(grid);
  }

  /* ── Build cohort cards ────────────────────────────────────────── */
  function buildCohortCards() {
    var grid = document.getElementById('reg-cohort-grid');
    if (!grid) return;

    var html = '';
    COHORTS.forEach(function (c) {
      html += '<label class="reg-card">'
        + '<input type="radio" name="sessionCohort" value="' + escAttr(c.value) + '" required>'
        + '<span class="rc-main">' + escHtml(c.label) + '</span>'
        + '<span class="rc-sub">' + escHtml(c.years) + '</span>'
        + '</label>';
    });
    grid.innerHTML = html;
    wireRadioCards(grid);
  }

  /* ── Radio card: add/remove .selected on change ────────────────── */
  function wireRadioCards(grid) {
    grid.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        grid.querySelectorAll('.reg-card').forEach(function (c) {
          c.classList.remove('selected');
        });
        if (radio.checked) radio.closest('.reg-card').classList.add('selected');
      });
    });
  }

  /* ── Form submit ───────────────────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();
    var form      = document.getElementById('cml-reg-form');
    var submitBtn = document.getElementById('reg-submit-btn');

    hideError();

    /* Waiver */
    if (!document.getElementById('waiver-check').checked) {
      return showError('Please read and agree to the liability waiver before submitting.');
    }

    /* Session date */
    var dateRadio = form.querySelector('input[name="sessionDate"]:checked');
    if (!dateRadio) return showError('Please select a clinic date.');
    var dateObj = DATES.find(function (d) { return d.value === dateRadio.value; });

    /* Cohort */
    var cohortRadio = form.querySelector('input[name="sessionCohort"]:checked');
    if (!cohortRadio) return showError('Please select a session time.');
    var cohortObj = COHORTS.find(function (c) { return c.value === cohortRadio.value; });

    /* Positions */
    var positions = Array.from(form.querySelectorAll('input[name="position"]:checked'))
      .map(function (cb) { return cb.value; });
    if (!positions.length) return showError('Please select at least one position.');

    /* Text fields */
    var fields = {
      athleteName:   fieldVal(form, 'athleteName'),
      gradYear:      fieldVal(form, 'gradYear'),
      parentName:    fieldVal(form, 'parentName'),
      parentEmail:   fieldVal(form, 'parentEmail'),
      parentPhone:   fieldVal(form, 'parentPhone'),
      emergencyName: fieldVal(form, 'emergencyName'),
      emergencyPhone:fieldVal(form, 'emergencyPhone'),
      medicalNotes:  fieldVal(form, 'medicalNotes')
    };
    var textRequired = ['athleteName','gradYear','parentName','parentEmail','parentPhone','emergencyName','emergencyPhone'];
    for (var i = 0; i < textRequired.length; i++) {
      if (!fields[textRequired[i]]) return showError('Please fill in all required fields.');
    }

    var payload = {
      sessionDate:    dateObj.label,
      sessionCohort:  cohortObj.label + ' — ' + cohortObj.years,
      athleteName:    fields.athleteName,
      gradYear:       fields.gradYear,
      positions:      positions,
      parentName:     fields.parentName,
      parentEmail:    fields.parentEmail,
      parentPhone:    fields.parentPhone,
      emergencyName:  fields.emergencyName,
      emergencyPhone: fields.emergencyPhone,
      medicalNotes:   fields.medicalNotes,
      waiverAgreed:   true,
      source:         'website-v1'
    };

    /* Loading state */
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Submitting\u2026';

    fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success) {
        showSuccess(dateObj.label, cohortObj.label + ' \u2014 ' + cohortObj.years);
      } else {
        showError(data.error || 'Something went wrong. Please email <a href="mailto:info@centralmdlax.com">info@centralmdlax.com</a>.');
        resetBtn(submitBtn);
      }
    })
    .catch(function () {
      showError('Submission failed. Please email us at <a href="mailto:info@centralmdlax.com">info@centralmdlax.com</a> to register manually.');
      resetBtn(submitBtn);
    });
  }

  /* ── UI helpers ────────────────────────────────────────────────── */
  function showSuccess(dateLabel, cohortLabel) {
    document.getElementById('cml-reg-form').hidden = true;
    var box = document.getElementById('reg-success');
    box.hidden = false;
    var el = document.getElementById('reg-success-detail');
    if (el) el.textContent = dateLabel + ' \u00b7 ' + cohortLabel;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(msg) {
    var box = document.getElementById('reg-error');
    box.innerHTML = msg;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    document.getElementById('reg-error').hidden = true;
  }

  function resetBtn(btn) {
    btn.disabled    = false;
    btn.textContent = 'Register Now \u2192';
  }

  function fieldVal(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escAttr(s) { return escHtml(s); }

  /* ── Position checkbox visual toggle ──────────────────────────── */
  function initPositionCards() {
    document.querySelectorAll('.reg-pos-card input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        cb.closest('.reg-pos-card').classList.toggle('checked', cb.checked);
      });
    });
  }

  /* ── Init ──────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    buildDateCards();
    buildCohortCards();
    initPositionCards();
    var form = document.getElementById('cml-reg-form');
    if (form) form.addEventListener('submit', handleSubmit);
  });
})();
