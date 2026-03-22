// ===============================
// Banner configuration
// ===============================
const images = [
    '/assets/images/banners/banner-fisciano.png',
    '/assets/images/banners/banner-siena.png',
    '/assets/images/banners/banner-skadar.png',
    '/assets/images/banners/banner-sg.png',
    '/assets/images/banners/banner-blacklake.png'
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
    const $header = $('.header');

    if (!$header.length) return;

    // We set the CSS Variable on the header element itself.
    // The ::before element in the CSS will then "pick it up".
    $header.get(0).style.setProperty('--banner-url', `url('${currentBanner}')`);
}

// ===============================
// Page loader
// ===============================
function loadPage(page, target = '#content') {
    const $target = $(target);

    return new Promise((resolve, reject) => {
        $target.load(page, function (response, status) {
            if (status === 'error') {
                console.error(`Failed to load page: ${page}`);
                reject();
                return;
            }

            $target.show();

            // Apply banner AFTER content is loaded
            applyBanner();

            resolve();
        });
    });
}

// ===============================
// Include loader
// ===============================
function loadIncludes() {
    const jobs = [];

    $('[data-include]').each(function () {
        const $el = $(this);
        const file = $el.data('include') + '.html';

        const job = $.get(file)
            .then(html => {
                $el.html(html);
            })
            .catch(() => {
                console.warn(`⚠️ Failed to load include: ${file}`);
                $el.html('');
            });

        jobs.push(job);
    });

    return Promise.all(jobs);
}

// ===============================
// Navigation
// ===============================
function setupNavigation() {
    $(document).on('click', '.nav-link', function (e) {
        e.preventDefault();

        const page = $(this).data('page');
        if (!page) return;

        loadPage(page + '.html');
    });
}

// ===============================
// Initialization
// ===============================
function init() {
    // Pick ONE random banner per session
    currentBanner = getRandomImage();
    preloadImage(currentBanner);

    // Load layout first, then content
    loadIncludes()
        .then(() => loadPage('aboutme.html'))
        .then(() => {
            // Safety reapply (in case header is outside loaded content)
            applyBanner();
        })
        .catch(() => {
            console.error('Initialization failed');
        });
}

// ===============================
// Start app
// ===============================
$(document).ready(function () {
    init();
    setupNavigation();
});