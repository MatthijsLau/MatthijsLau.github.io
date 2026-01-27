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

function loadPage(file, target = '#content') {
    $(target).load(file, function () {
        $(target).show();
        pageHooks[file]?.(); // 👈 run hook if it exists
    });
}

$(function () {
    const rand_img = images[Math.floor(Math.random() * images.length)];
    preloadImage(rand_img)

    loadIncludes().then(() => {
        setBanner(rand_img);
        loadPage('aboutme.html')
    });
});



$(document).on('click', '.nav-link', function (e) {
    e.preventDefault();
    const page = $(this).data('page');
    if (!page) return;
    loadPage(page + '.html');
});