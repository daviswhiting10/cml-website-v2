// TRAINING PAGE CURVE — fires immediately on page load
(function () {
  const canvas = document.getElementById('train-curve-canvas');
  const ctx    = canvas.getContext('2d');

  const PAD_L = 68, PAD_R = 36, PAD_T = 26, PAD_B = 42;
  const DRAW_DUR = 3800, FADE_DUR = 650;
  const X_TICK_COUNT = 12, Y_TICK_COUNT = 8;
  const K = 4.2;

  let startTime = null, phase = 'drawing', phaseStart = null;
  let textAlpha = 0, raf = null, running = false, done = false;
  let cssW = 0, cssH = 0;

  function resize() {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function curvePoint(t) {
    const plotW = cssW - PAD_L - PAD_R;
    const plotH = cssH - PAD_T - PAD_B;
    const raw   = (Math.exp(K * t) - 1) / (Math.exp(K) - 1);
    return { x: PAD_L + t * plotW, y: (cssH - PAD_B) - raw * plotH };
  }

  function draw(elapsed) {
    const W = cssW, H = cssH;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const axisY = H - PAD_B, axisX = PAD_L;
    const progress = Math.min(elapsed / DRAW_DUR, 1);
    const tip  = curvePoint(progress);
    const curveH = plotH > 0 ? (axisY - tip.y) / plotH : 0;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssW, cssH);

    // Axes
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth   = 0.7;
    ctx.beginPath(); ctx.moveTo(axisX, axisY); ctx.lineTo(axisX + progress * plotW, axisY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(axisX, axisY); ctx.lineTo(axisX, axisY - progress * plotH); ctx.stroke();

    // X ticks
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth   = 0.8;
    const xTicks = Math.floor(progress * X_TICK_COUNT);
    for (let i = 0; i < xTicks; i++) {
      const tx = axisX + ((i + 1) / X_TICK_COUNT) * plotW;
      ctx.beginPath(); ctx.moveTo(tx, axisY + 3); ctx.lineTo(tx, axisY + 8); ctx.stroke();
    }

    // Y ticks — reveal only when curve has climbed to that height
    for (let i = 0; i < Y_TICK_COUNT; i++) {
      const f = (i + 1) / Y_TICK_COUNT;
      if (curveH >= f) {
        const ty = axisY - f * plotH;
        ctx.beginPath(); ctx.moveTo(axisX - 3, ty); ctx.lineTo(axisX - 8, ty); ctx.stroke();
      }
    }

    // Axis labels — fade in over last 15% of draw
    const lA = Math.max(0, Math.min(1, (progress - 0.85) / 0.15));
    if (lA > 0) {
      ctx.fillStyle     = `rgba(0,0,0,${(lA * 0.38).toFixed(3)})`;
      ctx.font          = '8px monospace';
      ctx.letterSpacing = '0.1em';
      ctx.textAlign     = 'left';
      ctx.textBaseline  = 'top';
      ctx.fillText('HOURS', axisX + plotW + 5, axisY - 4);
      ctx.save();
      ctx.translate(axisX - 32, PAD_T + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BREAKTHROUGH', 0, 0);
      ctx.restore();
      ctx.letterSpacing = '0';
    }

    // Curve
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth   = 3;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    let seg = false;
    for (let i = 0; i <= 280; i++) {
      const p = curvePoint((i / 280) * progress);
      if (!seg) { ctx.moveTo(p.x, p.y); seg = true; } else { ctx.lineTo(p.x, p.y); }
    }
    ctx.stroke();

    // "THE WORK COMPOUNDS."
    if (textAlpha > 0) {
      ctx.fillStyle     = `rgba(0,0,0,${textAlpha.toFixed(3)})`;
      ctx.font          = '7px monospace';
      ctx.letterSpacing = '0.14em';
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'alphabetic';
      ctx.fillText('THE WORK COMPOUNDS.', W / 2, axisY + 28);
      ctx.letterSpacing = '0';
    }
  }

  function tick(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    if (phase === 'drawing') {
      draw(elapsed);
      if (elapsed >= DRAW_DUR) { phase = 'fading'; phaseStart = now; }
    } else if (phase === 'fading') {
      const fe = now - phaseStart;
      textAlpha = Math.min(fe / FADE_DUR, 1);
      draw(DRAW_DUR);
      if (fe >= FADE_DUR) {
        textAlpha = 1; draw(DRAW_DUR);
        done = running = false; return;
      }
    }
    if (running) raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running || done) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  // Start immediately when page loads — no scroll trigger needed
  window.addEventListener('load', () => { resize(); start(); });
  window.addEventListener('resize', resize);
})();

// MONTHLY CALENDAR
(function () {
  const MONTHS_LONG = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  // Specific session dates: { year, month (0-indexed), date, name, time }
  const SESSIONS = [
    { year: 2026, month: 4, date: 23, name: '2035–2026 Skill Development Clinic', time: '10:00 AM – 12:00 PM', location: 'Long Reach High School, 6101 Old Dobbin Ln, Columbia, MD 21045', details: ['10:00 – 11:00 AM: Grad Years 2036–2033', '11:00 AM – 12:00 PM: Grad Years 2032–2026'] },
    { year: 2026, month: 5, date:  6, name: '2035–2026 Skill Development Clinic', time: '10:00 AM – 12:00 PM', location: 'Long Reach High School, 6101 Old Dobbin Ln, Columbia, MD 21045', details: ['10:00 – 11:00 AM: Grad Years 2036–2033', '11:00 AM – 12:00 PM: Grad Years 2032–2026'] },
  ];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let viewYear  = today.getFullYear();
  let viewMonth = today.getMonth();
  const MIN_Y = today.getFullYear(), MIN_M = today.getMonth();
  const MAX_AHEAD = 3;  // months forward

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildCalendar() {
    document.getElementById('cal-month-label').textContent =
      `${MONTHS_LONG[viewMonth]} ${viewYear}`;

    const atMin = viewYear === MIN_Y && viewMonth <= MIN_M;
    const monthsAhead = (viewYear - MIN_Y) * 12 + (viewMonth - MIN_M);
    const atMax = monthsAhead >= MAX_AHEAD;
    document.getElementById('cal-prev').disabled = atMin;
    document.getElementById('cal-next').disabled = atMax;

    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMo = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Empty leading cells
    for (let i = 0; i < firstDow; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day-cell cal-day-empty';
      grid.appendChild(el);
    }

    // Day cells
    for (let d = 1; d <= daysInMo; d++) {
      const date     = new Date(viewYear, viewMonth, d);
      const isToday  = date.getTime() === today.getTime();
      const sessions = SESSIONS.filter(s => s.year === viewYear && s.month === viewMonth && s.date === d);

      const cell = document.createElement('div');
      cell.className = 'cal-day-cell'
        + (isToday        ? ' is-today'     : '')
        + (sessions.length ? ' has-sessions' : '');

      const pills = sessions.map(s => {
        const detailItems = (s.details || []).map(d => `<li>${escapeHtml(d)}</li>`).join('');
        const detailList = detailItems ? `<ul class="cal-session-details-list">${detailItems}</ul>` : '';
        const loc = s.location ? `<span class="cal-session-location">${escapeHtml(s.location)}</span>` : '';
        return `<div class="cal-session-pill">
          <span class="cal-session-name">${escapeHtml(s.name)}</span>
          ${loc}
          ${detailList}
        </div>`;
      }).join('');

      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const regBtn = sessions.length
        ? `<a href="book.html?date=${dateStr}" class="cal-register-btn">Register &rarr;</a>` : '';

      cell.innerHTML = `<div class="cal-day-num">${d}</div>${pills}${regBtn}`;
      grid.appendChild(cell);
    }
  }

  document.getElementById('cal-prev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    buildCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    buildCalendar();
  });

  buildCalendar();
})();
