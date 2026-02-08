require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  HOST
} = process.env;

// Store sessions in memory (use Redis/DB in production)
const sessions = new Map();

// Generate nonce for OAuth
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

// Verify HMAC from Shopify
function verifyHmac(query) {
  const { hmac, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&');
  
  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
  
  return hmac === generatedHmac;
}

// Home - redirect to install or show app
app.get('/', (req, res) => {
  const { shop } = req.query;
  
  if (shop) {
    return res.redirect(`/auth?shop=${shop}`);
  }
  
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start OAuth flow
app.get('/auth', (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }
  
  const nonce = generateNonce();
  const redirectUri = `${HOST}/auth/callback`;
  
  // Store nonce for verification
  sessions.set(`nonce_${shop}`, nonce);
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${SHOPIFY_SCOPES}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${nonce}`;
  
  res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;
  
  // Verify HMAC
  if (!verifyHmac(req.query)) {
    return res.status(400).send('HMAC verification failed');
  }
  
  // Verify nonce
  const storedNonce = sessions.get(`nonce_${shop}`);
  if (state !== storedNonce) {
    return res.status(400).send('State verification failed');
  }
  
  // Exchange code for access token
  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code
      })
    });
    
    const { access_token } = await tokenResponse.json();
    
    // Store session
    sessions.set(`token_${shop}`, access_token);
    
    // Set cookie and redirect to app
    res.cookie('shop', shop, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect('/builder');
    
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Theme Builder page
app.get('/builder', (req, res) => {
  const shop = req.cookies.shop;
  
  if (!shop || !sessions.get(`token_${shop}`)) {
    return res.redirect('/');
  }
  
  res.sendFile(path.join(__dirname, '../public/builder.html'));
});

// API: Get shop info
app.get('/api/shop', async (req, res) => {
  const shop = req.cookies.shop;
  const token = sessions.get(`token_${shop}`);
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get themes
app.get('/api/themes', async (req, res) => {
  const shop = req.cookies.shop;
  const token = sessions.get(`token_${shop}`);
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/themes.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Save section to theme
app.post('/api/themes/:themeId/sections', async (req, res) => {
  const shop = req.cookies.shop;
  const token = sessions.get(`token_${shop}`);
  const { themeId } = req.params;
  const { filename, content } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json`,
      {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: {
            key: `sections/${filename}.liquid`,
            value: content
          }
        })
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Save CSS to theme
app.post('/api/themes/:themeId/css', async (req, res) => {
  const shop = req.cookies.shop;
  const token = sessions.get(`token_${shop}`);
  const { themeId } = req.params;
  const { filename, content } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json`,
      {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: {
            key: `assets/${filename}.css`,
            value: content
          }
        })
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Theme Builder running on port ${PORT}`);
  console.log(`📦 Open http://localhost:${PORT}?shop=emsfm.myshopify.com`);
});
