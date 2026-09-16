/**
 * ==========================================================================
 * PORTAFOLIO ACADÉMICO - M.SC. EN FÍSICA
 * Lógica Front-End: Navegación, Animaciones al Scroll, Partículas Canvas y Filtros
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initPhysicsCanvas();
  initHeaderAndNav();
  initScrollSpy();
  initScrollAnimations();
  initProjectFilters();
  initCopyEmail();
  initContactForm();
  initBackToTop();
  updateCurrentYear();
});

/**
 * 1. SIMULACIÓN DE FONDO: RED DE PARTÍCULAS CUÁNTICAS / ONDAS EN CANVAS
 * Renderiza nodos dinámicos con conexiones de proximidad y respuesta sutil al cursor.
 */
function initPhysicsCanvas() {
  const canvas = document.getElementById('physics-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Comprobar si el usuario prefiere movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Configuración de la simulación
  const PARTICLE_COUNT = Math.min(Math.floor((width * height) / 18000), 75);
  const MAX_DISTANCE = 130;
  const particles = [];

  const mouse = {
    x: null,
    y: null,
    radius: 120
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Clase Partícula
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 1.8 + 1;
      this.baseAlpha = Math.random() * 0.4 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Rebote suave en los bordes
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Interacción sutil con el cursor
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const fx = (dx / dist) * force * 1.2;
          const fy = (dy / dist) * force * 1.2;
          this.x -= fx;
          this.y -= fy;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${this.baseAlpha})`;
      ctx.fill();
    }
  }

  // Inicializar partículas
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  // Bucle de renderizado
  function render() {
    ctx.clearRect(0, 0, width, height);

    // Dibujar enlaces / conexiones entre partículas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MAX_DISTANCE) {
          const alpha = (1 - distance / MAX_DISTANCE) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Actualizar y dibujar partículas
    particles.forEach((p) => {
      if (!prefersReducedMotion) p.update();
      p.draw();
    });

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(render);
    }
  }

  render();

  // Redimensionamiento responsivo
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (prefersReducedMotion) render();
  });
}

/**
 * 2. HEADER Y NAVEGACIÓN (Sticky header, menú móvil y accesibilidad)
 */
function initHeaderAndNav() {
  const header = document.getElementById('main-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  // Efecto de sombra y fondo al hacer scroll en header
  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Alternar menú móvil
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });

    // Cerrar menú al hacer clic en un enlace
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
      });
    });

    // Cerrar al hacer clic fuera del menú
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && mobileNav.classList.contains('open')) {
        menuToggle.classList.remove('open');
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
      }
    });
  }
}

/**
 * 3. SCROLLSPY: Resaltado dinámico del enlace activo en la barra superior
 */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-desktop .nav-link');

  if (!sections.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const currentId = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href === `#${currentId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

/**
 * 4. ANIMACIONES AL SCROLL (IntersectionObserver para desvanecimiento y subida)
 */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!revealElements.length) return;

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target); // Dejar de observar tras animar
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Respaldo inmediato en navegadores antiguos
    revealElements.forEach((el) => el.classList.add('is-revealed'));
  }
}

/**
 * 5. FILTRO DE PROYECTOS Y TRABAJOS DE MAESTRÍA
 */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Manejar estado visual de los botones
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filterValue = btn.getAttribute('data-filter');

      // Filtrar tarjetas con transición suave
      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');

        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 30);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

/**
 * 6. COPIAR CORREO AL PORTAPAPELES CON FEEDBACK VISUAL
 */
function initCopyEmail() {
  const copyBtn = document.getElementById('btn-copy-email');
  const emailTextEl = document.getElementById('email-text');

  if (!copyBtn || !emailTextEl) return;

  copyBtn.addEventListener('click', async () => {
    const email = emailTextEl.textContent.trim();
    const copyIcon = copyBtn.querySelector('.icon-copy');
    const checkIcon = copyBtn.querySelector('.icon-check');

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
      } else {
        // Método alternativo para contextos no seguros
        const textArea = document.createElement('textarea');
        textArea.value = email;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // Animación de éxito en el botón
      if (copyIcon && checkIcon) {
        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');
      }

      showToast('¡Correo electrónico copiado al portapapeles!');

      setTimeout(() => {
        if (copyIcon && checkIcon) {
          copyIcon.classList.remove('hidden');
          checkIcon.classList.add('hidden');
        }
      }, 2500);

    } catch (err) {
      showToast('Error al copiar el correo. Selecciónalo manualmente.');
    }
  });
}

/**
 * 7. FORMULARIO DE CONTACTO (Validación y mensaje de confirmación)
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');

  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('btn-submit-form');
    const originalBtnContent = submitBtn.innerHTML;

    // Estado cargando
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Enviando...</span>';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;

      feedback.classList.remove('hidden', 'error');
      feedback.classList.add('success');
      feedback.textContent = '¡Gracias por tu mensaje! Me pondré en contacto contigo a la brevedad.';

      form.reset();

      setTimeout(() => {
        feedback.classList.add('hidden');
      }, 6000);
    }, 1000);
  });
}

/**
 * 8. BOTÓN VOLVER ARRIBA (FLOATING BACK TO TOP)
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 450) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * 9. NOTIFICACIÓN TOAST
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/**
 * 10. ACTUALIZAR AÑO ACTUAL AUTOMÁTICAMENTE
 */
function updateCurrentYear() {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
