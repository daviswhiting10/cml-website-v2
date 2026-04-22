// CML Session Matcher Assessment
// External script — no inline JS, no inline handlers, CSP-safe
(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  var state = {
    gradYear: null,
    position: null,
  };

  var modal    = null;
  var injected = false;

  // ============================================================
  // HELPERS
  // ============================================================
  function showScreen(n) {
    var screens = modal.querySelectorAll('.assessment-screen');
    screens.forEach(function (el) { el.classList.remove('active'); });
    var target = modal.querySelector('.assessment-screen[data-screen="' + n + '"]');
    if (target) {
      target.classList.add('active');
      var inner = modal.querySelector('.assessment-inner');
      if (inner) inner.scrollTop = 0;
      var focusable = target.querySelectorAll('button,input,select,a[href]');
      if (focusable.length) focusable[0].focus();
    }
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    state.gradYear = null;
    state.position = null;
    showScreen(0);
  }

  function openAssessment() {
    if (!injected) injectModal();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    showScreen(0);
  }

  // ============================================================
  // RESULT LOGIC
  // ============================================================
  function computeResult() {
    var yr  = parseInt(state.gradYear, 10);
    var pos = state.position;
    var session, group;

    if (yr >= 2033 && yr <= 2036) {
      session = '10:00 AM Session (Grad Years 2036\u20132033)';
    } else {
      session = '11:00 AM Session (Grad Years 2032\u20132026)';
    }

    if (pos === 'Attack' || pos === 'Midfield') {
      group = 'Offense Group with Davis';
    } else {
      group = 'Defense Group with Jack';
    }

    return session + ' \u2014 ' + group;
  }

  // ============================================================
  // BUILD MODAL HTML
  // ============================================================
  function buildModalHTML() {
    var yearOptions = '';
    for (var y = 2026; y <= 2037; y++) {
      yearOptions += '<option value="' + y + '">' + y + '</option>';
    }

    return '<div class="assessment-inner">'

      // Close button
      + '<button class="assessment-close" id="assessment-close-btn" aria-label="Close">&times;</button>'

      // ---- Screen 0: Intro ----
      + '<div class="assessment-screen active" data-screen="0">'
      + '<h2 class="assessment-headline">What session should I choose?</h2>'
      + '<p class="assessment-subhead">Take the assessment to find out.</p>'
      + '<div class="assessment-btn-row"><button class="btn btn-white" id="assessment-begin-btn">Begin</button></div>'
      + '</div>'

      // ---- Screen 1: Graduation Year ----
      + '<div class="assessment-screen" data-screen="1">'
      + '<div class="assessment-q-label">Question 1 of 2</div>'
      + '<div class="assessment-question">What is your player\'s graduation year?</div>'
      + '<select class="assessment-select" id="select-gradyear">'
      + '<option value="">Select grad year&hellip;</option>'
      + yearOptions
      + '</select>'
      + '<div class="assessment-btn-row" style="margin-top:1.5rem;"><button class="btn btn-white" id="gradyear-next-btn">Next &rarr;</button></div>'
      + '</div>'

      // ---- Screen 2: Position ----
      + '<div class="assessment-screen" data-screen="2">'
      + '<div class="assessment-q-label">Question 2 of 2</div>'
      + '<div class="assessment-question">What position does your player play?</div>'
      + '<div class="assessment-options">'
      + ['Attack', 'Midfield', 'LSM', 'Close Defense'].map(function (p) {
          return '<label class="assessment-option">'
            + '<input type="radio" name="position" value="' + p + '">'
            + '<span>' + p + '</span>'
            + '</label>';
        }).join('')
      + '</div>'
      + '<div class="assessment-btn-row"><button class="btn btn-white" id="position-next-btn">See My Recommendation &rarr;</button></div>'
      + '</div>'

      // ---- Screen 3: Result ----
      + '<div class="assessment-screen" data-screen="3">'
      + '<div class="assessment-q-label">Your Recommendation</div>'
      + '<div class="assessment-match" id="assessment-result-text"></div>'
      + '<div class="assessment-btn-row">'
      + '<a href="book.html" class="btn btn-white">Register for the Next Clinic &rarr;</a>'
      + '</div>'
      + '</div>'

      + '</div>'; // end .assessment-inner
  }

  // ============================================================
  // INJECT MODAL INTO DOM
  // ============================================================
  function injectModal() {
    modal = document.createElement('div');
    modal.id = 'cml-assessment-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Find your session');
    modal.innerHTML = buildModalHTML();
    document.body.appendChild(modal);
    injected = true;

    bindOptionClick();
    bindEvents();
  }

  // ============================================================
  // OPTION CLICK STYLING
  // ============================================================
  function bindOptionClick() {
    var options = modal.querySelectorAll('.assessment-option');
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var group = opt.closest('.assessment-options');
        if (group) {
          group.querySelectorAll('.assessment-option').forEach(function (o) {
            o.classList.remove('selected');
          });
        }
        opt.classList.add('selected');
        var radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  function bindEvents() {
    // Close button
    modal.querySelector('#assessment-close-btn').addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // Focus trap
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = Array.from(modal.querySelectorAll('.assessment-screen.active button:not([disabled]),input,select,a[href]'));
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Screen 0 — Begin
    modal.querySelector('#assessment-begin-btn').addEventListener('click', function () {
      showScreen(1);
    });

    // Screen 1 — Grad year Next
    modal.querySelector('#gradyear-next-btn').addEventListener('click', function () {
      var val = modal.querySelector('#select-gradyear').value;
      if (!val) {
        alert('Please select a graduation year before continuing.');
        return;
      }
      state.gradYear = val;
      showScreen(2);
    });

    // Screen 2 — Position Next
    modal.querySelector('#position-next-btn').addEventListener('click', function () {
      var selected = modal.querySelector('input[name="position"]:checked');
      if (!selected) {
        alert('Please select a position before continuing.');
        return;
      }
      state.position = selected.value;
      var result = computeResult();
      var el = modal.querySelector('#assessment-result-text');
      if (el) {
        el.textContent = 'Based on your answers, register your player for the ' + result + '.';
      }
      showScreen(3);
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.openAssessment = openAssessment;

  // Wire up trigger buttons on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    var triggers = document.querySelectorAll('#hero-assessment-btn, #final-assessment-btn');
    triggers.forEach(function (el) {
      el.addEventListener('click', function () { openAssessment(); });
    });
  });

})();
