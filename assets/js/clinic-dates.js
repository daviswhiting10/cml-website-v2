// Shared session dates — single source of truth for train.html and clinic.html
window.CML_SESSIONS = [
  { year: 2026, month: 4, date: 23, name: '2036\u20132026 Skill Development Clinic', time: '10:00 AM \u2013 12:00 PM', location: 'Long Reach High School, 6101 Old Dobbin Ln, Columbia, MD 21045', details: ['10:00 \u2013 11:00 AM: Grad Years 2036\u20132033', '11:00 AM \u2013 12:00 PM: Grad Years 2032\u20132026'] },
  { year: 2026, month: 5, date:  6, name: '2036\u20132026 Skill Development Clinic', time: '10:00 AM \u2013 12:00 PM', location: 'Long Reach High School, 6101 Old Dobbin Ln, Columbia, MD 21045', details: ['10:00 \u2013 11:00 AM: Grad Years 2036\u20132033', '11:00 AM \u2013 12:00 PM: Grad Years 2032\u20132026'] },
];

// Render clinic date cards into a container element
(function () {
  var MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
  var DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function renderClinicDates(containerId) {
    var container = document.getElementById(containerId || 'clinic-dates-grid');
    if (!container) return;
    var sessions = window.CML_SESSIONS || [];
    if (!sessions.length) {
      container.innerHTML = '<p style="color:var(--muted);">No upcoming clinics scheduled. Check back soon.</p>';
      return;
    }

    var html = '<div class="clinic-dates-grid">';
    sessions.forEach(function(s) {
      var d    = new Date(s.year, s.month, s.date);
      var dow  = DAY_NAMES[d.getDay()];
      var mon  = MONTH_NAMES[s.month];
      var dateStr = s.year + '-' + String(s.month + 1).padStart(2,'0') + '-' + String(s.date).padStart(2,'0');
      html += '<div class="clinic-date-card">'
        + '<div class="clinic-date-big">' + escHtml(dow + ', ' + mon + ' ' + s.date) + '</div>'
        + '<div class="clinic-date-location">' + escHtml(s.location) + '</div>'
        + '<div class="clinic-date-sessions">'
        + '<div>Session 1: 10:00 \u2013 11:00 AM \u2014 Grad Years 2036\u20132033</div>'
        + '<div>Session 2: 11:00 AM \u2013 12:00 PM \u2014 Grad Years 2032\u20132026</div>'
        + '</div>'
        + '<a href="book.html?date=' + escHtml(dateStr) + '" class="btn btn-outline">Register &rarr;</a>'
        + '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.renderClinicDates = renderClinicDates;

  document.addEventListener('DOMContentLoaded', function () {
    renderClinicDates('clinic-dates-grid');
  });
})();
