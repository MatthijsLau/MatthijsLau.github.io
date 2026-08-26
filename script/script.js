// ===============================
// Banner configuration
// ===============================
const images = [
    '../assets/images/banners/banner-fisciano.webp',
    '../assets/images/banners/banner-siena.webp',
    '../assets/images/banners/banner-skadar.webp',
    '../assets/images/banners/banner-sg.webp',
    '../assets/images/banners/banner-blacklake.webp'
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

    // We set the CSS Variable on the header element itself.
    // The ::before element in the CSS will then "pick it up".
    header.style.setProperty('--banner-url', `url('${currentBanner}')`);
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
        window.scrollTo(0, 0);
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
});