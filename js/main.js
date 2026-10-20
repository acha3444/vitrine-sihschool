/**
 * SihSchool - Scripting Principal
 * Menu mobile accessible, section active, apparitions au défilement, compteurs,
 * filtres formations, accordéons FAQ, mini-atelier alphabet (audio chargé au premier clic),
 * modale des 3 formations, Turnstile chargé à la demande et formulaire de réservation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopNavQuery = window.matchMedia('(min-width: 1280px)');
  const parallaxQuery = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
  const prefersReducedMotion = () => reducedMotionQuery.matches;

  // Verrouillage du défilement partagé (menu + modale)
  const scrollLocks = new Set();
  function lockScroll(key) {
    scrollLocks.add(key);
    root.classList.add('is-locked');
  }
  function unlockScroll(key) {
    scrollLocks.delete(key);
    if (!scrollLocks.size) root.classList.remove('is-locked');
  }

  function getFocusable(container) {
    return Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  function trapFocus(event, container, extra = []) {
    if (event.key !== 'Tab') return;
    const focusable = [...extra, ...getFocusable(container)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // 1. Menu mobile : panneau plein écran, cascade des liens, Échap / lien / clic extérieur
  const siteHeader = document.getElementById('siteHeader');
  const mobileToggle = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');
  let navOpen = false;

  function openNav() {
    if (!mobileToggle || !mainNav || navOpen) return;
    navOpen = true;
    const headerBottom = Math.max(0, Math.round(siteHeader.getBoundingClientRect().bottom));
    mainNav.style.setProperty('--nav-offset', `${headerBottom}px`);
    mainNav.classList.add('is-open');
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileToggle.setAttribute('aria-label', 'Fermer le menu de navigation');
    if (navOverlay) {
      navOverlay.hidden = false;
      requestAnimationFrame(() => navOverlay.classList.add('is-visible'));
    }
    lockScroll('nav');
  }

  function closeNav({ restoreFocus = false } = {}) {
    if (!mobileToggle || !mainNav || !navOpen) return;
    navOpen = false;
    mainNav.classList.remove('is-open');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');
    if (navOverlay) {
      navOverlay.classList.remove('is-visible');
      setTimeout(() => { if (!navOpen) navOverlay.hidden = true; }, 320);
    }
    unlockScroll('nav');
    if (restoreFocus) mobileToggle.focus();
  }

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => (navOpen ? closeNav() : openNav()));

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeNav());
    });

    navOverlay?.addEventListener('click', () => closeNav());

    document.addEventListener('click', (e) => {
      if (navOpen && !mainNav.contains(e.target) && !mobileToggle.contains(e.target)) closeNav();
    });

    document.addEventListener('keydown', (e) => {
      if (!navOpen) return;
      if (e.key === 'Escape') {
        closeNav({ restoreFocus: true });
      } else {
        trapFocus(e, mainNav, [mobileToggle]);
      }
    });

    desktopNavQuery.addEventListener('change', (e) => {
      if (e.matches) closeNav();
    });
  }

  // 2. En-tête, barre de progression et parallaxe (une seule boucle de défilement)
  const progressBar = document.getElementById('readingProgress');
  const heroSection = document.getElementById('accueil');
  const particles = Array.from(document.querySelectorAll('.arabic-letter-particle'));
  const parallaxFactors = [0.12, 0.2, 0.08, 0.16];
  let scrollTicking = false;

  function onScrollFrame() {
    scrollTicking = false;
    const y = window.scrollY;

    siteHeader?.classList.toggle('scrolled', y > 20);

    if (progressBar) {
      const max = root.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
    }

    if (heroSection && particles.length && parallaxQuery.matches && !prefersReducedMotion()) {
      if (y < heroSection.offsetHeight + heroSection.offsetTop) {
        particles.forEach((el, i) => {
          el.style.setProperty('--parallax', `${(y * parallaxFactors[i % parallaxFactors.length]).toFixed(1)}px`);
        });
      }
    }
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }, { passive: true });
  window.addEventListener('resize', onScrollFrame, { passive: true });
  onScrollFrame();

  // 3. Lien du menu surligné selon la section visible
  const navLinks = Array.from(document.querySelectorAll('.nav-menu .nav-link'));
  const sectionsForSpy = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setActiveLink(id) {
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sectionsForSpy.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sectionsForSpy.forEach(section => spy.observe(section));
  }

  // 4. Compteurs (0 → valeur finale) à l'apparition
  function formatCount(value, format) {
    if (format === 'duration') {
      const h = Math.floor(value / 60);
      const m = Math.round(value % 60);
      return `${h}h${String(m).padStart(2, '0')}`;
    }
    return String(Math.round(value));
  }

  function runCounters(scope) {
    if (prefersReducedMotion()) return;
    scope.querySelectorAll('.count[data-count]').forEach(el => {
      if (el.dataset.counted) return;
      el.dataset.counted = 'true';
      const target = Number(el.dataset.count);
      const format = el.dataset.format;
      const finalText = el.textContent;
      // Largeur figée sur la valeur finale : aucun décalage pendant le comptage
      el.style.width = `${el.getBoundingClientRect().width}px`;
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = t < 1 ? formatCount(target * eased, format) : finalText;
        if (t < 1) requestAnimationFrame(step);
      };
      el.textContent = formatCount(0, format);
      requestAnimationFrame(step);
    });
  }

  // 5. Apparitions au défilement (une seule fois) avec cascade de 80 ms dans les grilles
  document.querySelectorAll('[data-stagger]').forEach(group => {
    Array.from(group.children)
      .filter(child => child.classList.contains('reveal'))
      .forEach((child, i) => child.style.setProperty('--reveal-delay', `${i * 80}ms`));
  });

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        runCounters(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // 6. Filtres des formations
  const filterBtns = document.querySelectorAll('.filter-btn');
  const courseCards = document.querySelectorAll('.course-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });

      const filter = btn.dataset.filter;
      courseCards.forEach(card => {
        const category = card.dataset.category;
        const show = filter === 'all' || category === filter || category === 'both';
        if (show) {
          if (!card.hidden) return;
          card.hidden = false;
          card.classList.remove('is-filtered-out', 'is-filtering-in');
          void card.offsetWidth;
          card.classList.add('is-filtering-in');
        } else if (!card.hidden) {
          card.classList.add('is-filtered-out');
          setTimeout(() => {
            if (card.classList.contains('is-filtered-out')) {
              card.hidden = true;
              card.classList.remove('is-filtered-out');
            }
          }, prefersReducedMotion() ? 0 : 200);
        }
      });
    });
  });

  // 7. Accordéon FAQ
  const faqItems = document.querySelectorAll('.faq-item');

  function setFaqState(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq-question')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  faqItems.forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach(other => { if (other !== item) setFaqState(other, false); });
      setFaqState(item, willOpen);
    });
  });

  // 8. Mini-Atelier de l'Alphabet (sons AAC chargés seulement au premier clic)
  const alphabetData = {
    'alif': {
      char: 'أ',
      name: 'Lettre Alif (Alif)',
      audio: 'assets/audio/1_alif.m4a',
      tip: 'La 1ère lettre, verticale et élégante comme un calame droit. Exemple : أَمَل (Amal - Espoir)'
    },
    'ba': {
      char: 'ب',
      name: 'Lettre Bâ (Bâ)',
      audio: 'assets/audio/2_baa.m4a',
      tip: 'Comme un bateau portant un point précieux en dessous. Exemple : بَيْت (Bayt - Maison)'
    },
    'ta': {
      char: 'ت',
      name: 'Lettre Tâ (Tâ)',
      audio: 'assets/audio/3_taa.m4a',
      tip: 'Deux points comme deux yeux souriants au-dessus du plat. Exemple : تِين (Tîn - Figue)'
    },
    'tha': {
      char: 'ث',
      name: 'Lettre Thâ (Thâ)',
      audio: 'assets/audio/4_thaa.m4a',
      tip: 'Son interdental doux (comme "think" en anglais) avec 3 points en couronne. Exemple : ثَوْب (Thawb - Habit)'
    },
    'jim': {
      char: 'ج',
      name: 'Lettre Jîm (Jîm)',
      audio: 'assets/audio/5_jeem.m4a',
      tip: 'Un ventre généreux abritant un point en son centre. Exemple : جَمَل (Jamal - Chameau)'
    },
    'ha': {
      char: 'ح',
      name: 'Lettre Hâ (Hâ)',
      audio: 'assets/audio/6_haa.m4a',
      tip: 'Un H aspiré profond et chaleureux, venant du milieu de la gorge. Exemple : حُبّ (Hubb - Amour)'
    },
    'kha': {
      char: 'خ',
      name: 'Lettre Khâ (Khâ)',
      audio: 'assets/audio/7_khaa.m4a',
      tip: 'Son guttural raclé caractéristique, avec son point perché au sommet. Exemple : خَيْر (Khayr - Bienfait)'
    },
    'dal': {
      char: 'د',
      name: 'Lettre Dâl (Dâl)',
      audio: 'assets/audio/8_daal.m4a',
      tip: 'Une courbe nette et fière, lettre solaire sans point. Exemple : دَرْس (Dars - Leçon)'
    }
  };

  const letterBtns = document.querySelectorAll('.letter-btn');
  const activeCharEl = document.getElementById('activeLetterChar');
  const activeNameEl = document.getElementById('activeLetterName');
  const activeTipEl = document.getElementById('activeLetterTip');
  const detailsEl = document.getElementById('letterDetails');
  const playSoundBtn = document.getElementById('playLetterSoundBtn');
  const audioCache = new Map();
  let currentLetterKey = 'alif';
  let activeAudio = null;
  let playingEls = [];

  function setPlaying(els) {
    playingEls.forEach(el => el.classList.remove('is-playing'));
    playingEls = els;
    playingEls.forEach(el => el.classList.add('is-playing'));
  }

  function playLetterAudio(letterKey, sourceBtn) {
    const item = alphabetData[letterKey];
    if (!item) return;

    try {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
      let audio = audioCache.get(letterKey);
      if (!audio) {
        audio = new Audio(item.audio);
        audio.preload = 'auto';
        const stop = () => { if (activeAudio === audio) setPlaying([]); };
        audio.addEventListener('ended', stop);
        audio.addEventListener('pause', stop);
        audio.addEventListener('error', stop);
        audioCache.set(letterKey, audio);
      }
      activeAudio = audio;
      setPlaying([sourceBtn, playSoundBtn].filter(Boolean));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          setPlaying([]);
          console.warn('Lecture audio bloquée par le navigateur :', err);
        });
      }
    } catch (e) {
      setPlaying([]);
      console.warn('Erreur lecture audio :', e);
    }
  }

  letterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.letter;
      const data = alphabetData[key];
      if (!data) return;

      const changed = key !== currentLetterKey;
      currentLetterKey = key;
      letterBtns.forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });

      btn.classList.remove('is-bouncing');
      void btn.offsetWidth;
      btn.classList.add('is-bouncing');

      if (changed) {
        if (activeCharEl) activeCharEl.textContent = data.char;
        if (activeNameEl) activeNameEl.textContent = data.name;
        if (activeTipEl) activeTipEl.textContent = data.tip;
        if (detailsEl) {
          detailsEl.classList.remove('is-swapping');
          void detailsEl.offsetWidth;
          detailsEl.classList.add('is-swapping');
        }
      }

      playLetterAudio(key, btn);
    });

    btn.addEventListener('animationend', (e) => {
      if (e.animationName === 'letterBounce') btn.classList.remove('is-bouncing');
    });
  });

  playSoundBtn?.addEventListener('click', () => {
    const currentBtn = document.querySelector(`.letter-btn[data-letter="${currentLetterKey}"]`);
    playLetterAudio(currentLetterKey, currentBtn);
  });

  // 9. Modale de détail des formations (les 3 seules formations de SihSchool)
  const courseDetailsData = {
    'nourania': {
      title: 'Méthode Nourania Complète',
      arabic: 'القاعدة النورانية',
      audience: 'Femmes & Enfants dès 5 ans',
      duration: '1h30 par semaine (1 cours hebdomadaire en direct sur Zoom)',
      format: 'Petit groupe de 3 à 5 élèves maximum ou cours particulier',
      description: 'La méthode de référence par excellence pour acquérir une lecture arabe fluide et irréprochable. Conçue pour décomposer chaque lettre, sa vocalisation courte et longue, ses liaisons et ses règles fondamentales.',
      modules: [
        'Étape 1 : Reconnaissance auditive et visuelle des 28 lettres isolées',
        'Étape 2 : Les lettres composées et leurs différentes formes d\'écriture',
        'Étape 3 : Les mouvements courts (Fatha, Kasra, Damma) et Tanwin',
        'Étape 4 : Les lettres de prolongation (Madd) et les liaisons (Sukûn)',
        'Étape 5 : La Chadda (doublement) et automatismes de lecture courante'
      ],
      includes: 'Manuel officiel PDF offert, vidéos récapitulatives, replays 24h/24 et corrections vocales WhatsApp.'
    },
    'fusha': {
      title: 'Arabe Littéraire Moderne (Fus\'ha)',
      arabic: 'اللغة العربية الفصحى',
      audience: 'Femmes adultes & adolescentes',
      duration: '1h30 par semaine (1 cours hebdomadaire en direct sur Zoom)',
      format: 'Petit groupe de 3 à 5 élèves maximum ou cours particulier',
      description: 'Un cursus conçu pour acquérir une compréhension autonome des textes, des discussions du quotidien et des bases grammaticales sans lourdeur académique.',
      modules: [
        'Module 1 : Vocabulaire du quotidien, salutations, famille, maison, vie pratique',
        'Module 2 : Construction de phrases simples et pronoms personnels',
        'Module 3 : Grammaire vivante : le nom, le verbe au présent et au passé',
        'Module 4 : Ateliers d\'expression orale et compréhension de courts récits'
      ],
      includes: 'Fiches de vocabulaire thématiques, exercices interactifs corrigés, replays accessibles 24h/24.'
    },
    'eveil-enfants': {
      title: 'Éveil & Arabe Enfants',
      arabic: 'عَالَمُ الأَطْفَالِ',
      audience: 'Enfants dès 5 ans',
      duration: '1h30 par semaine rythmée par activités ludiques et pauses actives',
      format: 'Mini-groupes joyeux de 3 à 5 élèves maximum',
      description: 'L\'arabe appris comme un plaisir ! Une pédagogie positive basée sur des comptines, des jeux visuels, des petites histoires illustrées et des défis amusants.',
      modules: [
        'Module 1 : Découverte des lettres par des imagiers d\'animaux et d\'objets',
        'Module 2 : Chants et comptines traditionnelles rythmées',
        'Module 3 : Les chiffres, couleurs, fruits et membres de la famille',
        'Module 4 : Activités manuelles et coloriages de calligraphie à imprimer'
      ],
      includes: 'Carnet de gommettes virtuel, bilans réguliers partagés aux parents, replays et fiches ludiques.'
    }
  };

  const modalBackdrop = document.getElementById('detailsModal');
  const modalWindow = modalBackdrop?.querySelector('.modal-window');
  const modalBody = document.getElementById('modalDynamicContent');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  let modalOpener = null;
  let modalCloseTimer = null;

  function openCourseModal(courseKey, opener) {
    const data = courseDetailsData[courseKey];
    if (!data || !modalBody || !modalBackdrop) return;

    modalOpener = opener || null;
    modalBody.innerHTML = `
      <div class="modal-meta">
        <span class="audience-badge badge-women">${data.audience}</span>
        <span class="ar-text" lang="ar" dir="rtl">${data.arabic}</span>
      </div>
      <h2 class="modal-title" id="modalTitle">${data.title}</h2>
      <p class="modal-desc">${data.description}</p>

      <div class="modal-box">
        <div class="modal-box-title">📅 Organisation & Format :</div>
        <p>• <strong>Format :</strong> ${data.format}</p>
        <p>• <strong>Durée :</strong> ${data.duration}</p>
      </div>

      <h3 class="modal-subtitle">Au programme :</h3>
      <ul class="modal-list">
        ${data.modules.map(m => `<li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>${m}</span></li>`).join('')}
      </ul>

      <div class="modal-includes">
        🎁 <strong>Inclus :</strong> ${data.includes}
      </div>

      <div class="modal-actions">
        <a href="#contact" class="btn btn-coral modal-cta-action">
          <span>Réserver mon cours d'essai offert</span>
          <svg class="icon btn-arrow" aria-hidden="true"><use href="#i-arrow"/></svg>
        </a>
        <button type="button" class="btn btn-secondary modal-close-action">Fermer</button>
      </div>
    `;

    clearTimeout(modalCloseTimer);
    modalBackdrop.hidden = false;
    void modalBackdrop.offsetWidth;
    modalBackdrop.classList.add('is-open');
    lockScroll('modal');
    modalWindow?.focus();

    modalBody.querySelector('.modal-cta-action')?.addEventListener('click', () => {
      const courseSelect = document.getElementById('selectedCourse');
      if (courseSelect) {
        courseSelect.value = courseKey === 'eveil-enfants' ? 'enfants' : courseKey;
      }
      closeCourseModal({ restoreFocus: false });
    });

    modalBody.querySelector('.modal-close-action')?.addEventListener('click', () => closeCourseModal());
  }

  function closeCourseModal({ restoreFocus = true } = {}) {
    if (!modalBackdrop || modalBackdrop.hidden) return;
    modalBackdrop.classList.remove('is-open');
    unlockScroll('modal');
    modalCloseTimer = setTimeout(() => { modalBackdrop.hidden = true; }, prefersReducedMotion() ? 0 : 280);
    if (restoreFocus) modalOpener?.focus();
  }

  document.querySelectorAll('.open-course-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCourseModal(btn.dataset.course, btn);
    });
  });

  modalCloseBtn?.addEventListener('click', () => closeCourseModal());
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeCourseModal();
  });
  document.addEventListener('keydown', (e) => {
    if (!modalBackdrop || modalBackdrop.hidden) return;
    if (e.key === 'Escape') closeCourseModal();
    else trapFocus(e, modalWindow);
  });

  // 10. Cloudflare Turnstile : script chargé seulement quand le formulaire approche de l'écran
  const bookingForm = document.getElementById('sihschoolBookingForm');
  const bookingCard = document.getElementById('bookingCard');
  const turnstileContainer = document.getElementById('turnstileWidget');
  let turnstileWidgetId = null;
  let turnstileRequested = false;

  async function setupTurnstile() {
    if (turnstileRequested || !turnstileContainer) return;
    turnstileRequested = true;

    try {
      const res = await fetch('/api/turnstile-config');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const siteKey = data?.siteKey;
      if (!siteKey) return;

      window.sihschoolTurnstileReady = () => {
        if (!window.turnstile || typeof window.turnstile.render !== 'function') return;
        turnstileWidgetId = window.turnstile.render('#turnstileWidget', {
          sitekey: siteKey,
          theme: 'light',
          language: 'fr'
        });
      };

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=sihschoolTurnstileReady';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } catch (e) {
      console.warn('Configuration anti-spam non disponible :', e);
    }
  }

  if (bookingCard && 'IntersectionObserver' in window) {
    const turnstileObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some(entry => entry.isIntersecting)) {
        setupTurnstile();
        observer.disconnect();
      }
    }, { rootMargin: '600px 0px' });
    turnstileObserver.observe(bookingCard);
  } else {
    setupTurnstile();
  }
  bookingForm?.addEventListener('focusin', setupTurnstile, { once: true });

  function resetTurnstile() {
    if (window.turnstile && turnstileWidgetId !== null && typeof window.turnstile.reset === 'function') {
      window.turnstile.reset(turnstileWidgetId);
    }
  }

  // 11. Formulaire : validation par champ, annonces accessibles, états du bouton
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');
  const formStatus = document.getElementById('formStatus');
  let toastTimer = null;

  function announce(message) {
    if (!formStatus) return;
    formStatus.textContent = '';
    setTimeout(() => { formStatus.textContent = message; }, 50);
  }

  function showToast(message, isError = false) {
    announce(message);
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotice.classList.toggle('is-error', isError);
    toastNotice.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNotice.classList.remove('show'), 6000);
  }

  const validators = {
    clientFirstName: (v) => (v.length < 1 || v.length > 50) ? 'Merci de renseigner votre prénom (1 à 50 caractères).' : '',
    clientLastName: (v) => v.length > 50 ? 'Le nom ne doit pas dépasser 50 caractères.' : '',
    clientEmail: (v) => {
      if (!v) return 'Merci de renseigner votre adresse email.';
      return (v.length < 5 || v.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ? 'Merci de vérifier votre email (ex. prenom@exemple.fr).' : '';
    },
    clientPhone: (v) => {
      if (!v) return 'Merci de renseigner votre numéro de téléphone.';
      return !/^[\d\s+]{10,20}$/.test(v) ? 'Numéro invalide : 10 à 20 caractères (chiffres, espaces ou +).' : '';
    },
    clientMessage: (v) => v.length > 1000 ? 'Votre message ne doit pas dépasser 1000 caractères.' : ''
  };

  function setFieldError(id, message) {
    const field = document.getElementById(id);
    const errorEl = document.getElementById(`${id}-error`);
    if (!field) return;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = message;
  }

  function validateField(id) {
    const field = document.getElementById(id);
    if (!field) return '';
    const message = validators[id](field.value.trim());
    setFieldError(id, message);
    return message;
  }

  Object.keys(validators).forEach(id => {
    const field = document.getElementById(id);
    field?.addEventListener('blur', () => {
      if (field.value.trim() || field.hasAttribute('aria-invalid')) validateField(id);
    });
    field?.addEventListener('input', () => {
      if (field.hasAttribute('aria-invalid')) validateField(id);
    });
  });

  bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = bookingForm.querySelector('.btn-submit');
    if (submitBtn?.dataset.state === 'loading') return;

    const invalidIds = Object.keys(validators).filter(id => validateField(id));
    if (invalidIds.length) {
      document.getElementById(invalidIds[0])?.focus();
      announce(`Le formulaire contient ${invalidIds.length > 1 ? `${invalidIds.length} erreurs` : 'une erreur'}. Merci de vérifier les champs indiqués.`);
      return;
    }

    const value = (id) => document.getElementById(id)?.value.trim() || '';
    const firstName = value('clientFirstName');
    const payload = {
      firstName,
      lastName: value('clientLastName'),
      email: value('clientEmail'),
      phone: value('clientPhone'),
      targetStudent: document.querySelector('input[name="targetStudent"]:checked')?.value || 'femme',
      selectedCourse: document.getElementById('selectedCourse')?.value || 'nourania',
      currentLevel: document.getElementById('currentLevel')?.value || 'zero',
      clientMessage: value('clientMessage'),
      website: document.getElementById('formWebsite')?.value || '',
      turnstileToken: ''
    };

    // Token Cloudflare Turnstile si actif
    if (window.turnstile && turnstileWidgetId !== null && typeof window.turnstile.getResponse === 'function') {
      payload.turnstileToken = window.turnstile.getResponse(turnstileWidgetId) || '';
    } else {
      payload.turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
    }

    submitBtn.dataset.state = 'loading';
    submitBtn.setAttribute('aria-busy', 'true');
    announce('Envoi de votre demande en cours…');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        submitBtn.dataset.state = 'success';
        bookingForm.reset();
        resetTurnstile();
        showToast(`🌸 Merci ${firstName} ! Votre demande de cours d'essai a bien été envoyée. Siham vous recontactera sous 24h.`);
        setTimeout(() => { submitBtn.dataset.state = 'idle'; }, 2600);
      } else {
        submitBtn.dataset.state = 'idle';
        resetTurnstile();
        const errorMsg = result.message || "Une erreur est survenue lors de l'envoi de votre demande.";
        showToast(`⚠️ ${errorMsg}`, true);
      }
    } catch (err) {
      console.error('Erreur envoi formulaire :', err);
      submitBtn.dataset.state = 'idle';
      resetTurnstile();
      showToast('⚠️ Impossible de joindre le serveur. Veuillez vérifier votre connexion ou contacter Siham sur WhatsApp.', true);
    } finally {
      submitBtn.removeAttribute('aria-busy');
    }
  });

  // 12. Bouton WhatsApp flottant : rebond après 3 s, bulle unique, masqué près du formulaire et du bas de page
  const floatingWa = document.getElementById('floatingWhatsapp');
  const waBubble = document.getElementById('whatsappBubble');

  if (floatingWa) {
    const heroSection = document.getElementById('accueil');
    const revealWa = () => {
      if (heroSection && heroSection.getBoundingClientRect().bottom > 0) return;
      window.removeEventListener('scroll', revealWa);
      floatingWa.classList.add('is-visible');

      let bubbleSeen = false;
      try { bubbleSeen = sessionStorage.getItem('sihschool-wa-bubble') === '1'; } catch (e) { /* stockage indisponible */ }
      if (waBubble && !bubbleSeen) {
        setTimeout(() => {
          if (floatingWa.classList.contains('is-tucked')) return;
          waBubble.classList.add('is-shown');
          try { sessionStorage.setItem('sihschool-wa-bubble', '1'); } catch (e) { /* stockage indisponible */ }
          setTimeout(() => waBubble.classList.remove('is-shown'), 5000);
        }, 700);
      }
    };
    window.addEventListener('scroll', revealWa, { passive: true });
    revealWa();

    const tuckTargets = [bookingCard, document.getElementById('siteFooter')].filter(Boolean);
    if ('IntersectionObserver' in window && tuckTargets.length) {
      const visibleTargets = new Set();
      const tuckObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visibleTargets.add(entry.target);
          else visibleTargets.delete(entry.target);
        });
        floatingWa.classList.toggle('is-tucked', visibleTargets.size > 0);
        if (visibleTargets.size) waBubble?.classList.remove('is-shown');
      }, { rootMargin: '0px 0px 120px 0px' });
      tuckTargets.forEach(target => tuckObserver.observe(target));
    }
  }
});
