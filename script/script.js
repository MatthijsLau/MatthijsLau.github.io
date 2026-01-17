// ===============================
// Global variables
// ===============================
let EVENTS_HTML = ''; // precomputed HTML string for events

// ===============================
// Utilities: parse & format dates
// ===============================
function parseEventDate(date, tbaYear) {
    if (!date) return { start: null, end: null, tba: true, year: tbaYear || 'TBA' };
    if (typeof date === 'string') date = { start: date };
    return { start: new Date(date.start), end: new Date(date.end || date.start), tba: false };
}

function formatDateRange(date) {
    if (date.tba) return 'TBA';
    const opts = { month: 'short', day: 'numeric' };
    if (date.start.getTime() === date.end.getTime()) return date.start.toLocaleDateString(undefined, opts);
    if (date.start.getMonth() === date.end.getMonth()) {
        return `${date.start.toLocaleDateString(undefined, { month: 'short' })}. ${date.start.getDate()}–${date.end.getDate()}`;
    }
    return `${date.start.toLocaleDateString(undefined, opts)} – ${date.end.toLocaleDateString(undefined, opts)}`;
}

// ===============================
// Generate HTML for events
// ===============================
function generateEventsHTML(events) {
    const now = new Date();
    const sections = { upcoming: {}, past: {} };

    events.forEach(ev => {
        const date = parseEventDate(ev.date, ev.year);
        const section = date.tba || date.end >= now ? 'upcoming' : 'past';
        const year = date.tba ? date.year : date.start.getFullYear();
        if (!sections[section][year]) sections[section][year] = [];
        sections[section][year].push({ ...ev, date });
    });

    const renderSection = (label, data) => {
        const years = Object.keys(data).sort((a, b) => label === 'Upcoming' ? a - b : b - a);
        if (!years.length) return '';
        return `
<details open class="mainDetails">
  <summary>${label}</summary>
  ${years.map(year => `
    <details open class="secondaryDetails">
      <summary>${year}</summary>
      <ul>
        ${data[year].map(ev => `
          <li>
            <span class="flexspan">
              <span>${ev.url ? `<a href="${ev.url}" target="_blank" rel="noopener noreferrer">${ev.title}</a>` : ev.title}, ${ev.location},</span>
              <span class="date">${formatDateRange(ev.date)}</span>
            </span>
          </li>`).join('')}
      </ul>
    </details>`).join('')}
</details>`;
    };

    return renderSection('Upcoming', sections.upcoming) + `<div class="hline"></div>` + renderSection('Past', sections.past);
}

// ===============================
// Load page dynamically
// ===============================
function loadPage(file) {
    $('#content').load(file, function () {
        if (file === 'research.html') {
            const $list = $('#events-list');
            if ($list.length) $list.html(EVENTS_HTML || 'Loading events...');
        }
    });
}

// ===============================
// Load header/footer includes
// ===============================
function loadIncludes() {
    const jobs = [];
    $('[data-include]').each(function () {
        const $el = $(this);
        jobs.push($.get($el.data('include') + '.html').then(html => $el.html(html)).catch(() => $el.html('')));
    });
    return Promise.all(jobs);
}

// ===============================
// Initialization
// ===============================
$(function () {
    // 1️⃣ Load header/footer first
    loadIncludes().then(() => {
        // 2️⃣ Load About Me immediately
        loadPage('aboutme.html');
    });

    // 3️⃣ Fetch events asynchronously
    fetch('assets/data/events.json')
        .then(res => res.json())
        .then(events => { EVENTS_HTML = generateEventsHTML(events); })
        .catch(() => { EVENTS_HTML = ''; });
});

// ===============================
// Navigation clicks
// ===============================
$(document).on('click', '.nav-link', function (e) {
    e.preventDefault();
    const page = $(this).data('page');
    if (!page) return;
    loadPage(page + '.html');
});
