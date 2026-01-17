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
// Page loader
// ===============================
function loadPage(file, target = '#content') {
    $(target).load(file, function () {
        // After content is loaded
        if (file === 'research.html') {
            window.AppEvents.loadEvents().then(() => {
                window.AppEvents.renderEventsList();
            });
            window.AppPublications.loadPublications().then(() => {
                window.AppPublications.renderPublicationsList();
            });
            window.AppTalks.loadTalks().then(() => {
                window.AppTalks.renderTalksList();
            });
            window.AppPosters.loadPosters().then(() => {
                window.AppPosters.renderPostersList();
            });
        }
        else if (file === 'teaching.html') {
            window.AppTeaching.loadTeaching().then(() => {
                window.AppTeaching.renderTeachingList();
            });
        }
    });
}

// ===============================
// Include loader
// ===============================
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

// ===============================
// On document ready
// ===============================
$(function () {
    loadIncludes().then(() => {
        randBanner();           // Pick random banner
        loadPage('aboutme.html'); // Load default page
    });
});

// ===============================
// Navigation elements
// ===============================
$(document).on('click', '.nav-link', function (e) {
    e.preventDefault();
    const page = $(this).data('page');
    if (!page) return;
    loadPage(page + '.html');
});