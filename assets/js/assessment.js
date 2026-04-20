// CML Three Pillar Development Assessment
// External script — no inline JS, no inline handlers, CSP-safe
(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  var state = {
    screen:    0,
    answers:   {},        // keyed by question id string, e.g. 'q1' .. 'q12'
    gradYear:  '',
    position:  '',
    teamLevel: '',
    freeText:  '',
    email:     '',
  };

  var modal    = null;
  var injected = false;

  // ============================================================
  // HELPERS
  // ============================================================
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function showScreen(n) {
    var screens = modal.querySelectorAll('.assessment-screen');
    screens.forEach(function(el) { el.classList.remove('active'); });
    var target = modal.querySelector('.assessment-screen[data-screen="' + n + '"]');
    if (target) {
      target.classList.add('active');
      // scroll inner to top
      var inner = modal.querySelector('.assessment-inner');
      if (inner) inner.scrollTop = 0;
      // animate pillar bars if results screen
      if (n === 15) {
        setTimeout(animatePillarBars, 80);
      }
      // trap focus
      var focusable = target.querySelectorAll('button,input,select,textarea,a[href]');
      if (focusable.length) focusable[0].focus();
    }
    state.screen = n;
  }

  function progressCount() {
    // Q1-Q11 scored + q12 freetext = screens 2-13; count answered
    var count = 0;
    for (var i = 1; i <= 12; i++) {
      if (state.answers['q' + i] !== undefined && state.answers['q' + i] !== '') count++;
    }
    return count;
  }

  function confirmClose() {
    var prog = progressCount();
    if (prog > 0) {
      return window.confirm('You have progress in the assessment. Close and lose your answers?');
    }
    return true;
  }

  function closeModal() {
    if (!confirmClose()) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    // reset state
    state.screen    = 0;
    state.answers   = {};
    state.gradYear  = '';
    state.position  = '';
    state.teamLevel = '';
    state.freeText  = '';
    state.email     = '';
    showScreen(0);
  }

  function openAssessment() {
    if (!injected) injectModal();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    showScreen(0);
  }

  // ============================================================
  // SCORING
  // ============================================================
  function calcScores() {
    var a = state.answers;
    // Pillar 1: Q1–Q4 max 16
    var p1 = (a.q1 || 0) + (a.q2 || 0) + (a.q3 || 0) + (a.q4 || 0);
    // Pillar 2: Q5–Q8 max 16
    var p2 = (a.q5 || 0) + (a.q6 || 0) + (a.q7 || 0) + (a.q8 || 0);
    // Pillar 3: Q9–Q11 max 12 (Q12 is free text)
    var p3 = (a.q9 || 0) + (a.q10 || 0) + (a.q11 || 0);
    var total = p1 + p2 + p3; // max 44
    return { p1: p1, p2: p2, p3: p3, total: total };
  }

  function scoreLabel(pct) {
    if (pct >= 80) return 'Elite';
    if (pct >= 60) return 'Competitive';
    if (pct >= 40) return 'Building';
    return 'Developing';
  }

  function lowestPillar(scores) {
    var p1pct = (scores.p1 / 16) * 100;
    var p2pct = (scores.p2 / 16) * 100;
    var p3pct = (scores.p3 / 12) * 100;
    if (p1pct <= p2pct && p1pct <= p3pct) return 'footwork';
    if (p2pct <= p1pct && p2pct <= p3pct) return 'iq';
    return 'development';
  }

  var GAP_COPY = {
    footwork:    "Your player's athletic foundation is the biggest lever right now. At your grad year, physical development gaps compound \u2014 they get harder to close, not easier.",
    iq:          "Technical skills without lacrosse IQ plateau fast. This is usually the easiest gap to close with the right coaching environment.",
    development: "Without structured training outside team practice, individual development ceilings low. Club practice is team development \u2014 it's not the same thing.",
  };

  function sessionMatch() {
    var yr = parseInt(state.gradYear, 10) || 0;
    var pos = state.position;
    var session, group;
    if (yr >= 2033 && yr <= 2036) {
      session = '9:30 AM Session (Grad Years 2036\u20132033)';
    } else {
      session = '10:45 AM Session (Grad Years 2032\u20132026)';
    }
    if (pos === 'Attack' || pos === 'Midfield' || pos === 'Not sure yet') {
      group = 'Offense Group with Davis';
    } else {
      group = 'Defense Group with Jack';
    }
    return session + ' \u2014 ' + group;
  }

  // ============================================================
  // PILLAR BAR ANIMATION
  // ============================================================
  function animatePillarBars() {
    var bars = modal.querySelectorAll('.pillar-bar-fill[data-target-width]');
    bars.forEach(function(bar) {
      var tw = bar.getAttribute('data-target-width');
      bar.style.width = tw + '%';
    });
  }

  // ============================================================
  // BUILD RESULTS HTML
  // ============================================================
  function buildResultsScreen() {
    var scores  = calcScores();
    var totalPct = Math.round((scores.total / 44) * 100);
    var label    = scoreLabel(totalPct);
    var lowest   = lowestPillar(scores);
    var gapText  = GAP_COPY[lowest];
    var match    = sessionMatch();

    var p1pct = Math.round((scores.p1 / 16) * 100);
    var p2pct = Math.round((scores.p2 / 16) * 100);
    var p3pct = Math.round((scores.p3 / 12) * 100);

    var el = modal.querySelector('.assessment-screen[data-screen="15"]');
    if (!el) return;

    el.innerHTML = '<div class="assessment-q-label">Your Development Report</div>'
      + '<div class="assessment-score-big">' + totalPct + '</div>'
      + '<div class="assessment-score-label">' + esc(label) + '</div>'

      + '<div class="pillar-bar-wrap">'
      + '<div class="pillar-bar-label"><span>Footwork &amp; Athleticism</span><span>' + p1pct + '%</span></div>'
      + '<div class="pillar-bar-track"><div class="pillar-bar-fill" data-target-width="' + p1pct + '" style="width:0"></div></div>'
      + '</div>'

      + '<div class="pillar-bar-wrap">'
      + '<div class="pillar-bar-label"><span>Lacrosse IQ</span><span>' + p2pct + '%</span></div>'
      + '<div class="pillar-bar-track"><div class="pillar-bar-fill" data-target-width="' + p2pct + '" style="width:0"></div></div>'
      + '</div>'

      + '<div class="pillar-bar-wrap">'
      + '<div class="pillar-bar-label"><span>Individual Development</span><span>' + p3pct + '%</span></div>'
      + '<div class="pillar-bar-track"><div class="pillar-bar-fill" data-target-width="' + p3pct + '" style="width:0"></div></div>'
      + '</div>'

      + '<div class="assessment-gap">' + esc(gapText) + '</div>'

      + '<div class="assessment-match">'
      + 'Based on your answers, register your player for the ' + esc(match) + '.'
      + '</div>'

      + '<div class="assessment-btn-row">'
      + '<a href="clinic.html#clinics" class="btn btn-white">Register for the Next Clinic &rarr;</a>'
      + '<a href="book.html" class="btn btn-outline">Have questions? Book a free 15-min call &rarr;</a>'
      + '</div>';
  }

  // ============================================================
  // QUESTION SCREENS — RADIO / SCALE OPTION SELECTION
  // ============================================================
  function bindOptionClick(screen) {
    var options = screen.querySelectorAll('.assessment-option');
    options.forEach(function(opt) {
      opt.addEventListener('click', function() {
        options.forEach(function(o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        var radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });
  }

  function getSelectedValue(screen) {
    var selected = screen.querySelector('.assessment-option.selected');
    if (selected) {
      var radio = selected.querySelector('input[type="radio"]');
      return radio ? radio.value : null;
    }
    return null;
  }

  // ============================================================
  // BUILD MODAL HTML
  // ============================================================
  function buildModalHTML() {
    return '<div class="assessment-inner">'

      // Close button
      + '<button class="assessment-close" id="assessment-close-btn" aria-label="Close assessment">&times;</button>'

      // ---- Screen 0: Intro ----
      + '<div class="assessment-screen active" data-screen="0">'
      + '<div class="assessment-q-label">Three Pillar Development Assessment</div>'
      + '<h2 class="assessment-headline">Where does your player actually stand?</h2>'
      + '<p class="assessment-subhead">Five minutes. 12 scored questions. A personalized development report built around our Three Pillars &mdash; plus a clinic recommendation matched to your player&rsquo;s grad year and position.</p>'
      + '<div class="assessment-btn-row"><button class="btn btn-white" id="assessment-begin-btn">Begin Assessment</button></div>'
      + '</div>'

      // ---- Screen 1: Baseline ----
      + '<div class="assessment-screen" data-screen="1">'
      + '<div class="assessment-q-label">Step 1 of 2 &mdash; Tell us about your player</div>'
      + '<h2 class="assessment-headline">First, tell us about your player.</h2>'
      + '<label style="display:block;font-family:var(--fh);font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.4rem;color:var(--muted);" for="baseline-gradyear">Graduation Year</label>'
      + '<select class="assessment-select" id="baseline-gradyear">'
      + '<option value="">Select grad year&hellip;</option>'
      + [2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037].map(function(y){return '<option value="'+y+'">'+y+'</option>';}).join('')
      + '</select>'
      + '<label style="display:block;font-family:var(--fh);font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.4rem;margin-top:1rem;color:var(--muted);" for="baseline-position">Primary Position</label>'
      + '<select class="assessment-select" id="baseline-position">'
      + '<option value="">Select position&hellip;</option>'
      + ['Attack','Midfield','LSM','Close Defense','Goalie','FOGO','Not sure yet'].map(function(p){return '<option value="'+p+'">'+p+'</option>';}).join('')
      + '</select>'
      + '<label style="display:block;font-family:var(--fh);font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.4rem;margin-top:1rem;color:var(--muted);" for="baseline-teamlevel">Current Team Level</label>'
      + '<select class="assessment-select" id="baseline-teamlevel">'
      + '<option value="">Select team level&hellip;</option>'
      + ['Rec/house','Local club','Elite national club','Prep school','None yet'].map(function(t){return '<option value="'+t+'">'+t+'</option>';}).join('')
      + '</select>'
      + '<div class="assessment-btn-row" style="margin-top:2rem;"><button class="btn btn-white" id="baseline-continue-btn">Continue &rarr;</button></div>'
      + '</div>'

      // ---- Screen 1b: Referral branch (Goalie/FOGO) ----
      + '<div class="assessment-screen" data-screen="1b">'
      + '<div class="assessment-q-label">Specialist Referral</div>'
      + '<h2 class="assessment-headline">We don&rsquo;t currently cover goalies or FOGOs in our clinics.</h2>'
      + '<p class="assessment-subhead">But we can refer you to specialists. Enter your email and we&rsquo;ll send referrals.</p>'
      + '<input type="email" class="assessment-select" id="referral-email" placeholder="your@email.com" style="margin-top:1rem;">'
      + '<div class="assessment-btn-row" style="margin-top:1.5rem;"><button class="btn btn-white" id="referral-submit-btn">Send me referrals</button></div>'
      + '</div>'

      // ---- Screens 2–13: Scored Questions ----
      + buildQuestionScreens()

      // ---- Screen 14: Email capture ----
      + '<div class="assessment-screen" data-screen="14">'
      + '<div class="assessment-q-label">Almost there</div>'
      + '<h2 class="assessment-headline">Your report is ready.</h2>'
      + '<p class="assessment-subhead">Enter your email to receive the full written breakdown.</p>'
      + '<input type="email" class="assessment-select" id="result-email" placeholder="your@email.com" style="margin-top:1.5rem;" required>'
      + '<div class="assessment-btn-row" style="margin-top:1.5rem;"><button class="btn btn-white" id="email-submit-btn">Send me the report &rarr;</button></div>'
      + '</div>'

      // ---- Screen 15: Results (populated by JS) ----
      + '<div class="assessment-screen" data-screen="15">'
      + '</div>'

      + '</div>'; // end .assessment-inner
  }

  // ============================================================
  // QUESTION DATA & SCREENS
  // ============================================================
  var QUESTIONS = [
    // Q1 — radio
    {
      id: 'q1', screen: 2, pillar: 1, type: 'radio',
      text: 'Compared to club teammates, your player\u2019s speed and agility is:',
      options: [
        { label: 'Well below average',  value: 0 },
        { label: 'Below average',       value: 1 },
        { label: 'On par',              value: 2 },
        { label: 'Above average',       value: 3 },
        { label: 'Well above average',  value: 4 },
      ]
    },
    // Q2 — radio
    {
      id: 'q2', screen: 3, pillar: 1, type: 'radio',
      text: 'Does your player follow a structured strength & conditioning program outside team practice?',
      options: [
        { label: 'None',                          value: 0 },
        { label: 'Informal / self-directed',      value: 2 },
        { label: 'Structured with a coach',       value: 4 },
      ]
    },
    // Q3 — radio
    {
      id: 'q3', screen: 4, pillar: 1, type: 'radio',
      text: 'Under pressure, your player changes direction without losing balance:',
      options: [
        { label: 'Rarely',       value: 0 },
        { label: 'Sometimes',    value: 1 },
        { label: 'Usually',      value: 2 },
        { label: 'Consistently', value: 3 },
        { label: 'Every time',   value: 4 },
      ]
    },
    // Q4 — radio
    {
      id: 'q4', screen: 5, pillar: 1, type: 'radio',
      text: 'In the last 24 months, has your player missed more than 2 weeks due to injury?',
      options: [
        { label: 'Yes', value: 0 },
        { label: 'No',  value: 4 },
      ]
    },
    // Q5 — scale
    {
      id: 'q5', screen: 6, pillar: 2, type: 'scale',
      text: 'Your player reads the field well \u2014 off-ball positioning, anticipating plays:',
    },
    // Q6 — scale
    {
      id: 'q6', screen: 7, pillar: 2, type: 'scale',
      text: 'Decision-making under pressure:',
    },
    // Q7 — radio
    {
      id: 'q7', screen: 8, pillar: 2, type: 'radio',
      text: 'Does your player watch lacrosse film or games independently?',
      options: [
        { label: 'Never',       value: 0 },
        { label: 'Occasionally', value: 2 },
        { label: 'Regularly',   value: 4 },
      ]
    },
    // Q8 — scale
    {
      id: 'q8', screen: 9, pillar: 2, type: 'scale',
      text: 'Communication on the field \u2014 calling slides, directing teammates:',
    },
    // Q9 — radio
    {
      id: 'q9', screen: 10, pillar: 3, type: 'radio',
      text: 'Your player has specific, measurable goals for this season:',
      options: [
        { label: 'None',                       value: 0 },
        { label: 'Vague goals',                value: 2 },
        { label: 'Specific and written down',  value: 4 },
      ]
    },
    // Q10 — radio
    {
      id: 'q10', screen: 11, pillar: 3, type: 'radio',
      text: 'Hours per week training outside of team practice:',
      options: [
        { label: '0 hours',    value: 0 },
        { label: '1\u20132 hours', value: 1 },
        { label: '3\u20135 hours', value: 3 },
        { label: '6+ hours',   value: 4 },
      ]
    },
    // Q11 — radio
    {
      id: 'q11', screen: 12, pillar: 3, type: 'radio',
      text: 'Response to constructive criticism from coaches:',
      options: [
        { label: 'Defensive',             value: 0 },
        { label: 'Tolerates it',          value: 1 },
        { label: 'Welcomes it',           value: 3 },
        { label: 'Actively seeks it',     value: 4 },
      ]
    },
    // Q12 — free text
    {
      id: 'q12', screen: 13, pillar: 3, type: 'text',
      text: 'Your player\u2019s biggest single development priority right now:',
    },
  ];

  function buildQuestionScreens() {
    var html = '';
    QUESTIONS.forEach(function(q) {
      var qNum = parseInt(q.id.replace('q',''), 10);
      html += '<div class="assessment-screen" data-screen="' + q.screen + '">'
        + '<div class="assessment-q-label">Question ' + qNum + ' of 12</div>'
        + '<div class="assessment-question">' + esc(q.text) + '</div>';

      if (q.type === 'radio') {
        html += '<div class="assessment-options">';
        q.options.forEach(function(opt) {
          html += '<label class="assessment-option">'
            + '<input type="radio" name="' + q.id + '" value="' + opt.value + '">'
            + '<span>' + esc(opt.label) + '</span>'
            + '</label>';
        });
        html += '</div>';
        html += '<div class="assessment-btn-row"><button class="btn btn-white assessment-next-btn" data-qid="' + q.id + '" data-next="' + (q.screen + 1) + '">Next &rarr;</button></div>';

      } else if (q.type === 'scale') {
        html += '<div class="assessment-options">'
          + '<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--muted);font-family:var(--fh);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem;"><span>Poor</span><span>Excellent</span></div>';
        for (var v = 1; v <= 5; v++) {
          var score = v - 1; // 1=0, 2=1, 3=2, 4=3, 5=4
          html += '<label class="assessment-option">'
            + '<input type="radio" name="' + q.id + '" value="' + score + '">'
            + '<span>' + v + '</span>'
            + '</label>';
        }
        html += '</div>';
        html += '<div class="assessment-btn-row"><button class="btn btn-white assessment-next-btn" data-qid="' + q.id + '" data-next="' + (q.screen + 1) + '">Next &rarr;</button></div>';

      } else if (q.type === 'text') {
        html += '<textarea class="assessment-textarea" id="freetext-q12" placeholder="Describe in a sentence or two\u2026"></textarea>'
          + '<div class="assessment-btn-row"><button class="btn btn-white" id="q12-next-btn">Next &rarr;</button></div>';
      }

      html += '</div>';
    });
    return html;
  }

  // ============================================================
  // INJECT MODAL INTO DOM
  // ============================================================
  function injectModal() {
    modal = document.createElement('div');
    modal.id              = 'cml-assessment-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Three Pillar Development Assessment');
    modal.innerHTML = buildModalHTML();
    document.body.appendChild(modal);
    injected = true;

    // bind option-click styles on question screens
    QUESTIONS.forEach(function(q) {
      var screen = modal.querySelector('.assessment-screen[data-screen="' + q.screen + '"]');
      if (screen) bindOptionClick(screen);
    });

    bindEvents();
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  function bindEvents() {
    // Close button
    modal.querySelector('#assessment-close-btn').addEventListener('click', closeModal);

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // Focus trap
    modal.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      var focusable = Array.from(modal.querySelectorAll('.assessment-screen.active button:not([disabled]),input,select,textarea,a[href]'));
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Screen 0 — Begin
    modal.querySelector('#assessment-begin-btn').addEventListener('click', function() {
      showScreen(1);
    });

    // Screen 1 — Continue (baseline)
    modal.querySelector('#baseline-continue-btn').addEventListener('click', function() {
      var gy  = modal.querySelector('#baseline-gradyear').value;
      var pos = modal.querySelector('#baseline-position').value;
      var tl  = modal.querySelector('#baseline-teamlevel').value;
      if (!gy || !pos || !tl) {
        alert('Please complete all three fields before continuing.');
        return;
      }
      state.gradYear  = gy;
      state.position  = pos;
      state.teamLevel = tl;
      if (pos === 'Goalie' || pos === 'FOGO') {
        showScreen('1b');
      } else {
        showScreen(2);
      }
    });

    // Screen 1b — referral submit
    modal.querySelector('#referral-submit-btn').addEventListener('click', function() {
      var email = modal.querySelector('#referral-email').value;
      console.log('CML Referral Lead:', { email: email, position: state.position, gradYear: state.gradYear });
      var btn = modal.querySelector('#referral-submit-btn');
      btn.textContent = 'Sent! We\u2019ll be in touch.';
      btn.disabled = true;
    });

    // Question screens — Next buttons
    modal.addEventListener('click', function(e) {
      var btn = e.target.closest('.assessment-next-btn');
      if (!btn) return;
      var qid  = btn.getAttribute('data-qid');
      var next = parseInt(btn.getAttribute('data-next'), 10);
      var screen = modal.querySelector('.assessment-screen.active');
      var val = getSelectedValue(screen);
      if (val === null) {
        alert('Please select an answer before continuing.');
        return;
      }
      state.answers[qid] = parseInt(val, 10);
      showScreen(next);
    });

    // Q12 free text — Next
    modal.querySelector('#q12-next-btn').addEventListener('click', function() {
      var ta = modal.querySelector('#freetext-q12');
      state.freeText = ta ? ta.value : '';
      state.answers.q12 = ''; // no numeric score
      showScreen(14);
    });

    // Screen 14 — email submit
    modal.querySelector('#email-submit-btn').addEventListener('click', function() {
      var emailEl = modal.querySelector('#result-email');
      var email   = emailEl ? emailEl.value.trim() : '';
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }
      state.email = email;
      var scores = calcScores();
      console.log('CML Lead:', {
        email:     state.email,
        gradYear:  state.gradYear,
        position:  state.position,
        teamLevel: state.teamLevel,
        scores:    scores,
        freeText:  state.freeText,
      });
      buildResultsScreen();
      showScreen(15);
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.openAssessment = openAssessment;

  // Wire up any buttons on the page that should open the assessment
  document.addEventListener('DOMContentLoaded', function() {
    var triggers = document.querySelectorAll('[data-assessment-trigger], #hero-assessment-btn, #final-assessment-btn');
    triggers.forEach(function(el) {
      el.addEventListener('click', function() { openAssessment(); });
    });
  });

})();
