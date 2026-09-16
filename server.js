require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Allow requests from your GitHub Pages domain & local dev server
app.use(cors({
  origin: [
    'https://fatalquackers.github.io',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const SERVER_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || 'https://fatalquackers.github.io/Garden-Maniac/';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'online', service: 'Garden Maniac Backend' });
});

// OAuth Callback & Token Exchange
app.post('/api/oauth/callback', async (req, res) => {
  const { code, redirect_uri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // Use client redirect if valid (e.g. localhost for dev), otherwise fallback to configured production URI
  const redirectToUse = (redirect_uri && redirect_uri.includes('localhost')) 
    ? redirect_uri 
    : SERVER_REDIRECT_URI;

  try {
    // 1. Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectToUse
    });

    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Roblox Token Exchange Failed:', tokenData);
      return res.status(tokenResponse.status).json({ 
        error: tokenData.error_description || tokenData.error || 'Token exchange failed' 
      });
    }

    // 2. Fetch user profile with the access token
    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Roblox UserInfo Failed:', userData);
      return res.status(userResponse.status).json({ error: 'Failed to fetch user profile' });
    }

    // 3. Return user data and token
    return res.json({
      access_token: tokenData.access_token,
      user: {
        userId: userData.sub,
        username: userData.preferred_username || userData.name,
        displayName: userData.nickname || userData.name || userData.preferred_username,
        picture: userData.picture || null
      }
    });

  } catch (err) {
    console.error('OAuth internal server error:', err);
    return res.status(500).json({ error: 'Internal server error during OAuth exchange' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Garden Maniac Backend listening on port ${PORT}`);
});
