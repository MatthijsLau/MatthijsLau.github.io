// ===============================
// Banner loader
// ===============================

const images = [
    '/assets/images/banners/banner-fisciano.png',
    '/assets/images/banners/banner-siena.png',
    '/assets/images/banners/banner-skadar.png',
    '/assets/images/banners/banner-sg.png',
    '/assets/images/banners/banner-blacklake.png'
];

function setBanner(url) {
    const $banner = $('.banner-header');
    if (!$banner.length) return;
    $banner.css(
        'background-image',
        `linear-gradient(rgba(248,247,242,0.5), rgba(248,247,242,0.8)), url('${url}')`
    );
}

function randBanner() {
    if (!images.length) return;
    setBanner(images[Math.floor(Math.random() * images.length)]);
}

// ===============================
// Event utilities
// ===============================

let EVENTS_CACHE = null;
let EVENTS_PROMISE = null;


function parseEventDate(date, options = {}) {
    if (options.tba || !date) {
        return { start: null, end: null, tba: true };
    }
    if (typeof date === "string") {
        const d = new Date(date);
        return { start: d, end: d, tba: false };
    }
    return { start: new Date(date.start), end: new Date(date.end || date.start), tba: false };
}

function formatDateRange(date) {
    if (date.tba) return "TBA";

    const opts = { month: 'short', day: 'numeric' };
    if (date.start.getTime() === date.end.getTime()) {
        return date.start.toLocaleDateString(undefined, opts);
    }
    if (date.start.getMonth() === date.end.getMonth()) {
        return `${date.start.toLocaleDateString(undefined, { month: 'short' })}. ${date.start.getDate()}–${date.end.getDate()}`;
    }
    return `${date.start.toLocaleDateString(undefined, opts)} – ${date.end.toLocaleDateString(undefined, opts)}`;
}

// ===============================
// Event HTML generator
// ===============================

function generateEventsHTML(events) {
    const now = new Date();

    const enriched = events.map(([date, url, title, location, options = {}]) => {
        return { date: parseEventDate(date, options), url, title, location, options };
    });

    enriched.sort((a, b) => {
        if (a.date.tba && b.date.tba) return 0;
        if (a.date.tba) return 1;
        if (b.date.tba) return -1;
        return a.date.start - b.date.start;
    });

    const groups = { upcoming: {}, past: {} };

    enriched.forEach(ev => {
        const section = ev.date.tba || ev.date.end >= now ? 'upcoming' : 'past';
        const year = ev.date.tba ? (ev.options.year ?? "TBA") : ev.date.start.getFullYear();
        if (!groups[section][year]) groups[section][year] = [];
        groups[section][year].push(ev);
    });

    function renderSection(label, data) {
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
                    <span>
                        ${ev.url
                ? `<a href="${ev.url}" target="_blank" rel="noopener noreferrer">${ev.title}</a>`
                : ev.title
            }, ${ev.location},
                    </span>
                    <span class="date">${formatDateRange(ev.date)}</span>
                </span>
            </li>
            `).join('')}
        </ul>
    </details>
    `).join('')}
</details>
`;
    }

    return `
${renderSection('Upcoming', groups.upcoming)}
<div class="hline" style="height:1px"></div>
${renderSection('Past', groups.past)}
`;
}

// ===============================
// Page loader
// ===============================

function loadPage(file) {
    $('#content').load(file, function () {

        if (file === 'research.html') {

            // If already loaded, render immediately
            if (EVENTS_CACHE) {
                loadEvents(EVENTS_CACHE);
            }
            // Otherwise wait for the original fetch
            else if (EVENTS_PROMISE) {
                EVENTS_PROMISE.then(events => {
                    if (events) loadEvents(events);
                });
            }
        }
    });
}



// ===============================
// Main initialization
// ===============================

$(function () {
    const includes = $('[data-include]');
    const jobs = [];

    includes.each(function () {
        const $el = $(this);
        const file = $el.data('include') + '.html';

        jobs.push(
            $.get(file)
                .then(html => $el.html(html))
                .catch(() => $el.html(''))
        );
    });

    // 🔹 Start fetching events immediately (once)
    EVENTS_PROMISE = fetch('assets/data/events.json')
        .then(res => res.json())
        .then(events => {
            EVENTS_CACHE = events;
            return events;
        })
        .catch(err => {
            console.error('Failed to load events:', err);
            return null;
        });

    Promise.all(jobs).then(() => {
        randBanner();
        loadPage('aboutme.html'); // or 'research.html'
    });
});


// Render events into the <!-- events --> section
function loadEvents(events) {
    const $list = $('#events-list');
    if (!$list.length) return;

    // Prevent double rendering
    if ($list.data('events-loaded')) return;
    $list.data('events-loaded', true);

    const html = generateEventsHTML(events);
    $list.html(html);
}




$(document).on('click', '.nav-link', function (e) {
    e.preventDefault();
    const page = $(this).data('page');
    if (!page) return;
    loadPage(page + '.html');
});
