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
// Navigation
// ===============================
function setupNavigation() {
    $(document).on('click', '.nav-link', function (e) {
        e.preventDefault();

        const page = $(this).data('page');
        if (!page) return;

        $('.page').hide();
        $(`#${page}`).show();
        history.replaceState(null, '', `#${page}`);
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    });
}

// ===============================
// Initialization
// ===============================
function init() {
    // Pick one banner for this page load.
    currentBanner = getRandomImage();
    preloadImage(currentBanner);
    applyBanner();

    const page = window.location.hash.substring(1);
    const initialPage = ['aboutme', 'research', 'teaching'].includes(page) ? page : 'aboutme';
    $('.page').hide();
    $(`#${initialPage}`).show();
}

// ===============================
// Start app
// ===============================
$(document).ready(function () {
    init();
    setupNavigation();
});