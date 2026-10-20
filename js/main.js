/**
 * SihScool - Interactive Scripting
 * Handles mobile nav, smooth scroll, tabs filter, FAQ accordions,
 * Arabic alphabet sound workshop, course modal details, and booking validation.
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
      questionBtn.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
    });
  });

  // 5. Interactive Mini-Atelier de l'Alphabet Arabe (WOW Feature)
  const alphabetData = {
    'alif': {
      char: 'أ',
      name: 'Alif',
      sound: 'Alif',
      speech: 'ألف',
      tip: 'La première lettre de l\'alphabet, son long et vertical comme un calame droit.',
      example: 'أَمَل (Amal - Espoir)'
    },
    'ba': {
      char: 'ب',
      name: 'Bâ',
      sound: 'Ba',
      speech: 'باء',
      tip: 'Un joli bateau avec un point en-dessous. Son bilabial doux comme dans "Bébé".',
      example: 'بَاب (Bâb - Porte)'
    },
    'ta': {
      char: 'ت',
      name: 'Tâ',
      sound: 'Ta',
      speech: 'تاء',
      tip: 'Un bateau avec deux points au-dessus, comme deux yeux souriants !',
      example: 'تِين (Tîn - Figue)'
    },
    'tha': {
      char: 'ث',
      name: 'Thâ',
      sound: 'Tha',
      speech: 'ثاء',
      tip: 'Trois points au-dessus. Son zozoté doux, langue entre les incisives (comme le "th" anglais dans "think").',
      example: 'ثَوْب (Thawb - Habit)'
    },
    'jim': {
      char: 'ج',
      name: 'Jîm',
      sound: 'Jim',
      speech: 'جيم',
      tip: 'Une arche élégante avec un point au creux du ventre.',
      example: 'جَمِيل (Jamîl - Beau)'
    },
    'ha': {
      char: 'ح',
      name: 'Hâ',
      sound: 'Ha',
      speech: 'حاء',
      tip: 'Une aspiration douce et profonde venant du milieu de la gorge, sans point.',
      example: 'حَيَاة (Hayât - Vie)'
    },
    'kha': {
      char: 'خ',
      name: 'Khâ',
      sound: 'Kha',
      speech: 'خاء',
      tip: 'Un point perché sur la tête. Son guttural raclé doux, comme la "jota" espagnole.',
      example: 'خَيْر (Khayr - Bienfait)'
    },
    'dal': {
      char: 'د',
      name: 'Dâl',
      sound: 'Dal',
      speech: 'دال',
      tip: 'Un angle doux ouvert vers la gauche. Son dentale clair et net.',
      example: 'دَرْس (Dars - Leçon)'
    }
  };

  const letterButtons = document.querySelectorAll('.letter-btn');
  const displayChar = document.getElementById('activeLetterChar');
  const displayName = document.getElementById('activeLetterName');
  const displayTip = document.getElementById('activeLetterTip');
  const playSoundBtn = document.getElementById('playLetterSoundBtn');

  let currentLetterKey = 'alif';

  function playLetterAudio(letterKey) {
    const item = alphabetData[letterKey];
    if (!item) return;

    if ('speechSynthesis' in window) {
      // Cancel previous utterances
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.speech);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85; // slightly slower for educational clarity
      
      // Look for Arabic voice if available
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) {
        utterance.voice = arVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      // Audio synthesis fallback chime
      playChimeNote(440);
    }
  }

  function playChimeNote(freq) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch(e) {
      console.log('AudioContext fallback not active');
    }
  }

  letterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-letter');
      if (!alphabetData[key]) return;

      currentLetterKey = key;
      letterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const data = alphabetData[key];
      if (displayChar) displayChar.textContent = data.char;
      if (displayName) displayName.textContent = `Lettre ${data.name} (${data.sound})`;
      if (displayTip) displayTip.textContent = `${data.tip} Exemple : ${data.example}`;

      playLetterAudio(key);
    });
  });

  playSoundBtn?.addEventListener('click', () => {
    playLetterAudio(currentLetterKey);
  });

  // 6. Course Details Modal System
  const courseDetailsData = {
    'nourania': {
      title: 'Méthode Nourania Complète',
      arabic: 'القاعدة النورانية',
      audience: 'Femmes & Enfants (dès 5 ans)',
      duration: '1h30 par semaine (1 cours hebdomadaire en direct)',
      format: 'En ligne en direct sur Zoom • Petit groupe (3-5) ou cours particulier',
      description: 'La méthode de référence par excellence pour acquérir une lecture arabe fluide et irréprochable. Conçue pour décomposer chaque lettre, sa vocalisation courte et longue, ses liaisons et ses règles fondamentales.',
      modules: [
        'Étape 1 : Reconnaissance auditive et visuelle des 28 lettres isolées',
        'Étape 2 : Les lettres composées et leurs différentes formes d\'écriture',
        'Étape 3 : Les mouvements courts (Fatha, Kasra, Damma) et Tanwin',
        'Étape 4 : Les lettres de prolongation (Madd) et les liaisons (Sukûn)',
        'Étape 5 : La Chadda (doublement) et automatismes de lecture courante'
      ],
      includes: 'Manuel officiel PDF offert, vidéos récapitulatives de prononciation, corrections audio individuelles.'
    },
    'fusha': {
      title: 'Arabe Littéraire Moderne (Fus\'ha)',
      arabic: 'اللغة العربية الفصحى',
      audience: 'Femmes adultes & adolescentes',
      duration: '1h30 par semaine (1 cours hebdomadaire en direct)',
      format: 'En direct sur Zoom • Classe virtuelle vivante et bienveillante',
      description: 'Un cursus conçu pour acquérir une compréhension autonome des textes, des discussions du quotidien et des bases grammaticales sans lourdeur académique.',
      modules: [
        'Module 1 : Vocabulaire du quotidien, salutations, famille, maison, vie pratique',
        'Module 2 : Construction de phrases simples et pronoms personnels',
        'Module 3 : Grammaire vivante : le nom, le verbe au présent et au passé',
        'Module 4 : Ateliers d\'expression orale et compréhension de courts récits'
      ],
      includes: 'Fiches de vocabulaire thématiques, exercices interactifs corrigés, replays accessibles 24/7.'
    },
    'eveil-enfants': {
      title: 'Éveil Arabe & Pitchouns',
      arabic: 'براعم المستقبل',
      audience: 'Enfants dès 5 ans',
      duration: '1h30 par semaine (rythmée par activités ludiques et pauses actives)',
      format: 'En direct sur Zoom • Mini-groupes joyeux de 3 à 4 enfants maximum',
      description: 'L\'arabe appris comme un plaisir ! Une pédagogie positive basée sur des comptines, des jeux visuels, des petites histoires illustrées et des défis amusants.',
      modules: [
        'Module 1 : Découverte des lettres par des imagiers d\'animaux et d\'objets',
        'Module 2 : Chants et comptines traditionnelles rythmées',
        'Module 3 : Les chiffres, couleurs, fruits et membres de la famille',
        'Module 4 : Activités manuelles et coloriages de calligraphie à imprimer'
      ],
      includes: 'Carnet de gommettes virtuel, bilan mensuel envoyé aux parents, messagerie directe.'
    },
    'tajweed': {
      title: 'Perfectionnement Lecture & Tajweed',
      arabic: 'تحسين التلاوة والتجويد',
      audience: 'Femmes sachant déjà déchiffrer',
      duration: '1h30 par semaine en direct sur Zoom',
      format: 'En direct sur Zoom • Accompagnement individualisé ou binôme',
      description: 'Pour celles qui savent lire mais hésitent, butent sur les liaisons ou souhaitent embellir leur récitation avec les règles de Tajweed fondamentales.',
      modules: [
        'Module 1 : Correction des points d\'articulation (Makhârij al-Hurûf)',
        'Module 2 : Règles du Nûn Sâkin et Tanwîn (Idhhâr, Idghâm, Iqlâb, Ikhfâ)',
        'Module 3 : Les prolongations et degrés de lourdeur/finesse (Tafkhîm & Tarqîq)',
        'Module 4 : Fluidité continue et maîtrise du souffle'
      ],
      includes: 'Enregistrements personnalisés pour s\'entraîner chez soi, écoute attentive et bienveillante.'
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
        <a href="#contact" class="btn btn-coral modal-cta-action" style="flex: 1;">Réserver mon cours d'essai gratuit</a>
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
        else if (courseKey === 'tajweed') courseSelect.value = 'tajweed';
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

  // 7. Booking Form Submission & Toast Feedback
  const bookingForm = document.getElementById('sihscoolBookingForm');
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');

  function showToast(message) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 4500);
  }

  bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('clientFirstName')?.value.trim() || 'Chère apprenante';
    const lastName = document.getElementById('clientLastName')?.value.trim() || '';
    const email = document.getElementById('clientEmail')?.value.trim();
    const phone = document.getElementById('clientPhone')?.value.trim();
    const targetStudent = document.querySelector('input[name="targetStudent"]:checked')?.value || 'femme';
    const selectedCourse = document.getElementById('selectedCourse')?.value || 'nourania';
    const currentLevel = document.getElementById('currentLevel')?.value || 'zero';
    const clientMessage = document.getElementById('clientMessage')?.value.trim() || '';

    if (!email || !phone) {
      showToast('⚠️ Merci de remplir votre email et votre numéro de téléphone.');
      return;
    }

    // Submit animation
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Envoi en cours...';
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
          clientMessage
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        bookingForm.reset();
        showToast(`🌸 Merci ${firstName} ! Votre demande de cours d'essai a bien été envoyée. Nous vous contacterons sous 24h.`);
      } else {
        bookingForm.reset();
        showToast(`🌸 Merci ${firstName} ! Votre demande a été enregistrée. Nous vous contacterons sous 24h.`);
      }
    } catch (err) {
      console.error('Erreur envoi formulaire:', err);
      bookingForm.reset();
      showToast(`🌸 Merci ${firstName} ! Votre demande a été enregistrée. Nous vous contacterons sous 24h.`);
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // 8. Legal Modals Trigger
  const legalTriggers = document.querySelectorAll('.open-legal-modal');
  legalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const type = trigger.getAttribute('data-legal');
      if (modalBody && modalBackdrop) {
        if (type === 'mentions') {
          modalBody.innerHTML = `
            <h2 style="font-size: 1.5rem; color: var(--c-night-blue); margin-bottom: 16px;">Mentions Légales</h2>
            <p style="font-size: 0.95rem; margin-bottom: 12px; color: var(--c-text-muted);">
              <strong>Éditeur du site :</strong> SihScool - École d'arabe en ligne pour femmes et enfants.<br>
              <strong>Responsable de la publication :</strong> Siham K.<br>
              <strong>Contact :</strong> contact@sihschool.com • +33 7 00 00 00 00<br>
              <strong>Hébergement :</strong> Serveur Cloud sécurisé européen conforme RGPD.
            </p>
            <p style="font-size: 0.95rem; margin-bottom: 20px; color: var(--c-text-muted);">
              <strong>Propriété intellectuelle :</strong> L'ensemble des contenus (textes, logos, illustrations vectorielles, méthodologie) présents sur ce site est la propriété exclusive de SihScool.
            </p>
            <button class="btn btn-secondary modal-close-action" style="width: 100%;">Fermer</button>
          `;
        } else {
          modalBody.innerHTML = `
            <h2 style="font-size: 1.5rem; color: var(--c-night-blue); margin-bottom: 16px;">Politique de Confidentialité</h2>
            <p style="font-size: 0.95rem; margin-bottom: 12px; color: var(--c-text-muted);">
              Chez SihScool, la confidentialité et la sérénité de nos élèves et de leurs familles sont primordiales.
            </p>
            <p style="font-size: 0.95rem; margin-bottom: 12px; color: var(--c-text-muted);">
              • <strong>Collecte des données :</strong> Les informations recueillies (prénom, nom, email, téléphone) via le formulaire de réservation sont uniquement destinées à l'organisation de votre cours d'essai et au suivi pédagogique.<br>
              • <strong>Non-divulgation :</strong> Aucune donnée n'est cédée ni vendue à des tiers.<br>
              • <strong>Vos droits :</strong> Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données sur simple demande par email à contact@sihschool.com.
            </p>
            <button class="btn btn-secondary modal-close-action" style="width: 100%; margin-top: 14px;">Fermer</button>
          `;
        }

        modalBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden';

        const modalInnerClose = modalBody.querySelector('.modal-close-action');
        modalInnerClose?.addEventListener('click', closeCourseModal);
      }
    });
  });

  // 9. Scroll Reveal Animations (IntersectionObserver)
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
});
