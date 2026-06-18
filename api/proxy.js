// Vercel Serverless Function — /api/proxy
// Meneruskan request ke API eksternal (betabotz) tanpa CORS masalah
// Usage: /api/proxy?url=https://api.betabotz.eu.org/...

export default async function handler(req, res) {
  // Izinkan CORS dari semua origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter url diperlukan' });
  }

  // Whitelist domain yang diizinkan
  const allowed = [
    'api.betabotz.eu.org',
    'api-nanzz.my.id',
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  if (!allowed.some(d => parsedUrl.hostname === d)) {
    return res.status(403).json({ error: 'Domain tidak diizinkan' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebProxy/1.0)',
      },
      signal: AbortSignal.timeout(25000),
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const text = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(text);
  } catch (err) {
    console.error('[proxy]', err.message);
    res.status(502).json({ error: 'Gagal mengambil data dari server eksternal', detail: err.message });
  }
}

