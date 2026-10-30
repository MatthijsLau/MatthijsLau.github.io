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
// Data parsing & Loading (JSON only)
// ===============================
async function loadSiteData() {
    try {
        const jsonResponse = await fetch('assets/data.json');

        if (!jsonResponse.ok) {
            console.error('Failed to load data.json');
        }

        const data = jsonResponse.ok ? await jsonResponse.json() : {};

        // Render events, talks, posters, and publications from JSON
        renderEvents(data.events || []);
        renderTalks(data.talks || []);
        renderPosters(data.posters || []);
        renderJsonPublications(data.publications || {});

    } catch (error) {
        console.error('Error loading site data:', error);
    }
}

// Date formatters
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

function formatDateWithYear(DateStr) {
    if (!DateStr || String(DateStr).toUpperCase() === 'TBA') return 'TBA';

    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const date = parseLocalDate(String(DateStr));

    if (!date || isNaN(date.getTime())) {
        return DateStr;
    }

    const Month = months[date.getMonth()];
    const Day = date.getDate();
    const Year = date.getFullYear();
    return `${Month} ${Day}, ${Year}`;
}

function formatMultipleDatesWithYear(dateInput) {
    if (!dateInput) return 'TBA';

    // Parse stringified JSON arrays (e.g., "[2026-08-03, 2026-08-13]")
    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                dateInput = JSON.parse(trimmed);
            } catch (e) {
                // Keep as string if parsing fails
            }
        }
    }

    if (typeof dateInput === 'string') {
        return formatDateWithYear(dateInput);
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
            return `${monthName} ${daysStr}, ${year}`;
        }

        const formattedDates = dateInput.map(d => formatDateWithYear(d));
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

function createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'hlinesecondary';
    separator.style.height = 'clamp(.25px, 0.125vw, 1px)';
    return separator;
}

// Render publications directly from JSON data
function renderJsonPublications(pubData) {
    const container = document.getElementById('publications-list');
    if (!container) return;

    container.innerHTML = '';

    const articles = pubData.articles || [];
    const preprints = pubData.preprints || [];

    if (articles.length === 0 && preprints.length === 0) return;

    const detailsMain = document.createElement('details');
    detailsMain.open = true;
    detailsMain.className = 'mainDetails';

    const summaryMain = document.createElement('summary');
    summaryMain.textContent = 'Publications';
    detailsMain.appendChild(summaryMain);

    function buildSubSectionFlat(subTitle, pubsArray) {
        const wrapper = document.createElement('div');
        wrapper.className = 'sub-section-wrapper';

        const h4 = document.createElement('div');
        h4.className = 'subHeading';
        const em = document.createElement('em');
        em.textContent = subTitle;
        h4.appendChild(em);
        wrapper.appendChild(h4);

        const ul = document.createElement('ul');
        pubsArray.forEach(pub => ul.appendChild(createPubLi(pub)));
        wrapper.appendChild(ul);

        return wrapper;
    }

    if (articles.length > 0) {
        detailsMain.appendChild(buildSubSectionFlat('Publications', articles));
    }

    if (preprints.length > 0) {
        detailsMain.appendChild(buildSubSectionFlat('Preprints', preprints));
    }

    container.appendChild(detailsMain);
}

// Render Events
function renderEvents(eventsArray) {
    const container = document.getElementById("events-list");
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

function renderTalks(talksData) {
    const container = document.getElementById("talks-list");
    if (!container) return;

    container.innerHTML = '';

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

        const dateText = formatMultipleDatesWithYear(talk.date);
        li.append(document.createTextNode(`; ${talk.event}, ${talk.location}, ${dateText}`));

        ul.appendChild(li);
    });

    details.appendChild(ul);
    container.appendChild(details);
}

function renderPosters(postersData) {
    const container = document.getElementById("posters-list");
    if (!container) return;

    container.innerHTML = '';

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

        const dateText = formatMultipleDatesWithYear(poster.date);
        li.append(document.createTextNode(`; ${poster.event}, ${poster.location}, ${dateText}.`));
        ul.appendChild(li);
    });

    details.appendChild(ul);
    container.appendChild(details);
}

// --- Helper Functions ---

function createPubLi(pub) {
    const li = document.createElement('li');
    
    let textNode = `${pub.authors}, ${pub.title}`;
    li.append(document.createTextNode(textNode));

    if (pub.venue) {
        li.append(document.createTextNode(', '));
        if (pub.url) {
            const a = document.createElement('a');
            a.href = pub.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'external';
            a.textContent = pub.venue;
            li.appendChild(a);
        } else {
            li.append(document.createTextNode(pub.venue));
        }
    } else if (pub.url) {
        li.append(document.createTextNode(', '));
        const a = document.createElement('a');
        a.href = pub.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'external';
        a.textContent = pub.urlText;
        li.appendChild(a);
    }

    li.append(document.createTextNode('.'));
    return li;
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