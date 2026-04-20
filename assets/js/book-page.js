(function () {
  const params = new URLSearchParams(window.location.search);
  const rawDate = params.get('date');
  // Strict allow-list: YYYY-MM-DD only. Any other input is dropped.
  const dateOk = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
  const baseURL = 'https://calendly.com/centralmdlax-info/cml-training-session';
  const calendlyURL = dateOk ? baseURL + '?date=' + rawDate : baseURL;

  const widget = document.createElement('div');
  widget.className = 'calendly-inline-widget';
  widget.setAttribute('data-url', calendlyURL);
  widget.style.minWidth = '320px';
  widget.style.height = '700px';

  const container = document.getElementById('calendly-container');
  container.replaceChildren(widget);

  // Waiver gate — must live here because CSP blocks inline scripts
  const cb = document.getElementById('waiver-checkbox');
  const gate = document.getElementById('waiver-gate');
  if (cb && gate) {
    cb.addEventListener('change', function () {
      gate.style.display = cb.checked ? 'none' : 'flex';
    });
  }
})();
