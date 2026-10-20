// In-memory rate limiting fallback (10-minute sliding window)
const inMemoryRateLimits = new Map();

function checkInMemoryRateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 3;

  // Cleanup old entries occasionally
  if (inMemoryRateLimits.size > 2000) {
    for (const [key, record] of inMemoryRateLimits.entries()) {
      if (now > record.resetTime) {
        inMemoryRateLimits.delete(key);
      }
    }
  }

  let record = inMemoryRateLimits.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    inMemoryRateLimits.set(ip, record);
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// Check rate limit via Vercel KV / Upstash Redis REST if configured
async function checkKvRateLimit(ip) {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!kvUrl || !kvToken) {
    return null; // Not configured, fallback to in-memory
  }

  try {
    const key = `ratelimit:contact:${ip.replace(/[^a-zA-Z0-9:_-]/g, '')}`;
    const incrRes = await fetch(`${kvUrl}/incr/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    const incrData = await incrRes.json();
    const count = Number(incrData.result);

    if (count === 1) {
      // Set TTL to 10 minutes (600 seconds)
      await fetch(`${kvUrl}/expire/${key}/600`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}` }
      });
    }

    return count <= 3;
  } catch (err) {
    console.warn('Erreur vérification Vercel KV, repli mémoire:', err.message);
    return null;
  }
}

// HTML sanitizer for email output
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  const allowedOrigins = ['https://sihschool.com', 'https://www.sihschool.com'];
  const requestOrigin = req.headers.origin;

  // 1. CORS Enforcement
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(requestOrigin) ? requestOrigin : 'https://sihschool.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    const isLocal = process.env.NODE_ENV !== 'production' &&
      (requestOrigin.startsWith('http://localhost') || requestOrigin.startsWith('http://127.0.0.1'));
    if (!isLocal) {
      return res.status(403).json({ success: false, message: 'Origine non autorisée.' });
    }
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || 'https://sihschool.com');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
  }

  // 3. Content-Type Check
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return res.status(400).json({ success: false, message: 'Format de requête invalide (JSON attendu).' });
  }

  // 4. Honeypot Anti-Spam Check
  const honeypot = req.body?.website;
  if (honeypot && String(honeypot).trim().length > 0) {
    // Silent drop: simulate HTTP 200 without sending email
    return res.status(200).json({ success: true, message: 'Demande enregistrée avec succès.' });
  }

  // 5. Client IP & Rate Limiting (max 3 / 10 min)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1'));

  const kvAllowed = await checkKvRateLimit(clientIp);
  const isAllowed = kvAllowed !== null ? kvAllowed : checkInMemoryRateLimit(clientIp);

  if (!isAllowed) {
    return res.status(429).json({
      success: false,
      message: 'Trop de demandes, réessayez dans quelques minutes.'
    });
  }

  // 6. Turnstile Verification (if configured in environment)
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const turnstileToken = req.body?.turnstileToken;
    if (!turnstileToken) {
      return res.status(400).json({
        success: false,
        message: 'Vérification de sécurité requise. Veuillez actualiser la page.'
      });
    }

    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: clientIp
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        console.warn('Vérification Turnstile échouée pour IP:', clientIp, verifyData['error-codes']);
        return res.status(400).json({
          success: false,
          message: 'Échec de la vérification de sécurité. Merci de réessayer.'
        });
      }
    } catch (err) {
      console.error('Erreur appel Cloudflare Turnstile:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Une erreur est survenue, contactez-nous sur WhatsApp.'
      });
    }
  }

  // 7. Strict Server-Side Payload Validation
  const {
    firstName = '',
    lastName = '',
    email = '',
    phone = '',
    targetStudent = '',
    selectedCourse = '',
    currentLevel = '',
    clientMessage = ''
  } = req.body || {};

  // Prénom (1-50 caractères)
  const trimmedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
  if (trimmedFirstName.length < 1 || trimmedFirstName.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Merci de renseigner votre prénom (entre 1 et 50 caractères).'
    });
  }

  // Nom (0-50 caractères)
  const trimmedLastName = typeof lastName === 'string' ? lastName.trim() : '';
  if (trimmedLastName.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Le nom ne doit pas dépasser 50 caractères.'
    });
  }

  // Email (format valide, max 120 caractères)
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (trimmedEmail.length < 5 || trimmedEmail.length > 120 || !emailRegex.test(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Merci de vérifier votre email.'
    });
  }

  // Téléphone (chiffres, espaces, +, entre 10 et 20 caractères)
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  const phoneRegex = /^[\d\s+]{10,20}$/;
  if (!phoneRegex.test(trimmedPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Merci de renseigner un numéro de téléphone valide (entre 10 et 20 caractères).'
    });
  }

  // Public autorisé
  const allowedStudents = ['femme', 'enfant', 'les-deux'];
  if (!allowedStudents.includes(targetStudent)) {
    return res.status(400).json({
      success: false,
      message: 'Merci de préciser pour qui vous réservez ce cours.'
    });
  }

  // Formation autorisée
  const allowedCourses = ['nourania', 'fusha', 'enfants', 'tajweed', 'conseil'];
  if (!allowedCourses.includes(selectedCourse)) {
    return res.status(400).json({
      success: false,
      message: 'Merci de sélectionner une formation valide parmi nos cursus.'
    });
  }

  // Niveau autorisé
  const allowedLevels = ['zero', 'notions', 'lit-lentement', 'lit-bien'];
  if (!allowedLevels.includes(currentLevel)) {
    return res.status(400).json({
      success: false,
      message: 'Merci de sélectionner un niveau estimé valide.'
    });
  }

  // Message (max 1000 caractères)
  const trimmedMessage = typeof clientMessage === 'string' ? clientMessage.trim() : '';
  if (trimmedMessage.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Votre message ne doit pas dépasser 1000 caractères.'
    });
  }

  // 8. Configuration Resend
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY absente des variables d\'environnement');
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue, contactez-nous sur WhatsApp.'
    });
  }

  try {
    // Human-readable labels
    const targetMap = {
      'femme': 'Pour moi (Femme)',
      'enfant': 'Pour mon enfant',
      'les-deux': 'Pour nous deux (Maman & Enfant)'
    };

    const courseMap = {
      'nourania': 'Méthode Nourania (Apprendre à lire)',
      'fusha': 'Arabe Littéraire (Vocabulaire & Grammaire)',
      'enfants': 'Éveil & Arabe Enfants',
      'tajweed': 'Perfectionnement & Récitation (Tajweed)',
      'conseil': 'Orientation demandée (Conseillez-moi)'
    };

    const levelMap = {
      'zero': 'Débutant complet (Ne connaît pas les lettres)',
      'notions': 'Reconnaît quelques lettres',
      'lit-lentement': 'Sait déchiffrer avec hésitation',
      'lit-bien': 'Lit fluidement, veut apprendre la langue'
    };

    // Sanitize all inputs before inserting into HTML
    const safeFirstName = escapeHtml(trimmedFirstName);
    const safeLastName = escapeHtml(trimmedLastName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safePhone = escapeHtml(trimmedPhone);
    const cleanPhoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
    const safeStudentType = escapeHtml(targetMap[targetStudent] || targetStudent);
    const safeCourse = escapeHtml(courseMap[selectedCourse] || selectedCourse);
    const safeLevel = escapeHtml(levelMap[currentLevel] || currentLevel);
    const safeMessage = escapeHtml(trimmedMessage);
    const fullName = `${safeFirstName} ${safeLastName}`.trim() || 'Nouvelle apprenante';

    const adminEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF4E4; border-radius: 16px; overflow: hidden; border: 1px solid rgba(19, 35, 122, 0.1);">
        <div style="background-color: #13237A; padding: 24px 30px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700;">🌸 Sih<span style="color: #D4A63A;">School</span></h1>
          <p style="color: #DCD2F8; margin: 6px 0 0; font-size: 14px;">Nouvelle demande de cours d'essai reçu sur le site</p>
        </div>

        <div style="padding: 30px; background-color: #FFFFFF; margin: 15px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="background-color: #FAF4E4; border-left: 4px solid #E8685A; padding: 12px 16px; width: 100%;">
              <div style="font-size: 12px; text-transform: uppercase; color: #E8685A; font-weight: 700; letter-spacing: 0.5px;">Contact de la candidate</div>
              <div style="font-size: 18px; font-weight: 700; color: #13237A; margin-top: 4px;">${fullName}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px; width: 40%;">📱 Téléphone :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">
                <a href="tel:${safePhone}" style="color: #13237A; text-decoration: none;">${safePhone}</a>
                ${cleanPhoneDigits ? `<a href="https://wa.me/${cleanPhoneDigits}" style="margin-left: 10px; color: #25D366; font-size: 12px; text-decoration: none; font-weight: 700;">(WhatsApp)</a>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">📧 Email :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">
                <a href="mailto:${safeEmail}" style="color: #2E5AAC; text-decoration: none;">${safeEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">👥 Public concerné :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">${safeStudentType}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">📚 Formation :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #E8685A; font-size: 14px; font-weight: 700;">${safeCourse}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">📈 Niveau estimé :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">${safeLevel}</td>
            </tr>
          </table>

          ${safeMessage ? `
            <div style="background-color: #FAF4E4; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 12px; font-weight: 700; color: #13237A; margin-bottom: 6px;">💬 Message & Disponibilités indiquées :</div>
              <div style="font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${safeMessage}</div>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${safeEmail}?subject=Votre%20demande%20de%20cours%20d'essai%20SihSchool" style="background-color: #E8685A; color: #FFFFFF; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
              Répondre par Email
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 15px; color: #64748B; font-size: 12px;">
          SihSchool • École d'arabe en ligne sur Zoom • <a href="https://sihschool.com" style="color: #2E5AAC;">sihschool.com</a>
        </div>
      </div>
    `;

    const sender = 'SihSchool <contact@sihschool.com>';
    const recipients = ['contact@sihschool.com', 'achraf.boulali@icloud.com'];

    let resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: sender,
        to: recipients,
        reply_to: trimmedEmail,
        subject: `🌸 Nouvelle demande d'essai : ${fullName} (${safeCourse})`,
        html: adminEmailHtml
      })
    });

    let resendData = await resendResponse.json().catch(() => ({}));

    // Fallback to onboarding sender if domain verification pending
    if (!resendResponse.ok && resendData?.message?.includes('verify a domain')) {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SihSchool <onboarding@resend.dev>',
          to: ['achraf.boulali@icloud.com'],
          reply_to: trimmedEmail,
          subject: `🌸 Nouvelle demande d'essai : ${fullName} (${safeCourse})`,
          html: adminEmailHtml
        })
      });
      resendData = await resendResponse.json().catch(() => ({}));
    }

    if (!resendResponse.ok) {
      console.error('Erreur interne Resend:', resendData);
      return res.status(500).json({
        success: false,
        message: 'Une erreur est survenue, contactez-nous sur WhatsApp.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Demande envoyée avec succès.'
    });

  } catch (error) {
    console.error('Erreur interne API Contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue, contactez-nous sur WhatsApp.'
    });
  }
}
