export default function handler(req, res) {
  const allowedOrigin = 'https://sihschool.com';
  const requestOrigin = req.headers.origin;

  if (requestOrigin && requestOrigin !== allowedOrigin) {
    const isLocal = process.env.NODE_ENV !== 'production' && (requestOrigin.startsWith('http://localhost') || requestOrigin.startsWith('http://127.0.0.1'));
    if (!isLocal) {
      return res.status(403).json({ success: false, message: 'Origine non autorisée.' });
    }
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  return res.status(200).json({
    siteKey: process.env.TURNSTILE_SITE_KEY || ''
  });
}
