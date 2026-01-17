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

function preloadImage(url) { const img = new Image(); img.src = url; }

function setBanner(url) {
    const $banner = $('.banner-header');
    if (!$banner.length) return;
    $banner.css(
        'background-image',
        `linear-gradient(rgba(248,247,242,0.5), rgba(248,247,242,0.8)), url('${url}')`
    );
}

// ===============================
// Page loader with hooks
// ===============================
const pageHooks = {
    'research.html': () => Promise.all([
        window.AppEvents?.loadEvents?.().then(() => window.AppEvents.renderEventsList()),
        window.AppPublications?.loadPublications?.().then(() => window.AppPublications.renderPublicationsList()),
        window.AppTalks?.loadTalks?.().then(() => window.AppTalks.renderTalksList()),
        window.AppPosters?.loadPosters?.().then(() => window.AppPosters.renderPostersList())
    ]),
    'teaching.html': () =>
        window.AppTeaching?.loadTeaching?.().then(() => window.AppTeaching.renderTeachingList())
};

function loadPage(file, target = '#content') {
    $(target).load(file, function () {
        $(target).show();
        pageHooks[file]?.(); // 👈 run hook if it exists
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
    const rand_img = images[Math.floor(Math.random() * images.length)];
    preloadImage(rand_img)

    loadIncludes().then(() => {
        setBanner(rand_img);           // Pick random banner
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