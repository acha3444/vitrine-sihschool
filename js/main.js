/**
 * SihSchool - Scripting Principal
 * Navigation mobile, filtres formations, accordéons FAQ,
 * mini-atelier interactif alphabet (audio MP3 natif compatible mobile iPhone & Android),
 * modale détails des 3 formations, et validation du formulaire de réservation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Navigation
  const mobileToggle = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('mainNavMenu');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-cta .btn');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.classList.toggle('active', !isOpen);
      navMenu.classList.toggle('open', !isOpen);
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // 2. Header shadow on scroll
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      siteHeader?.classList.add('scrolled');
    } else {
      siteHeader?.classList.remove('scrolled');
    }
  }, { passive: true });

  // 3. Formations Filtering Tabs
  const filterBtns = document.querySelectorAll('.filter-btn');
  const courseCards = document.querySelectorAll('.course-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      courseCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter || category === 'both') {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });

      // Recalibrate swipe indicators if visible courses change
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('recalibrate-swipe'));
      }, 260);
    });
  });

  // 4. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close other open FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.faq-question');
          otherBtn?.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      item.classList.toggle('active', !isActive);
      questionBtn?.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
    });
  });

  // 5. Mini-Atelier de l'Alphabet (Audio MP3 natif - compatible iPhone iOS & Android)
  const alphabetData = {
    'alif': {
      char: 'أ',
      name: 'Lettre Alif (Alif)',
      audio: 'assets/audio/1_alif.mp3',
      tip: 'La 1ère lettre, verticale et élégante comme un calame droit. Exemple : أَمَل (Amal - Espoir)'
    },
    'ba': {
      char: 'ب',
      name: 'Lettre Bâ (Bâ)',
      audio: 'assets/audio/2_baa.mp3',
      tip: 'Comme un bateau portant un point précieux en dessous. Exemple : بَيْت (Bayt - Maison)'
    },
    'ta': {
      char: 'ت',
      name: 'Lettre Tâ (Tâ)',
      audio: 'assets/audio/3_taa.mp3',
      tip: 'Deux points comme deux yeux souriants au-dessus du plat. Exemple : تِين (Tîn - Figue)'
    },
    'tha': {
      char: 'ث',
      name: 'Lettre Thâ (Thâ)',
      audio: 'assets/audio/4_thaa.mp3',
      tip: 'Son interdental doux (comme "think" en anglais) avec 3 points en couronne. Exemple : ثَوْب (Thawb - Habit)'
    },
    'jim': {
      char: 'ج',
      name: 'Lettre Jîm (Jîm)',
      audio: 'assets/audio/5_jeem.mp3',
      tip: 'Un ventre généreux abritant un point en son centre. Exemple : جَمَل (Jamal - Chameau)'
    },
    'ha': {
      char: 'ح',
      name: 'Lettre Hâ (Hâ)',
      audio: 'assets/audio/6_haa.mp3',
      tip: 'Un H aspiré profond et chaleureux, venant du milieu de la gorge. Exemple : حُبّ (Hubb - Amour)'
    },
    'kha': {
      char: 'خ',
      name: 'Lettre Khâ (Khâ)',
      audio: 'assets/audio/7_khaa.mp3',
      tip: 'Son guttural raclé caractéristique, avec son point perché au sommet. Exemple : خَيْر (Khayr - Bienfait)'
    },
    'dal': {
      char: 'د',
      name: 'Lettre Dâl (Dâl)',
      audio: 'assets/audio/8_daal.mp3',
      tip: 'Une courbe nette et fière, lettre solaire sans point. Exemple : دَرْس (Dars - Leçon)'
    }
  };

  let currentLetterKey = 'alif';
  let activeAudioPlayer = null;

  function playLetterAudio(letterKey) {
    const item = alphabetData[letterKey];
    if (!item) return;

    try {
      if (activeAudioPlayer) {
        activeAudioPlayer.pause();
        activeAudioPlayer.currentTime = 0;
      }
      activeAudioPlayer = new Audio(item.audio);
      const playPromise = activeAudioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio autoplay blocked or user gesture required:', err);
        });
      }
    } catch (e) {
      console.warn('Erreur lecture audio:', e);
    }
  }

  const letterBtns = document.querySelectorAll('.letter-btn');
  const activeCharEl = document.getElementById('activeLetterChar');
  const activeNameEl = document.getElementById('activeLetterName');
  const activeTipEl = document.getElementById('activeLetterTip');
  const playSoundBtn = document.getElementById('playLetterSoundBtn');

  letterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-letter');
      if (!alphabetData[key]) return;

      currentLetterKey = key;
      letterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const data = alphabetData[key];
      if (activeCharEl) activeCharEl.textContent = data.char;
      if (activeNameEl) activeNameEl.textContent = data.name;
      if (activeTipEl) activeTipEl.textContent = data.tip;

      playLetterAudio(key);
    });
  });

  playSoundBtn?.addEventListener('click', () => {
    playLetterAudio(currentLetterKey);
  });

  // 6. Course Details Modal System (Les 3 seules formations de SihSchool)
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
  const modalBody = document.getElementById('modalDynamicContent');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const courseDetailsBtns = document.querySelectorAll('.open-course-details');

  function openCourseModal(courseKey) {
    const data = courseDetailsData[courseKey];
    if (!data || !modalBody || !modalBackdrop) return;

    modalBody.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 15px;">
        <span class="audience-badge badge-women" style="background: var(--c-lavender);">${data.audience}</span>
        <span class="ar-text" style="font-size: 1.4rem; color: var(--c-violet);">${data.arabic}</span>
      </div>
      <h2 style="font-size: 1.6rem; color: var(--c-night-blue); margin-bottom: 12px;">${data.title}</h2>
      <p style="font-size: 0.98rem; color: var(--c-text-muted); line-height: 1.6; margin-bottom: 20px;">${data.description}</p>
      
      <div style="background-color: var(--c-cream); border-radius: var(--radius-md); padding: 16px 20px; margin-bottom: 24px; border: 1px solid rgba(19, 35, 122, 0.08);">
        <div style="font-weight: 700; color: var(--c-night-blue); margin-bottom: 6px; font-size: 0.95rem;">📅 Organisation & Format :</div>
        <div style="font-size: 0.9rem; color: var(--c-blue); margin-bottom: 4px;">• <strong>Format :</strong> ${data.format}</div>
        <div style="font-size: 0.9rem; color: var(--c-blue);">• <strong>Durée :</strong> ${data.duration}</div>
      </div>

      <h4 style="font-size: 1.1rem; color: var(--c-night-blue); margin-bottom: 10px;">Au programme :</h4>
      <ul style="list-style: none; margin-bottom: 24px;">
        ${data.modules.map(m => `<li style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; font-size: 0.92rem; color: var(--c-night-blue);"><span style="color: var(--c-coral); font-weight: bold;">✔</span> ${m}</li>`).join('')}
      </ul>

      <div style="background-color: var(--c-violet-light); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 26px; font-size: 0.88rem; color: var(--c-night-blue);">
        🎁 <strong>Inclus :</strong> ${data.includes}
      </div>

      <div style="display: flex; gap: 14px; flex-wrap: wrap;">
        <a href="#contact" class="btn btn-coral modal-cta-action" style="flex: 1;">Réserver mon cours d'essai offert</a>
        <button class="btn btn-secondary modal-close-action">Fermer</button>
      </div>
    `;

    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Link modal CTA to auto-fill course
    const modalCta = modalBody.querySelector('.modal-cta-action');
    modalCta?.addEventListener('click', () => {
      closeCourseModal();
      const courseSelect = document.getElementById('selectedCourse');
      if (courseSelect) {
        if (courseKey === 'nourania') courseSelect.value = 'nourania';
        else if (courseKey === 'fusha') courseSelect.value = 'fusha';
        else if (courseKey === 'eveil-enfants') courseSelect.value = 'enfants';
      }
    });

    const modalInnerClose = modalBody.querySelector('.modal-close-action');
    modalInnerClose?.addEventListener('click', closeCourseModal);
  }

  function closeCourseModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  courseDetailsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.getAttribute('data-course');
      openCourseModal(key);
    });
  });

  modalCloseBtn?.addEventListener('click', closeCourseModal);
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeCourseModal();
  });

  // 7. Booking Form Submission, Anti-Spam & Feedback
  const bookingForm = document.getElementById('sihschoolBookingForm');
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');

  let turnstileWidgetId = null;

  async function setupTurnstile() {
    const container = document.getElementById('turnstileWidget');
    if (!container) return;

    try {
      const res = await fetch('/api/turnstile-config');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const siteKey = data?.siteKey;

      if (!siteKey) return;

      const renderWhenReady = () => {
        if (window.turnstile && typeof window.turnstile.render === 'function') {
          turnstileWidgetId = window.turnstile.render('#turnstileWidget', {
            sitekey: siteKey,
            theme: 'light'
          });
        } else {
          setTimeout(renderWhenReady, 120);
        }
      };

      renderWhenReady();
    } catch (e) {
      console.warn('Configuration anti-spam non disponible:', e);
    }
  }

  setupTurnstile();

  function showToast(message, isError = false) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    if (isError) {
      toastNotice.style.background = '#8A1F1D';
      toastNotice.style.borderColor = '#E8685A';
    } else {
      toastNotice.style.background = 'var(--c-night-blue)';
      toastNotice.style.borderColor = 'var(--c-yellow)';
    }
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 5500);
  }

  bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('clientFirstName')?.value.trim();
    const lastName = document.getElementById('clientLastName')?.value.trim() || '';
    const email = document.getElementById('clientEmail')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const targetStudent = document.querySelector('input[name="targetStudent"]:checked')?.value || 'femme';
    const selectedCourse = document.getElementById('selectedCourse')?.value || 'nourania';
    const currentLevel = document.getElementById('currentLevel')?.value || 'zero';
    const clientMessage = document.getElementById('clientMessage')?.value.trim() || '';
    const website = document.getElementById('formWebsite')?.value || '';

    // Frontend validation
    if (!firstName || firstName.length < 1 || firstName.length > 50) {
      showToast('⚠️ Merci de renseigner votre prénom (1 à 50 caractères).', true);
      return;
    }

    if (!email || !phone) {
      showToast('⚠️ Merci de remplir votre adresse email et votre numéro de téléphone.', true);
      return;
    }

    // Token Cloudflare Turnstile si actif
    let turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null && typeof window.turnstile.getResponse === 'function') {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId) || '';
    } else {
      turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
    }

    // Submit button loading animation
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Envoi en cours...</span>';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          targetStudent,
          selectedCourse,
          currentLevel,
          clientMessage,
          website,
          turnstileToken
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        bookingForm.reset();
        if (window.turnstile && turnstileWidgetId !== null && typeof window.turnstile.reset === 'function') {
          window.turnstile.reset(turnstileWidgetId);
        }
        showToast(`🌸 Merci ${firstName} ! Votre demande de cours d'essai a bien été envoyée. Siham vous recontactera sous 24h.`);
      } else {
        if (window.turnstile && turnstileWidgetId !== null && typeof window.turnstile.reset === 'function') {
          window.turnstile.reset(turnstileWidgetId);
        }
        const errorMsg = result.message || "Une erreur est survenue lors de l'envoi de votre demande.";
        showToast(`⚠️ ${errorMsg}`, true);
      }
    } catch (err) {
      console.error('Erreur envoi formulaire:', err);
      if (window.turnstile && turnstileWidgetId !== null && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset(turnstileWidgetId);
      }
      showToast('⚠️ Impossible de joindre le serveur. Veuillez vérifier votre connexion ou contacter Siham sur WhatsApp.', true);
    } finally {
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;
    }
  });

  // 8. Scroll Reveal Animations (IntersectionObserver)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('revealed'));
  }

  // 9. Mobile Swipe Tracks & Indicator Dots Synchronization
  function initMobileSwipeIndicators() {
    const indicators = document.querySelectorAll('.mobile-swipe-indicator');

    indicators.forEach(indicator => {
      const trackId = indicator.getAttribute('data-for');
      const track = document.getElementById(trackId);
      if (!track) return;

      const dots = indicator.querySelectorAll('.swipe-dot');
      
      const getVisibleCards = () => {
        return Array.from(track.children).filter(el => {
          if (!el.classList || el.classList.contains('mobile-swipe-indicator')) return false;
          return window.getComputedStyle(el).display !== 'none';
        });
      };

      let isTicking = false;
      const updateActiveDot = () => {
        isTicking = false;
        const cards = getVisibleCards();
        if (!cards.length) return;

        const trackRect = track.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;

        let closestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, idx) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const dist = Math.abs(trackCenter - cardCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = idx;
          }
        });

        dots.forEach((dot, dotIdx) => {
          dot.classList.toggle('active', dotIdx === closestIndex);
        });
      };

      track.addEventListener('scroll', () => {
        if (!isTicking) {
          window.requestAnimationFrame(updateActiveDot);
          isTicking = true;
        }
      }, { passive: true });

      // Click on dot jumps smoothly to that item
      dots.forEach((dot, dotIdx) => {
        dot.addEventListener('click', () => {
          const cards = getVisibleCards();
          if (cards[dotIdx]) {
            cards[dotIdx].scrollIntoView({
              behavior: 'smooth',
              inline: 'center',
              block: 'nearest'
            });
          }
        });
      });

      window.addEventListener('resize', updateActiveDot, { passive: true });
      window.addEventListener('recalibrate-swipe', updateActiveDot, { passive: true });
      updateActiveDot();
    });
  }

  initMobileSwipeIndicators();
});
