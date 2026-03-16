// galya-stream-proxy — Railway
// Sadece IPTV segment proxy — datacenter IP engelini aşmak için

const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// CORS — galyastream.com'dan gelen isteklere izin ver
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = [
    'https://www.galyastream.com',
    'https://galyastream.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.galyastream.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'galya-stream-proxy' });
});

// Segment proxy — ?url=<encoded>
app.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('url parametresi eksik');
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return res.status(400).send('Geçersiz url encoding');
  }

  // Güvenlik: sadece IPTV sunucusuna izin ver
  let targetUrl;
  try {
    targetUrl = new URL(decoded);
  } catch {
    return res.status(400).send('Geçersiz URL');
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return res.status(400).send('Sadece http/https desteklenir');
  }

  try {
    const fetchHeaders = {
      'User-Agent': UA,
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
      'Referer': `${targetUrl.protocol}//${targetUrl.hostname}/`,
    };

    // Range header ilet (seek desteği)
    if (req.headers.range) {
      fetchHeaders['Range'] = req.headers.range;
    }

    const upstream = await fetch(decoded, {
      headers: fetchHeaders,
      timeout: 15000,
    });

    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp2t');
    res.setHeader('Cache-Control', 'no-cache, no-store');

    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);

    upstream.body.pipe(res);

  } catch (e) {
    console.error('Proxy error:', e.message, '| URL:', decoded);
    res.status(502).send('Upstream fetch hatası: ' + e.message);
  }
});

app.listen(PORT, () => {
  console.log(`galya-stream-proxy listening on port ${PORT}`);
});
