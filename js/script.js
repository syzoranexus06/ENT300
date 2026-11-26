/* =========================================================
   SYZORA NEXUS — Master Script
   Animations, cursor, particles, countdown, FAQ, forms…
   ========================================================= */

(() => {
  'use strict';

  /* =========================
     PRELOADER
  ========================= */

  window.addEventListener('load', () => {
    setTimeout(() => {
      const p = document.getElementById('preloader');
      if (p) p.classList.add('gone');
      document.body.classList.add('loaded');
    }, 1100);
  });

  /* =========================
     PARTICLES BACKGROUND
  ========================= */


  const canvas = document.getElementById('particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, parts = [];
    const COUNT = window.innerWidth < 700 ? 35 : 75;
    const COLORS = ['#a855f7', '#d946ef', '#06e7ff', '#c084fc'];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.4,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        a: Math.random() * 0.5 + 0.2
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x;
          const dy = parts[i].y - parts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < 130) {
            ctx.strokeStyle = `rgba(168,85,247,${0.18 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }

      parts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.fillStyle = p.c;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.c;
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    };

    draw();
  }

  /* =========================
     NAV SCROLL + MOBILE TOGGLE
  ========================= */

  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (!nav) return;

    if (window.scrollY > 30) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll);
  onScroll();

  const toggleBtn = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');

  if (toggleBtn && navList) {
    toggleBtn.addEventListener('click', () => {
      navList.classList.toggle('open');
    });

    document.querySelectorAll('.has-sub > .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 1100) {
          e.preventDefault();

          document.querySelectorAll('.has-sub.open').forEach(openItem => {
            if (openItem !== link.parentElement) {
              openItem.classList.remove('open');
            }
          });

          link.parentElement.classList.toggle('open');
        }
      });
    });
  }

  /* =========================
     SUBMENU HOVER
  ========================= */

  document.querySelectorAll('.has-sub').forEach(item => {
    item.addEventListener('mouseenter', () => {
      if (window.innerWidth > 1100) {
        document.querySelectorAll('.has-sub.open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('open');
          }
        });

        item.classList.add('open');
      }
    });

    item.addEventListener('mouseleave', () => {
      if (window.innerWidth > 1100) {
        item.classList.remove('open');
      }
    });
  });

  /* =========================
     REVEAL-ON-SCROLL FALLBACK
  ========================= */

  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(r => io.observe(r));
  }

  /* =========================
     AOS INIT
  ========================= */

  if (window.AOS) {
    AOS.init({
      duration: 900,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
  }

  /* =========================
     GSAP ANIMATIONS
  ========================= */

  if (window.gsap) {
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    if (document.querySelector('.hero')) {
      const tl = gsap.timeline({ delay: 1.0 });

      tl.from('.hero-tag', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      })
      .from('.hero-title .line', {
        y: 80,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: 'power4.out'
      }, '-=0.4')
      .from('.hero-sub', {
        y: 30,
        opacity: 0,
        duration: 0.7
      }, '-=0.5')
      .from('.hero-actions .btn', {
        y: 20,
        opacity: 0,
        stagger: 0.12,
        duration: 0.6
      }, '-=0.4')
      .from('.hero-stats .stat', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6
      }, '-=0.4')
      .from('.console-card', {
        x: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power3.out'
      }, '-=1');
    }

    if (window.ScrollTrigger) {
      gsap.to('.hero-bg', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      document.querySelectorAll('[data-counter]').forEach(el => {
        const target = parseFloat(el.dataset.counter);
        const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
        const obj = { val: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: target,
              duration: 2,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = obj.val
                  .toFixed(decimals)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
            });
          }
        });
      });

      gsap.utils.toArray('.gsap-fade').forEach(el => {
        gsap.from(el, {
          y: 50,
          opacity: 0,
          duration: 1,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%'
          }
        });
      });

      document.querySelectorAll('.progress .fill').forEach(bar => {
        const w = bar.dataset.width || '0%';

        ScrollTrigger.create({
          trigger: bar,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            bar.style.width = w;
          }
        });
      });
    }
  }

  /* =========================
     FAQ TOGGLE
  ========================= */

  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');

    if (q) {
      q.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('active');
        });

        if (!wasActive) {
          item.classList.add('active');
        }
      });
    }
  });

  /* =========================
     COUNTDOWN
  ========================= */

  const cd = document.querySelector('[data-countdown]');

  if (cd) {
    const target = new Date(cd.dataset.countdown).getTime();
    const $d = cd.querySelector('[data-d]');
    const $h = cd.querySelector('[data-h]');
    const $m = cd.querySelector('[data-m]');
    const $s = cd.querySelector('[data-s]');

    const tick = () => {
      const now = Date.now();
      let diff = Math.max(0, target - now);

      const d = Math.floor(diff / 86400000);
      diff -= d * 86400000;

      const h = Math.floor(diff / 3600000);
      diff -= h * 3600000;

      const m = Math.floor(diff / 60000);
      diff -= m * 60000;

      const s = Math.floor(diff / 1000);

      if ($d) $d.textContent = String(d).padStart(2, '0');
      if ($h) $h.textContent = String(h).padStart(2, '0');
      if ($m) $m.textContent = String(m).padStart(2, '0');
      if ($s) $s.textContent = String(s).padStart(2, '0');
    };

    tick();
    setInterval(tick, 1000);
  }

  /* =========================
     NON-OPERATIONAL FORM GUARD
     This academic prototype does not accept real submissions.
  ========================= */

  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const msg = form.querySelector('.form-msg');
      if (msg) {
        msg.textContent = 'Demonstration only — this form does not send information.';
        msg.classList.add('show');
      }
    });
  });

  /* =========================
     GALLERY LIGHTBOX
  ========================= */

  const lb = document.querySelector('.lightbox');

  if (lb) {
    const lbImg = lb.querySelector('img');

    document.querySelectorAll('.gallery-item img').forEach(img => {
      img.addEventListener('click', () => {
        lbImg.src = img.src;
        lb.classList.add('open');
      });
    });

    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('close')) {
        lb.classList.remove('open');
      }
    });
  }

  /* =========================
     MAGNETIC BUTTONS
  ========================= */

  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;

      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* =========================
     TYPING EFFECT
  ========================= */

  document.querySelectorAll('[data-typing]').forEach(el => {
    const words = el.dataset.typing.split('|');
    let i = 0;
    let j = 0;
    let del = false;
    const speed = 90;
    const pause = 1400;

    const loop = () => {
      const w = words[i];
      el.textContent = w.substring(0, j);

      if (!del && j < w.length) {
        j++;
        setTimeout(loop, speed);
      } else if (del && j > 0) {
        j--;
        setTimeout(loop, speed / 2);
      } else {
        del = !del;

        if (!del) {
          i = (i + 1) % words.length;
        }

        setTimeout(loop, pause);
      }
    };

    loop();
  });

  /* =========================
     TILT EFFECT
  ========================= */

  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;

      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  /* =========================
     ACTIVE NAV BASED ON PAGE
  ========================= */

  const path = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-list a').forEach(a => {
    const href = a.getAttribute('href');

    if (
      href === path ||
      (path === '' && href === 'index.html') ||
      (path === 'index.html' && href === 'index.html')
    ) {
      a.classList.add('active');

      const parent = a.closest('.has-sub');
      if (parent) {
        parent.querySelector('.nav-link').classList.add('active');
      }
    }
  });

  /* =========================
     SMOOTH ANCHOR
  ========================= */

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');

      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();

        document.querySelector(id).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  /* =========================
     ENT300 ACADEMIC PROTOTYPE
     No account, booking, payment, or tournament API is provided.
     All business interaction examples remain informational only.
  ========================= */

  /* =========================
     PHOTO TOUR SLIDER
  ========================= */

  const snSetupPhotoTourSlider = () => {
    const slider = document.getElementById('photoTourSlider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.photo-slide'));
    const dots = Array.from(document.querySelectorAll('[data-photo-dot]'));
    const prevBtn = slider.querySelector('.slider-prev');
    const nextBtn = slider.querySelector('.slider-next');
    const slideDuration = 4000;
    let currentSlide = 0;
    let autoSlide = null;

    const showSlide = (index) => {
      if (!slides.length) return;
      currentSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentSlide);
      });

      dots.forEach((dot, i) => {
        const isActive = i === currentSlide;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    };

    const stopAutoSlide = () => {
      if (autoSlide) clearInterval(autoSlide);
    };

    const startAutoSlide = () => {
      stopAutoSlide();
      autoSlide = setInterval(() => showSlide(currentSlide + 1), slideDuration);
    };

    const moveSlide = (direction) => {
      showSlide(currentSlide + direction);
      startAutoSlide();
    };

    if (prevBtn) prevBtn.addEventListener('click', () => moveSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => moveSlide(1));

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        showSlide(Number(dot.dataset.photoDot));
        startAutoSlide();
      });
    });

    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);

    showSlide(0);
    startAutoSlide();
  };

  /* =========================
     BACK TO TOP BUTTON
  ========================= */

  const snSetupBackToTop = () => {
    if (document.querySelector('.back-to-top')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i><span>TOP</span>';
    document.body.appendChild(btn);

    const toggle = () => {
      btn.classList.toggle('is-visible', window.scrollY > 420);
    };

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  };

  snSetupPhotoTourSlider();
  snSetupBackToTop();

})();
