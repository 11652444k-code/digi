/* ===================================
   でじるみ ポートフォリオ - JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initSlider();
    initTypewriter();
    initParticles();
    initMouseFollower();
    initParallax();
    initTextReveal();
});

/* ===== Typewriter Effect ===== */
function initTypewriter() {
    const element = document.getElementById('typewriter');
    if (!element) return;

    const phrases = [
        'Creative Works ✨',
        'Design 🎨',
        'Video 🎬',
        'Illustration 🖌️',
        'でじるみ 💜'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            element.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            element.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            typingSpeed = 2000; // Wait before deleting
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 500; // Wait before typing next phrase
        }

        setTimeout(type, typingSpeed);
    }

    type();
}

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

/* ===== Particle Background ===== */
function initParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles';
    particleContainer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;';
    hero.insertBefore(particleContainer, hero.firstChild);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${['#ff6b9d', '#ffd93d', '#6bcb77', '#22d3ee', '#c084fc'][Math.floor(Math.random() * 5)]};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.6 + 0.2};
            animation: particleFloat ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        particleContainer.appendChild(particle);
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/* ===== Mouse Follower 3D Effect ===== */
function initMouseFollower() {
    const cards = document.querySelectorAll('.gallery-item, .video-item, .illustration-card, .contact-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

/* ===== Parallax Scroll Effect ===== */
function initParallax() {
    const heroContent = document.querySelector('.hero-content');
    const heroBg = document.querySelector('.hero-bg');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0005})`;
        }
    });
}

/* ===== Text Reveal Animation ===== */
function initTextReveal() {
    const sectionHeaders = document.querySelectorAll('.section-title');

    sectionHeaders.forEach(header => {
        const text = header.textContent;
        header.innerHTML = '';
        header.style.overflow = 'hidden';

        [...text].forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.cssText = `
                display: inline-block;
                opacity: 0;
                transform: translateY(50px) rotate(10deg);
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                transition-delay: ${i * 0.05}s;
            `;
            header.appendChild(span);
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('span').forEach(span => {
                    span.style.opacity = '1';
                    span.style.transform = 'translateY(0) rotate(0deg)';
                });
            }
        });
    }, { threshold: 0.5 });

    sectionHeaders.forEach(header => observer.observe(header));
}
