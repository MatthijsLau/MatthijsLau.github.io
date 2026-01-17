// ===============================
// Global variables for Talks
// ===============================
let TALKS_HTML = '';
let TALKS_LOADED = false;
let TALKS_PROMISE = null;

// ===============================
// Utilities: parse & format dates for Talks
// ===============================
// Parse a single date string or object
function parseTalkDate(date) {
    if (!date) return null; // automatic TBA if null
    if (typeof date === 'string') date = { date };
    const d = new Date(date.date || date.start);
    return isNaN(d) ? null : d;
}

// Format a parsed date
function formatTalkDate(date) {
    if (!date) return 'TBA'; // automatic TBA
    return date.toLocaleDateString([`en-GB`], { month: 'short', day: 'numeric', year: 'numeric'});
}

// ===============================
// Generate flat HTML for talks
// ===============================
function generateTalksHTML(talks) {
    return `
        <summary>Talks</summary >
        <ul>
            ${talks.map(talk => {
        const date = parseTalkDate(talk.date);

        // Fallbacks for missing fields
        const title = talk.title || 'Untitled';
        const type = talk.type || 'TBA';
        const location = talk.location || 'TBA';
        const dateStr = formatTalkDate(date);

        return `<li><em>${title}</em>; ${type}, at ${location}, ${dateStr}</li>`;
    }).join('\n')}
    </ul>`;
}

// ===============================
// Load talks data (Promise-based)
// ===============================
function loadTalks() {
    if (TALKS_PROMISE) return TALKS_PROMISE;

    TALKS_PROMISE = fetch('assets/data/talks.json')
        .then(res => res.json())
        .then(talks => {
            TALKS_HTML = generateTalksHTML(talks);
            TALKS_LOADED = true;
            window.AppTalks.TALKS_HTML = TALKS_HTML;
            return TALKS_HTML;
        })
        .catch(err => {
            TALKS_HTML = '';
            TALKS_LOADED = true;
            window.AppTalks.TALKS_HTML = TALKS_HTML;
            console.error('Failed to load talks.json:', err);
            return TALKS_HTML;
        });

    return TALKS_PROMISE;
}

// ===============================
// Render talks HTML into a div by ID
// ===============================
function renderTalksList(divId = 'talks-list') {
    const container = document.getElementById(divId);
    if (!container) return;
    container.innerHTML = TALKS_HTML || 'No talks found';
}

// ===============================
// Expose globally
// ===============================
window.AppTalks = {
    renderTalksList,
    loadTalks,
    getTalksHTML: () => TALKS_HTML
};

// ===============================
// On document ready, load talks
// ===============================
document.addEventListener('DOMContentLoaded', loadTalks);
