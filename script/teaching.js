// ===============================
// Global variables
// ===============================
let TEACHING_HTML = '';
let TEACHING_LOADED = false;
let TEACHING_PROMISE = null;

// These will store the loaded JSON
let LOCATIONS_DATA = {};
let COURSES_DATA = [];

// ===============================
// Generate HTML for teaching
// ===============================
function generateTeachingHTML(courses, locations) {
    let html = '';

    // Group courses by locationId
    const byLocation = {};
    courses.forEach(course => {
        if (!byLocation[course.locationId]) byLocation[course.locationId] = [];
        byLocation[course.locationId].push(course);
    });

    // For each locationId
    Object.keys(byLocation).forEach(locationId => {
        const loc = locations[locationId];
        if (!loc) return; // skip unknown locations

        html += `<details open class="mainDetails">\n`;
        html += `  <summary>At ${loc.fullname}</summary>\n`;
        if (loc.subtitle) {
            html += `  <div class="subtitle">${loc.subtitle}</div>\n`;
        }

        // Group by year
        const coursesInLocation = byLocation[locationId];
        const byYear = {};
        coursesInLocation.forEach(course => {
            if (!byYear[course.year]) byYear[course.year] = [];
            byYear[course.year].push(course);
        });

        // Sort years descending
        const sortedYears = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

        sortedYears.forEach(year => {
            html += `  <details open class="secondaryDetails">\n`;
            html += `    <summary>${year}</summary>\n`;

            // Group by season
            const coursesBySeason = {};
            byYear[year].forEach(course => {
                if (!coursesBySeason[course.season]) coursesBySeason[course.season] = [];
                coursesBySeason[course.season].push(course.title);
            });

            // Sort seasons: Spring before Fall
            const seasonOrder = ['Spring', 'Fall'];
            const sortedSeasons = Object.keys(coursesBySeason).sort(
                (a, b) => seasonOrder.indexOf(a) - seasonOrder.indexOf(b)
            );
            html += `    <ul>\n`;
            // Render courses by season
            sortedSeasons.forEach(season => {

                coursesBySeason[season].forEach(title => {
                    html += `      <li>${title}, ${season}</li>`;
                });

            });
            html += `    </ul>\n`;
            html += '  </details>\n';
        });

        html += '</details>\n';
    });

    return html;
}

// ===============================
// Load teaching data and locations (Promise-based)
// ===============================
function loadTeaching() {
    if (TEACHING_PROMISE) return TEACHING_PROMISE;

    TEACHING_PROMISE = Promise.all([
        fetch('assets/data/locations.json').then(res => res.json()),
        fetch('assets/data/teaching.json').then(res => res.json())
    ])
        .then(([locationsArr, coursesArr]) => {
            // Convert locations array to dictionary by id
            LOCATIONS_DATA = {};
            locationsArr.forEach(loc => {
                LOCATIONS_DATA[loc.id] = loc;
            });

            COURSES_DATA = coursesArr;
            TEACHING_HTML = generateTeachingHTML(COURSES_DATA, LOCATIONS_DATA);
            TEACHING_LOADED = true;
            window.AppTeaching.TEACHING_HTML = TEACHING_HTML;
            return TEACHING_HTML;
        })
        .catch(err => {
            TEACHING_HTML = '<p>No teaching data found.</p>';
            TEACHING_LOADED = true;
            window.AppTeaching.TEACHING_HTML = TEACHING_HTML;
            console.error('Failed to load teaching.json :', err);
            return TEACHING_HTML;
        });

    return TEACHING_PROMISE;
}

// ===============================
// Render the HTML into a div by ID
// ===============================
function renderTeachingList(divId = 'teaching-list') {
    const container = document.getElementById(divId);
    if (!container) return;
    container.innerHTML = TEACHING_HTML || '<p>No teaching data found</p>';
}

// ===============================
// Expose globally
// ===============================
window.AppTeaching = {
    renderTeachingList,
    loadTeaching,
    getTeachingHTML: () => TEACHING_HTML
};

// ===============================
// On document ready, load teaching
// ===============================
document.addEventListener('DOMContentLoaded', loadTeaching);