/* ========================================
   script.js – 3DPM Landing
   ======================================== */

// ── Menú hamburguesa ──────────────────────
const menuBtn   = document.getElementById('menuBtn');
const navLinks  = document.getElementById('navLinks');

menuBtn.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuBtn.classList.toggle('open', isOpen);
  menuBtn.setAttribute('aria-expanded', isOpen);
});

// Cerrar menú al hacer click en un link
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', false);
  });
});

// ── Scroll reveal ─────────────────────────
const revealEls = document.querySelectorAll(
  '.section-inner, .service-card, .product-card, .scroll-hint'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealEls.forEach(el => observer.observe(el));

// ── Indicador de sección activa en el nav (scroll-spy) ────
// Solo corre en páginas que tienen secciones con id (la landing).
// En productos.html, el link activo ya se marca directo en el HTML.
const navSections = document.querySelectorAll('section[id]');
const navLinksList = document.querySelectorAll('.nav-links a[href^="#"]');

if (navSections.length && navLinksList.length) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute('id');
        navLinksList.forEach(link => {
          const isMatch = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', isMatch);
        });
      });
    },
    {
      // Franja angosta en el centro vertical de la pantalla:
      // la sección "activa" es la que cruza esa franja al scrollear.
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    }
  );

  navSections.forEach(section => spyObserver.observe(section));
}

// ── Navbar: sombra al scrollear ───────────
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  } else {
    navbar.style.boxShadow = 'none';
  }
}, { passive: true });

// ── Smooth scroll para browsers viejos ────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
