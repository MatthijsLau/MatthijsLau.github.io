// ===============================================================================
// Section formatting
let TALKS_HTML = '';
let POSTERS_HTML = '';
let EVENTS_HTML = '';

function parseDate(date) {
    if (!date) return { start: null, end: null, year: null, tba: true };

    // Normalize string input
    if (typeof date === 'string') date = { date };

    // Extract start and end values
    const startRaw = date.date || date.start || null;
    const endRaw = date.end || null;

    let start = startRaw ? new Date(startRaw) : null;
    let end = endRaw ? new Date(endRaw) : null;

    // Check if start is a valid Date
    const validStart = start instanceof Date && !isNaN(start) ? start : null;
    const validEnd = end instanceof Date && !isNaN(end) ? end : null;

    // If startRaw is just a year (4 digits), consider it TBA
    const tba = !validStart || (/^\d{4}$/.test(startRaw) && startRaw.length === 4);

    return {
        start: tba ? null : validStart,
        end: tba ? null : validEnd,
        year: validStart ? validStart.getFullYear() : null,
        tba
    };
}

function formatDate(dateObj) {
    if (!dateObj || dateObj.tba) return null;

    const { start, end } = dateObj;

    const opts = { year: 'numeric', month: 'short' };
    if (start && end) {
        return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
    }
    if (start) {
        return start.toLocaleDateString(undefined, opts);
    }
    return null;
}

function groupAndSortByType(jsonArray) {
    if (!Array.isArray(jsonArray)) return [];

    const groups = {};

    for (const item of jsonArray) {
        const type = item.type || "unknown";

        // Parse date and attach to item
        item.date = parseDate(item.date);

        if (!groups[type]) groups[type] = [];
        groups[type].push(item);
    }
    
    const sortedGroups = Object.values(groups).map(group =>
        group.sort((a, b) => {
            const aStart = a.date.start;
            const bStart = b.date.start;

            // TBA first
            if (!aStart && !bStart) return 0;
            if (!aStart) return -1;
            if (!bStart) return 1;

            // Later dates first
            return bStart - aStart;
        })
    );

    return sortedGroups;
}

function generateLineHTML(item, type) {
    let html = '<li>';

    const title = item.title
        ? (item.title_url
            ? `<a href="${item.title_url}" target="_blank" rel="noopener noreferrer"><em>${item.title}</em></a>`
            : `<em>${item.title}</em>`)
        : null;

    const meet = item.meeting
        ? (item.meeting_url
            ? `<a href="${item.meeting_url}" target="_blank" rel="noopener noreferrer">${item.meeting}</a>`
            : item.meeting)
        : null;

    const inst = item.institute || null;
    const date = formatDate(item.date) || 'TBA';

    // Build line depending on content
    const parts = [title, meet, inst, date].filter(Boolean);

    html += parts.join(' — ');
    html += '</li>';

    return html;
}

function renderGroupedBlocks(groupedData) {
    if (!Array.isArray(groupedData)) return '';

    let html = '';

    for (const group of groupedData) {
        if (!group.length) continue;

        const type = group[0].type || 'unknown';

        // Start block for this type
        html += `<section class="type-block type-${type}">`;
        html += `<h3>${type}</h3>`;

        // Lines inside the block
        for (const item of group) {
            html += generateLineHTML(item, type);
        }

        html += `</section>`;
    }

    return html;
}

const grouped = groupAndSortByType(data);
const html = renderGroupedBlocks(grouped);

$('#content').html(html);


// ===============================================================================
// Includes and Page loaders

function loadIncludes() {
    const jobs = [];
    $('[data-include]').each(function () {
        const $el = $(this);
        jobs.push($.get($el.data('include') + '.html')
            .then(html => $el.html(html))
            .catch(() => $el.html('')));
    });
    return Promise.all(jobs);
}

const pageHooks = {
    'research.html': () => Promise.all([
        window.AppEvents?.loadEvents?.().then(() => window.AppEvents.renderEventsList()),
        window.AppPublications?.loadPublications?.().then(() => window.AppPublications.renderPublicationsList()),
        window.AppTalks?.loadTalks?.().then(() => window.AppTalks.renderTalksList()),
        window.AppPosters?.loadPosters?.().then(() => window.AppPosters.renderPostersList())
    ]),
    'teaching.html': () => Promise.all([
        window.AppTeaching?.loadTeaching?.().then(() => window.AppTeaching.renderTeachingList())
    ])
};

function loadPage(file, target = '#content') {
    $(target).load(file, function () {
        $(target).show();
        pageHooks[file]?.();
    });
}

// ===============================================================================
// Creating HTML strings
function generateLineHTML(item, type) {
    html = '<ul>'
    const title = item.title ? (item.title_url ? `<a href="${item.title_url}" target="_blank" rel="noopener noreferrer"><em>${item.title}</em></a>` : item.title) : null;
    const meet = item.meeting ? (item.meeting_url ? `<a href="${item.meeting_url}" target="_blank" rel="noopener noreferrer"><em>${item.meeting}</em></a>` : item.meeting) : null;
    const date = formatDate(item.date) || 'TBA';
    const inst = item.institute;
}

// ===============================================================================
// Loading in elements
// Banner stuff:
const images = [
    '/assets/images/banners/banner-fisciano.png',
    '/assets/images/banners/banner-siena.png',
    '/assets/images/banners/banner-skadar.png',
    '/assets/images/banners/banner-sg.png',
    '/assets/images/banners/banner-blacklake.png'
];

function preloadImage(url) { const img = new Image(); img.src = url; }

function setBanner(url) {
    const $banner = $('.banner-header');
    if (!$banner.length) return;
    $banner.css(
        'background-image',
        `linear-gradient(rgba(248,247,242,0.5), rgba(248,247,242,0.8)), url('${url}')`
    );
}

$(function () {
    const rand_img = images[Math.floor(Math.random() * images.length)];
    preloadImage(rand_img)

    loadIncludes().then(() => {
        setBanner(rand_img);
        loadPage('aboutme.html');
    });
});

// ===============================================================================
// Navigation
$(document).on('click', '.nav-link', function (e) {
    e.preventDefault();
    const page = $(this).data('page');
    if (!page) return;
    loadPage(page + '.html');
});