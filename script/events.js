// ===============================
// Global variables for Talks
// ===============================
let EVENTS_HTML = '';
let EVENTS_LOADED = false;
let EVENTS_PROMISE = null;

// ===============================
// Utilities: parse and format events
// ===============================
function parseEventDate(date) {
    if (!date) return null;
    const start = new Date(date.start);
    const end = date.end ? new Date(date.end) : null;
    return { start: isNaN(start) ? null : start, end: isNaN(end) ? null : end };
}

// Format date without year, e.g., "Aug 3-8" or "Jun 30 - Jul 4"
function formatEventDate(dateObj) {
    if (!dateObj || !dateObj.start) return "TBA";

    const options = { day: 'numeric', month: 'short' };
    const startStr = dateObj.start.toLocaleDateString('en-GB', options);
    const end = dateObj.end;

    if (!end || end.getTime() === dateObj.start.getTime()) {
        return startStr;
    }

    const endStr = end.toLocaleDateString('en-GB', options);

    if (dateObj.start.getMonth() === end.getMonth()) {
        // Same month: "Aug 3-8"
        return `${dateObj.start.toLocaleDateString('en-GB', { month: 'short' })} ${dateObj.start.getDate()}-${end.getDate()}`;
    } else {
        // Different months: "Jun 30 - Jul 4"
        return `${startStr} – ${endStr}`;
    }
}

// ===============================
// Group events by year and past/upcoming
// ===============================
function groupEventsByYear(events) {
    const today = new Date();
    const past = {};
    const upcoming = {};

    events.forEach(event => {
        let eventYear;
        let container;
        let dateObj = null;

        // Handle TBA events per object
        if (event.tba === true && Number.isInteger(event.year)) {
            eventYear = event.year;
            container = upcoming;
        } else {
            dateObj = parseEventDate(event.date);
            const eventEnd = dateObj?.end || dateObj?.start;

            // Skip invalid non-TBA events
            if (!eventEnd) return;

            eventYear = eventEnd.getFullYear();
            container = eventEnd >= today ? upcoming : past;
        }

        if (!container[eventYear]) {
            container[eventYear] = [];
        }

        container[eventYear].push({
            ...event,
            dateObj
        });
    });

    const sortYearsAndEvents = container =>
        Object.keys(container)
            .sort((a, b) => b - a)
            .map(year => ({
                year,
                events: container[year].sort((a, b) => {
                    // TBA events last within the year
                    if (!a.dateObj && !b.dateObj) return 0;
                    if (!a.dateObj) return 1;
                    if (!b.dateObj) return -1;
                    return b.dateObj.start - a.dateObj.start;
                })
            }));

    return {
        past: sortYearsAndEvents(past),
        upcoming: sortYearsAndEvents(upcoming)
    };
}


// ===============================
// Generate HTML for grouped events
// ===============================
function generateEventsHTML(events) {
    const { past, upcoming } = groupEventsByYear(events);

    const buildYearHTML = yearGroup => `
        <details open class="secondaryDetails">
            <summary>${yearGroup.year}</summary>
            <ul>
                ${yearGroup.events.map(event => {
                    const dateStr = event.tba
                        ? 'TBA'
                        : formatEventDate(event.dateObj);

                    const location = event.location || '';
                    const linkStart = event.url
                        ? `<a href="${event.url}" target="_blank" rel="noopener noreferrer">`
                        : '';
                    const linkEnd = event.url ? `</a>` : '';
                    const title = event.title || "Untitled";

                    return `<li>
                        <span class="flexspan">
                            <span>${linkStart}${title}${linkEnd}, ${location}</span>
                            <span class="date">${dateStr}</span>
                        </span>
                    </li>`;
                }).join("\n")}
            </ul>
        </details>`;

    const buildSectionHTML = (title, list) => {
        if (!list.length) return '';
        return `
        <details open class="mainDetails">
            <summary>${title}</summary>
            ${list.map(buildYearHTML).join("\n")}
        </details>`;
    };

    const upcomingHTML = buildSectionHTML("Upcoming", upcoming);
    const pastHTML = buildSectionHTML("Past", past);

    const divider =
        upcomingHTML && pastHTML
            ? `<div class="hline" style="height:1px"></div>`
            : '';

    return upcomingHTML + divider + pastHTML;
}


// ===============================
// Load events data (Promise-based)
// ===============================
function loadEvents() {
    if (EVENTS_PROMISE) return EVENTS_PROMISE;

    EVENTS_PROMISE = fetch('assets/data/events.json')
        .then(res => res.json())
        .then(events => {
            EVENTS_HTML = generateEventsHTML(events);
            EVENTS_LOADED = true;
            window.AppEvents.EVENTS_HTML = EVENTS_HTML;
            return EVENTS_HTML;
        })
        .catch(err => {
            EVENTS_HTML = '';
            EVENTS_LOADED = true;
            window.AppEvents.EVENTS_HTML = EVENTS_HTML;
            console.error('Failed to load events.json:', err);
            return EVENTS_HTML;
        });

    return EVENTS_PROMISE;
}

// ===============================
// Load events JSON and render into div
// ===============================
function renderEventsList(divId = 'events-list') {
    const container = document.getElementById(divId);
    if (!container) return;
    container.innerHTML = EVENTS_HTML || 'No events found';
}

// ===============================
// Expose globally
// ===============================
window.AppEvents = {
    renderEventsList,
    loadEvents,
    getEventsHTML: () => EVENTS_HTML
};

// Load automatically on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.AppEvents.renderEventsList();
});
