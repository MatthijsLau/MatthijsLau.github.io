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
// Data parsing & Loading
// ===============================
async function loadSiteData() {
    try {
        const response = await fetch('assets/data.json');
        const data = await response.json();
        
        if (document.getElementById('events-list')) {
            renderEvents(data.events);
        }
        if (document.getElementById('research-list')) {
            renderResearch(data);
        }
    } catch (error) {
        console.error('Error loading site data:', error);
    }
}

// Robust local date parser that handles "TBA" or missing dates
function parseLocalDate(dateStr) {
    if (!dateStr || dateStr.toUpperCase() === 'TBA') return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
}

// Helper to format dates or return "TBA"
function formatDateRange(startDateStr, endDateStr) {
    if (!startDateStr || startDateStr.toUpperCase() === 'TBA') return 'TBA';
    
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    
    const start = parseLocalDate(startDateStr);
    const end = endDateStr ? parseLocalDate(endDateStr) : start;

    if (!start || isNaN(start)) return 'TBA';

    const startMonth = months[start.getMonth()];
    const startDay = start.getDate();
    
    const endMonth = months[end.getMonth()];
    const endDay = end.getDate();

    if (startDateStr === endDateStr || !endDateStr) {
        return `${startMonth} ${startDay}`;
    }
    
    if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${startDay}–${endDay}`;
    } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
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
        
        // If it's TBA or has no valid end date, default it to the current/upcoming year so it lands in Upcoming
        const isTba = !dateObj || isNaN(dateObj) || (event.start && event.start.toUpperCase() === 'TBA');
        const year = isTba ? new Date().getFullYear() : dateObj.getFullYear();
        
        // TBA or future dates go to Upcoming, past dates go to Past
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

    const separator = document.createElement('div');
    separator.className = 'hlinesecondary';
    separator.style.height = 'clamp(.25px, 0.125vw, 1px)';
    container.appendChild(separator);

    container.appendChild(buildSection('Past', pastObj));
}

// Render Publications, Talks, and Posters
function renderResearch(data) {
    const container = document.getElementById('research-list');
    if (!container) return;
    container.innerHTML = '';

    // 1. PUBLICATIONS SECTION
    if (data.publications) {
        const pubDetails = document.createElement('details');
        pubDetails.open = true;
        pubDetails.className = 'mainDetails';

        const pubSummary = document.createElement('summary');
        pubSummary.textContent = 'Publications';
        pubDetails.appendChild(pubSummary);

        const articlesUl = document.createElement('ul');
        if (data.publications.articles && data.publications.articles.length > 0) {
            data.publications.articles.forEach(pub => {
                articlesUl.appendChild(createPubLi(pub));
            });
        }
        pubDetails.appendChild(articlesUl);

        if (data.publications.preprints && data.publications.preprints.length > 0) {
            const subtitle = document.createElement('div');
            subtitle.className = 'subtitle';
            subtitle.textContent = 'Preprints';
            pubDetails.appendChild(subtitle);

            const preprintsUl = document.createElement('ul');
            data.publications.preprints.forEach(pub => {
                preprintsUl.appendChild(createPubLi(pub));
            });
            pubDetails.appendChild(preprintsUl);
        }

        container.appendChild(pubDetails);
    }

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

    container.appendChild(createSeparator());

    // 2. TALKS SECTION
    if (data.talks) {
        const talksDetails = document.createElement('details');
        talksDetails.open = true;
        talksDetails.className = 'mainDetails';

        const talksSummary = document.createElement('summary');
        talksSummary.textContent = 'Talks';
        talksDetails.appendChild(talksSummary);

        const talksUl = document.createElement('ul');
        data.talks.forEach(talk => {
            const li = document.createElement('li');
            
            const em = document.createElement('em');
            em.textContent = talk.title;
            li.appendChild(em);

            li.append(document.createTextNode(`; ${talk.event}, ${talk.location}, ${talk.date}`));
            talksUl.appendChild(li);
        });

        talksDetails.appendChild(talksUl);
        container.appendChild(talksDetails);
    }

    container.appendChild(createSeparator());

    // 3. POSTERS SECTION
    if (data.posters) {
        const postersDetails = document.createElement('details');
        postersDetails.open = true;
        postersDetails.className = 'mainDetails';

        const postersSummary = document.createElement('summary');
        postersSummary.textContent = 'Posters';
        postersDetails.appendChild(postersSummary);

        const postersUl = document.createElement('ul');
        data.posters.forEach(poster => {
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

            li.append(document.createTextNode(`; ${poster.event}, ${poster.location}, ${poster.date}.`));
            postersUl.appendChild(li);
        });

        postersDetails.appendChild(postersUl);
        container.appendChild(postersDetails);
    }
}

// Utility to create horizontal divider line
function createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'hlinesecondary';
    separator.style.height = 'clamp(.25px, 0.125vw, 1px)';
    return separator;
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