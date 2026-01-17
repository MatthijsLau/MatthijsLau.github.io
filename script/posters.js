// ===============================
// Global variables
// ===============================
let POSTERS_HTML = '';
let POSTERS_LOADED = false;
let POSTERS_PROMISE = null;

// ===============================
// Utilities: parse & format dates
// ===============================
function parsePosterDate(date) {
    if (!date) return null; // automatic TBA if null
    if (typeof date === 'string') date = { date };
    const d = new Date(date.date || date.start);
    return isNaN(d) ? null : d;
}

// Format a parsed date
function formatPosterDate(date) {
    if (!date) return 'TBA'; // automatic TBA
    return date.toLocaleDateString([`en-GB`], { month: 'short', day: 'numeric', year: 'numeric'});
}

// ===============================
// Generate HTML for posters
// ===============================
function generatePostersHTML(posters) {
    return `
        <summary>Posters</summary >
        <ul>
            ${posters.map(poster => {
        const date = parsePosterDate(poster.date);

        // Fallbacks for missing fields
        const title = poster.title || 'Untitled';
        const url = poster.url || null
        const type = poster.type || 'TBA';
        const location = poster.location || 'TBA';
        const dateStr = formatPosterDate(date);

        return `<li>${url
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer"><em>${title}</em></a>`
            : `<em>${title}</em>`
            }; ${type}, at ${location}, ${dateStr}</li>`;

    }).join('\n')}
    </ul>`;
}

// ===============================
// Load posters data (Promise-based)
// ===============================
function loadPosters() {
    if (POSTERS_PROMISE) return POSTERS_PROMISE;

    POSTERS_PROMISE = fetch('assets/data/posters.json')
        .then(res => res.json())
        .then(posters => {
            POSTERS_HTML = generatePostersHTML(posters);
            POSTERS_LOADED = true;
            window.AppPosters.POSTERS_HTML = POSTERS_HTML;
            return POSTERS_HTML;
        })
        .catch(err => {
            POSTERS_HTML = '';
            POSTERS_LOADED = true;
            window.AppPosters.POSTERS_HTML = POSTERS_HTML;
            console.error('Failed to load posters.json:', err);
            return POSTERS_HTML;
        });

    return POSTERS_PROMISE;
}

// ===============================
// Render the HTML into a div by ID
// ===============================
function renderPostersList(divId = 'posters-list') {
    const container = document.getElementById(divId);
    if (!container) return;
    container.innerHTML = POSTERS_HTML || 'No posters found';
}

// ===============================
// Expose globally
// ===============================
window.AppPosters = {
    renderPostersList,
    loadPosters,
    getPostersHTML: () => POSTERS_HTML
};

// ===============================
// On document ready, load posters
// ===============================
document.addEventListener('DOMContentLoaded', loadPosters);
