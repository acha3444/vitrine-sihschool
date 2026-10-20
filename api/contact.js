export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY manquante dans les variables d\'environnement');
    return res.status(500).json({ success: false, message: 'Configuration email incomplète' });
  }

  try {
    const {
      firstName = '',
      lastName = '',
      email = '',
      phone = '',
      targetStudent = 'femme',
      selectedCourse = 'nourania',
      currentLevel = 'zero',
      clientMessage = ''
    } = req.body || {};

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: 'Email et téléphone obligatoires' });
    }

    // Mapping values to French human-readable text
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

    const studentTypeLabel = targetMap[targetStudent] || targetStudent;
    const courseLabel = courseMap[selectedCourse] || selectedCourse;
    const levelLabel = levelMap[currentLevel] || currentLevel;
    const fullName = `${firstName} ${lastName}`.trim() || 'Nouvelle élève';

    // Email HTML Template for Admin / Teacher
    const adminEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF4E4; border-radius: 16px; overflow: hidden; border: 1px solid rgba(19, 35, 122, 0.1);">
        <div style="background-color: #13237A; padding: 24px 30px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700;">🌸 Sih<span style="color: #FDE678;">Scool</span></h1>
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
                <a href="tel:${phone}" style="color: #13237A; text-decoration: none;">${phone}</a>
                <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="margin-left: 10px; color: #25D366; font-size: 12px; text-decoration: none; font-weight: 700;">(WhatsApp)</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">📧 Email :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">
                <a href="mailto:${email}" style="color: #2E5AAC; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">👥 Public concerné :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">${studentTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">📚 Formation :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #E8685A; font-size: 14px; font-weight: 700;">${courseLabel}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #64748B; font-size: 14px;">📈 Niveau estimé :</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #F1EFEA; color: #13237A; font-size: 14px; font-weight: 600;">${levelLabel}</td>
            </tr>
          </table>

          ${clientMessage ? `
            <div style="background-color: #FAF4E4; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 12px; font-weight: 700; color: #13237A; margin-bottom: 6px;">💬 Message & Disponibilités indiquées :</div>
              <div style="font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${clientMessage}</div>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${email}?subject=Votre%20demande%20de%20cours%20d'essai%20SihScool" style="background-color: #E8685A; color: #FFFFFF; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
              Répondre par Email
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 15px; color: #64748B; font-size: 12px;">
          SihScool • École d'arabe en ligne sur Zoom • <a href="https://sihschool.com" style="color: #2E5AAC;">sihschool.com</a>
        </div>
      </div>
    `;

    // Try sending from contact@sihschool.com, fallback to onboarding@resend.dev during domain verification
    const sender = 'SihScool <contact@sihschool.com>';
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
        reply_to: email,
        subject: `🌸 Nouvelle demande d'essai : ${fullName} (${courseLabel})`,
        html: adminEmailHtml
      })
    });

    let resendData = await resendResponse.json();

    // If domain not yet fully verified on Resend, fallback to onboarding sender to personal account
    if (!resendResponse.ok && resendData?.message?.includes('verify a domain')) {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SihScool <onboarding@resend.dev>',
          to: ['achraf.boulali@icloud.com'],
          reply_to: email,
          subject: `🌸 Nouvelle demande d'essai : ${fullName} (${courseLabel})`,
          html: adminEmailHtml
        })
      });
      resendData = await resendResponse.json();
    }

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', resendData);
      return res.status(500).json({ success: false, error: resendData });
    }

    return res.status(200).json({ success: true, id: resendData.id });

  } catch (error) {
    console.error('Erreur API Contact:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
