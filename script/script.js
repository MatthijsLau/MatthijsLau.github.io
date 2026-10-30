// ===============================
// Banner configuration
// ===============================
const images = [
    'assets/images/banners/banner-fisciano.webp',
    'assets/images/banners/banner-siena.webp',
    'assets/images/banners/banner-skadar.webp',
    'assets/images/banners/banner-sg.webp',
    'assets/images/banners/banner-blacklake.webp'
];

let currentBanner = null;

// ===============================
// Utilities
// ===============================
function getRandomImage() {
    return images[Math.floor(Math.random() * images.length)];
}

function preloadImage(url) {
    const img = new Image();
    img.src = url;
}

// ===============================
// Banner handler (matches your CSS: .header)
// ===============================
function applyBanner() {
    const header = document.querySelector('.header');

    if (!header) return;

    const bannerUrl = new URL(currentBanner, document.baseURI).href;
    header.style.setProperty('--banner-url', `url('${bannerUrl}')`);
}

// ===============================
// Navigation
// ===============================
function setupNavigation() {
    document.addEventListener('click', function (e) {
        const link = e.target.closest('.nav-link');
        if (!link) return;

        e.preventDefault();

        const page = link.dataset.page;
        if (!page) return;

        document.querySelectorAll('.page').forEach((section) => {
            section.hidden = true;
        });
        const selectedPage = document.getElementById(page);
        if (!selectedPage) return;
        selectedPage.hidden = false;
        history.replaceState(null, '', `#${page}`);
    });
}

// ===============================
// Data parsing & Loading (.bib & JSON)
// ===============================
async function loadSiteData() {
    try {
        // Load Events from JSON
        if (document.getElementById('events-list')) {
            const jsonResponse = await fetch('https://matthijslau.github.io/assets/data.json');
            const data = await jsonResponse.json();
            renderEvents(data.events);
        }

        // Load Publications, Talks, and Posters from .bib
        if (document.getElementById('research-list')) {
            await loadBibData();
        }
    } catch (error) {
        console.error('Error loading site data:', error);
    }
}

// Lightweight BibTeX Parser
function parseBibTeX(bibText) {
    const entries = [];
    const entryRegex = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\n\}/g;
    let match;

    while ((match = entryRegex.exec(bibText)) !== null) {
        const type = match[1].toLowerCase();
        const citationKey = match[2].trim();
        const body = match[3];

        const fields = { entryType: type, citationKey };
        const fieldRegex = /(\w+)\s*=\s*(?:\{([\s\S]*?)\}|"([^"]*)"|(\S+))/g;
        let fieldMatch;

        while ((fieldMatch = fieldRegex.exec(body)) !== null) {
            const key = fieldMatch[1].toLowerCase();
            const value = (fieldMatch[2] || fieldMatch[3] || fieldMatch[4] || '').trim();
            fields[key] = value;
        }

        entries.push(fields);
    }

    return entries;
}

// Fetch and structure BibTeX data
async function loadBibData() {
    try {
        const response = await fetch('https://matthijslau.github.io/assets/data.bib');
        if (!response.ok) return;
        
        const bibText = await response.text();
        const entries = parseBibTeX(bibText);

        const structuredData = {
            publications: {
                articles: [],
                preprints: []
            },
            talks: [],
            posters: []
        };

        entries.forEach(entry => {
            const type = entry.entryType;
            const category = (entry.category || entry.howpublished || '').toLowerCase();

            // 1. Posters
            if (type === 'poster' || category.includes('poster')) {
                structuredData.posters.push({
                    title: entry.title,
                    event: entry.booktitle || entry.event || entry.organization || '',
                    location: entry.location || entry.address || '',
                    date: entry.date || entry.year || '',
                    url: entry.url || ''
                });
            } 
            // 2. Talks
            else if (type === 'talk' || category.includes('talk')) {
                structuredData.talks.push({
                    title: entry.title,
                    event: entry.booktitle || entry.event || entry.organization || '',
                    location: entry.location || entry.address || '',
                    date: entry.date || entry.year || ''
                });
            } 
            // 3. Preprints
            else if (type === 'unpublished' || (entry.note && entry.note.toLowerCase().includes('preprint'))) {
                structuredData.publications.preprints.push({
                    authors: entry.author,
                    title: entry.title,
                    venue: entry.note || '',
                    url: entry.url || entry.eprint || '',
                    urlText: entry.urltext || entry.eprint
                });
            } 
            // 4. Peer-reviewed Publications
            else if (type === 'article' || type === 'inproceedings' || type === 'book') {
                structuredData.publications.articles.push({
                    authors: entry.author,
                    title: entry.title,
                    venue: entry.journal || entry.booktitle || '',
                    url: entry.url || entry.doi || '',
                    urlText: entry.urltext || entry.doi
                });
            }
        });

        renderPublications(structuredData);
    } catch (error) {
        console.error('Error processing .bib file:', error);
    }
}

// Robust local date parser
function parseLocalDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleanStr = dateStr.trim();
    if (cleanStr.toUpperCase() === 'TBA') return null;

    const parts = cleanStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month, day);
        }
    }

    return null;
}

// Helper to format a single date string (e.g. "2026-10-30" -> "Oct. 30")
function formatDate(DateStr) {
    if (!DateStr || String(DateStr).toUpperCase() === 'TBA') return 'TBA';

    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const date = parseLocalDate(String(DateStr));

    if (!date || isNaN(date.getTime())) {
        return DateStr;
    }

    const Month = months[date.getMonth()];
    const Day = date.getDate();
    return `${Month} ${Day}`;
}

// Helper to handle singular (string) or multiple (array) dates seamlessly
function formatMultipleDates(dateInput) {
    if (!dateInput) return 'TBA';

    if (typeof dateInput === 'string') {
        return formatDate(dateInput);
    }

    if (Array.isArray(dateInput)) {
        if (dateInput.length === 0) return 'TBA';

        const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
        const parsedDates = dateInput.map(d => parseLocalDate(String(d))).filter(Boolean);

        if (parsedDates.length === 0) return dateInput.join(', ');

        const first = parsedDates[0];
        const sameMonthYear = parsedDates.every(d => 
            d.getMonth() === first.getMonth() && d.getFullYear() === first.getFullYear()
        );

        const year = first.getFullYear();
        const monthName = months[first.getMonth()];

        if (sameMonthYear && parsedDates.length > 1) {
            const days = parsedDates.map(d => d.getDate());
            let daysStr = '';
            if (days.length === 2) {
                daysStr = `${days[0]} and ${days[1]}`;
            } else {
                daysStr = days.slice(0, -1).join(', ') + ' and ' + days[days.length - 1];
            }
            return `${monthName} ${daysStr} ${year}`;
        }

        const formattedDates = dateInput.map(d => formatDate(d));
        if (formattedDates.length === 1) {
            return formattedDates[0];
        } else if (formattedDates.length === 2) {
            return `${formattedDates[0]} and ${formattedDates[1]}`;
        } else {
            return formattedDates.slice(0, -1).join(', ') + ' and ' + formattedDates[formattedDates.length - 1];
        }
    }

    return String(dateInput);
}

function formatDateRange(startDateStr, endDateStr) {
    if (!startDateStr || startDateStr.toUpperCase() === 'TBA') return 'TBA';
    
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    
    const start = parseLocalDate(startDateStr);
    const end = endDateStr ? parseLocalDate(endDateStr) : start;

    if (!start || isNaN(start.getTime())) return startDateStr || 'TBA';

    const startMonth = months[start.getMonth()];
    const startDay = start.getDate();

    if (!end || isNaN(end.getTime()) || startDateStr === endDateStr || !endDateStr) {
        return `${startMonth} ${startDay}`;
    }
    
    const endMonth = months[end.getMonth()];
    const endDay = end.getDate();

    if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${startDay}–${endDay}`;
    } else {
        return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
    }
}

// Render Events with TBA support and right-aligned dates
function renderEvents(eventsArray) {
    const container = document.getElementById('events-list');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingObj = {};
    const pastObj = {};

    eventsArray.forEach(event => {
        const dateObj = event.end ? parseLocalDate(event.end) : parseLocalDate(event.start);
        
        const isTba = !dateObj || isNaN(dateObj.getTime()) || (event.start && event.start.toUpperCase() === 'TBA');
        const year = isTba ? new Date().getFullYear() : dateObj.getFullYear();
        
        const targetObj = (isTba || dateObj >= today) ? upcomingObj : pastObj;

        if (!targetObj[year]) {
            targetObj[year] = [];
        }
        
        event.formattedDate = isTba ? 'TBA' : formatDateRange(event.start, event.end);
        targetObj[year].push(event);
    });

    if (Object.keys(upcomingObj).length === 0) {
        const currentYear = new Date().getFullYear();
        upcomingObj[currentYear] = [{
            title: "No upcoming events planned...",
            url: null,
            location: null,
            formattedDate: null
        }];
    }

    function buildSection(mainTitle, yearsObj) {
        const detailsMain = document.createElement('details');
        detailsMain.open = true;
        detailsMain.className = 'mainDetails';
        
        const summaryMain = document.createElement('summary');
        summaryMain.textContent = mainTitle;
        detailsMain.appendChild(summaryMain);

        const sortedYears = Object.keys(yearsObj).sort((a, b) => {
            return mainTitle === 'Upcoming' ? a - b : b - a;
        });

        sortedYears.forEach(year => {
            const detailsSec = document.createElement('details');
            detailsSec.open = true;
            detailsSec.className = 'secondaryDetails';

            const summarySec = document.createElement('summary');
            summarySec.textContent = year;
            detailsSec.appendChild(summarySec);

            const ul = document.createElement('ul');
            yearsObj[year].forEach(event => {
                const li = document.createElement('li');

                if (!event.formattedDate && !event.url && !event.location) {
                    li.textContent = event.title;
                } else {
                    const flexspan = document.createElement('span');
                    flexspan.className = 'flexspan';

                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'title';

                    if (event.url) {
                        const a = document.createElement('a');
                        a.href = event.url;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.className = 'external';
                        a.textContent = event.title;
                        titleSpan.appendChild(a);
                    } else {
                        titleSpan.textContent = event.title;
                    }

                    if (event.location) {
                        titleSpan.append(document.createTextNode(`, ${event.location}`));
                    }

                    if (event.note) {
                        titleSpan.append(document.createTextNode(` (${event.note})`));
                    }

                    flexspan.appendChild(titleSpan);

                    if (event.formattedDate) {
                        const dateSpan = document.createElement('span');
                        dateSpan.className = 'date';
                        dateSpan.textContent = event.formattedDate;
                        flexspan.appendChild(dateSpan);
                    }

                    li.appendChild(flexspan);
                }

                ul.appendChild(li);
            });

            detailsSec.appendChild(ul);
            detailsMain.appendChild(detailsSec);
        });

        return detailsMain;
    }

    container.appendChild(buildSection('Upcoming', upcomingObj));
    container.appendChild(createSeparator());
    container.appendChild(buildSection('Past', pastObj));
}

// ===============================
// Publications, Talks, and Posters Renderers
// ===============================

function renderPublicationsSection(publicationsData) {
    if (!publicationsData) return null;

    const details = document.createElement('details');
    details.open = true;
    details.className = 'mainDetails';

    const summary = document.createElement('summary');
    summary.textContent = 'Publications';
    details.appendChild(summary);

    // Articles list
    if (publicationsData.articles && publicationsData.articles.length > 0) {
        const articlesUl = document.createElement('ul');
        publicationsData.articles.forEach(pub => {
            articlesUl.appendChild(createPubLi(pub));
        });
        details.appendChild(articlesUl);
    }

    // Preprints list
    if (publicationsData.preprints && publicationsData.preprints.length > 0) {
        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        subtitle.textContent = 'Preprints';
        details.appendChild(subtitle);

        const preprintsUl = document.createElement('ul');
        publicationsData.preprints.forEach(pub => {
            preprintsUl.appendChild(createPubLi(pub));
        });
        details.appendChild(preprintsUl);
    }

    return details;
}

function renderTalksSection(talksData) {
    if (!talksData || talksData.length === 0) return null;

    const details = document.createElement('details');
    details.open = true;
    details.className = 'mainDetails';

    const summary = document.createElement('summary');
    summary.textContent = 'Talks';
    details.appendChild(summary);

    const ul = document.createElement('ul');
    talksData.forEach(talk => {
        const li = document.createElement('li');
        
        const em = document.createElement('em');
        em.textContent = talk.title;
        li.appendChild(em);

        const dateText = formatMultipleDates(talk.date);
        li.append(document.createTextNode(`; ${talk.event}, ${talk.location}, ${dateText}`));
        
        ul.appendChild(li);
    });

    details.appendChild(ul);
    return details;
}

function renderPostersSection(postersData) {
    if (!postersData || postersData.length === 0) return null;

    const details = document.createElement('details');
    details.open = true;
    details.className = 'mainDetails';

    const summary = document.createElement('summary');
    summary.textContent = 'Posters';
    details.appendChild(summary);

    const ul = document.createElement('ul');
    postersData.forEach(poster => {
        const li = document.createElement('li');

        const a = document.createElement('a');
        a.href = poster.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'external';

        const em = document.createElement('em');
        em.textContent = poster.title;
        a.appendChild(em);
        li.appendChild(a);

        const dateText = formatMultipleDates(poster.date);
        li.append(document.createTextNode(`; ${poster.event}, ${poster.location}, ${dateText}.`));
        ul.appendChild(li);
    });

    details.appendChild(ul);
    return details;
}

// --- Helper Functions ---

function createPubLi(pub) {
    const li = document.createElement('li');
    let textNode = `${pub.authors}, ${pub.title}`;
    if (pub.venue) textNode += `, *${pub.venue}*`;
    
    li.append(document.createTextNode(textNode + ', '));

    if (pub.url) {
        const a = document.createElement('a');
        a.href = pub.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'external';
        a.textContent = pub.urlText || pub.url;
        li.appendChild(a);
    }
    li.append(document.createTextNode('.'));
    return li;
}

// Utility to create horizontal divider line
function createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'hlinesecondary';
    separator.style.height = 'clamp(.25px, 0.125vw, 1px)';
    return separator;
}

// --- Main Orchestrator for Research ---

function renderPublications(data) {
    const container = document.getElementById('research-list');
    if (!container) return;
    container.innerHTML = '';

    const sections = [
        renderPublicationsSection(data.publications),
        renderTalksSection(data.talks),
        renderPostersSection(data.posters)
    ].filter(Boolean);

    sections.forEach((section, index) => {
        container.appendChild(section);
        if (index < sections.length - 1) {
            container.appendChild(createSeparator());
        }
    });
}

// ===============================
// Initialization
// ===============================
function init() {
    currentBanner = getRandomImage();
    preloadImage(currentBanner);
    applyBanner();

    const page = window.location.hash.substring(1);
    const initialPage = ['aboutme', 'research', 'teaching'].includes(page) ? page : 'aboutme';
    document.querySelectorAll('.page').forEach((section) => {
        section.hidden = section.id !== initialPage;
    });
}

// ===============================
// Start app
// ===============================
document.addEventListener('DOMContentLoaded', function () {
    init();
    setupNavigation();
    loadSiteData();
});