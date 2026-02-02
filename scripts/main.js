/* ===================================
   でじるみ ポートフォリオ - JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initSlider();
});

/* ===== Navigation ===== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        updateActiveNavLink();
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

/* ===== Scroll Animations ===== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.section-header, .gallery-item, .video-item, .illustration-card, .contact-card, .about-features li'
    );

    // Add fade-in class to elements
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
    });

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/* ===== Illustration Slider ===== */
function initSlider() {
    const slider = document.getElementById('illustrationSlider');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');

    if (!slider || !prevBtn || !nextBtn) return;

    const slides = slider.querySelectorAll('.slide');
    const slideWidth = 300 + 24; // slide width + gap
    let currentPosition = 0;
    let maxPosition = 0;

    function updateMaxPosition() {
        const containerWidth = slider.parentElement.offsetWidth;
        const totalWidth = slides.length * slideWidth;
        maxPosition = Math.max(0, totalWidth - containerWidth);
    }

    function updateSliderPosition() {
        slider.style.transform = `translateX(-${currentPosition}px)`;
    }

    prevBtn.addEventListener('click', () => {
        currentPosition = Math.max(0, currentPosition - slideWidth);
        updateSliderPosition();
    });

    nextBtn.addEventListener('click', () => {
        updateMaxPosition();
        currentPosition = Math.min(maxPosition, currentPosition + slideWidth);
        updateSliderPosition();
    });

    // Touch/swipe support
    let startX = 0;
    let isDragging = false;

    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const diff = startX - e.touches[0].clientX;

        if (Math.abs(diff) > 50) {
            updateMaxPosition();
            if (diff > 0) {
                currentPosition = Math.min(maxPosition, currentPosition + slideWidth);
            } else {
                currentPosition = Math.max(0, currentPosition - slideWidth);
            }
            updateSliderPosition();
            isDragging = false;
        }
    });

    slider.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Recalculate on resize
    window.addEventListener('resize', () => {
        updateMaxPosition();
        currentPosition = Math.min(currentPosition, maxPosition);
        updateSliderPosition();
    });
}

/* ===== Smooth Scroll Enhancement ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});
