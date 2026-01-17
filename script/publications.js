// ===============================
// Global variables
// ===============================
let PUBLICATIONS_HTML = '';
let PUBLICATIONS_LOADED = false;
let PUBLICATIONS_PROMISE = null;

// ===============================
// Generate HTML for publications
// ===============================
function generatePublicationsHTML(publications) {
    // Normalize status to either "Published" or "In preparation"
    const sections = {
        "Published": [],
        "In preparation": []
    };

    publications.forEach(pub => {
        const section = pub.status === 'pub' ? 'Published' : 'In preparation';
        sections[section].push(pub);
    });

    // Render sections
    let html = `<summary>Publications</summary>
<!-- 
    An overview of my publications can be found on my 
    <a href="#" target="_blank" rel="noopener noreferrer">Google Scholar</a> or 
    <a href="#" target="_blank" rel="noopener noreferrer">ArXiv</a> page.
-->
`;

    for (const [section, pubs] of Object.entries(sections)) {
        if (pubs.length === 0) continue; // skip empty sections

        html += `<div class="subtitle">${section}</div>\n<ul>\n`;
        pubs.forEach(pub => {
            let titleHTML = pub.url
                ? `<a href="${pub.url}" target="_blank" rel="noopener noreferrer">${pub.title}</a>`
                : pub.title;

            if (pub.authors && pub.authors.trim()) {
                titleHTML += ` (joint with ${pub.authors})`;
            }

            html += `  <li>${titleHTML}</li>\n`;
        });
        html += `</ul>\n`;
    }

    return html;
}


// ===============================
// Load publications data (Promise-based)
// ===============================
function loadPublications() {
    if (PUBLICATIONS_PROMISE) return PUBLICATIONS_PROMISE;

    PUBLICATIONS_PROMISE = fetch('assets/data/publications.json')
        .then(res => res.json())
        .then(publications => {
            PUBLICATIONS_HTML = generatePublicationsHTML(publications);
            PUBLICATIONS_LOADED = true;
            window.AppPublications.PUBLICATIONS_HTML = PUBLICATIONS_HTML;
            return PUBLICATIONS_HTML;
        })
        .catch(err => {
            PUBLICATIONS_HTML = '';
            PUBLICATIONS_LOADED = true;
            window.AppPublications.PUBLICATIONS_HTML = PUBLICATIONS_HTML;
            console.error('Failed to load publications.json:', err);
            return PUBLICATIONS_HTML;
        });

    return PUBLICATIONS_PROMISE;
}

// ===============================
// Render the HTML into a div by ID
// ===============================
function renderPublicationsList(divId = 'publications-list') {
    const container = document.getElementById(divId);
    if (!container) return;
    container.innerHTML = PUBLICATIONS_HTML || 'No publications found';
}

// ===============================
// Expose globally
// ===============================
window.AppPublications = {
    renderPublicationsList,
    loadPublications,
    getPublicationsHTML: () => PUBLICATIONS_HTML
};

// ===============================
// On document ready, load publications
// ===============================
document.addEventListener('DOMContentLoaded', loadPublications);