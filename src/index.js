/**
 * Garden Maniac API - Cloudflare Workers Backend
 * Handles announcements, leaks, and player data
 */

export default {
  async fetch(request, env, ctx) {
    // Enable CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ANNOUNCEMENTS ENDPOINTS
      if (path.startsWith('/api/announcements')) {
        if (method === 'GET') {
          return await getAnnouncements(env, url);
        } else if (method === 'POST') {
          return await createAnnouncement(request, env);
        }
      }

      // LEAKS ENDPOINTS
      if (path.startsWith('/api/leaks')) {
        if (method === 'GET') {
          return await getLeaks(env, url);
        } else if (method === 'POST') {
          return await createLeak(request, env);
        }
      }

      // PLAYER STATS ENDPOINTS
      if (path.startsWith('/api/players')) {
        if (method === 'GET') {
          return await getPlayerStats(env, url);
        } else if (method === 'POST') {
          return await updatePlayerStats(request, env);
        }
      }

      // AUTHENTICATION
      if (path === '/api/auth/roblox') {
        if (method === 'POST') {
          return await handleRobloxAuth(request, env);
        }
      }

      // Default 404
      return new Response(
        JSON.stringify({ error: 'Not found', path: path }),
        { status: 404, headers }
      );
    } catch (error) {
      console.error('API Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers }
      );
    }
  },
};

/**
 * GET /api/announcements
 * Fetch announcements (optionally by ID)
 */
async function getAnnouncements(env, url) {
  const id = url.searchParams.get('id');
  
  try {
    let data;
    if (id) {
      // Fetch single announcement
      data = await env.GARDEN_DB.get(`announcement:${id}`, 'json');
      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Announcement not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fetch all announcements (from KV or database)
      const allKeys = await env.GARDEN_DB.list({ prefix: 'announcement:' });
      data = [];
      for (const key of allKeys.keys) {
        const item = await env.GARDEN_DB.get(key.name, 'json');
        if (item) data.push(item);
      }
      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/announcements
 * Create a new announcement (admin only)
 */
async function createAnnouncement(request, env) {
  try {
    // TODO: Add authentication check here
    const body = await request.json();
    
    const announcement = {
      id: `ann_${Date.now()}`,
      title: body.title || 'Untitled',
      content: body.content || '',
      date: new Date().toISOString(),
      author: body.author || 'Garden Maniac Team',
      icon: body.icon || '📰',
    };

    await env.GARDEN_DB.put(
      `announcement:${announcement.id}`,
      JSON.stringify(announcement),
      { expirationTtl: 86400 * 365 } // 1 year
    );

    return new Response(JSON.stringify(announcement), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/leaks
 * Fetch classified leaks & rumors
 */
async function getLeaks(env, url) {
  const id = url.searchParams.get('id');

  try {
    let data;
    if (id) {
      data = await env.GARDEN_DB.get(`leak:${id}`, 'json');
      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Leak not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const allKeys = await env.GARDEN_DB.list({ prefix: 'leak:' });
      data = [];
      for (const key of allKeys.keys) {
        const item = await env.GARDEN_DB.get(key.name, 'json');
        if (item) data.push(item);
      }
      data.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/leaks
 * Create a new leak entry
 */
async function createLeak(request, env) {
  try {
    const body = await request.json();
    
    const leak = {
      id: `leak_${Date.now()}`,
      title: body.title || 'Classified',
      description: body.description || '',
      datePosted: new Date().toISOString(),
      credibility: body.credibility || 'unverified', // unverified, confirmed, debunked
      icon: body.icon || '👀',
      images: body.images || [],
    };

    await env.GARDEN_DB.put(
      `leak:${leak.id}`,
      JSON.stringify(leak),
      { expirationTtl: 86400 * 365 }
    );

    return new Response(JSON.stringify(leak), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/players/:robloxId
 * Fetch player statistics
 */
async function getPlayerStats(env, url) {
  const robloxId = url.searchParams.get('robloxId');

  if (!robloxId) {
    return new Response(
      JSON.stringify({ error: 'Missing robloxId parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const stats = await env.GARDEN_DB.get(`player:${robloxId}`, 'json');
    
    if (!stats) {
      // Return default stats for new players
      const defaultStats = {
        robloxId,
        username: 'New Player',
        level: 1,
        seeds: 0,
        plants: [],
        mutations: [],
        lastLogin: new Date().toISOString(),
      };
      return new Response(JSON.stringify(defaultStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/players
 * Update player statistics
 */
async function updatePlayerStats(request, env) {
  try {
    const body = await request.json();
    const { robloxId, username, level, seeds, plants, mutations } = body;

    if (!robloxId) {
      return new Response(
        JSON.stringify({ error: 'Missing robloxId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stats = {
      robloxId,
      username: username || 'Player',
      level: level || 1,
      seeds: seeds || 0,
      plants: plants || [],
      mutations: mutations || [],
      lastLogin: new Date().toISOString(),
    };

    await env.GARDEN_DB.put(
      `player:${robloxId}`,
      JSON.stringify(stats),
      { expirationTtl: 86400 * 365 * 2 } // 2 years
    );

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/roblox
 * Handle Roblox OAuth callback
 */
async function handleRobloxAuth(request, env) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for token with Roblox API
    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: env.ROBLOX_CLIENT_ID,
        client_secret: env.ROBLOX_CLIENT_SECRET,
        redirect_uri: env.ROBLOX_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to obtain token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Get user info from Roblox
    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userResponse.json();

    // Store session token in KV
    const sessionToken = generateToken();
    await env.GARDEN_DB.put(
      `session:${sessionToken}`,
      JSON.stringify({
        robloxId: userInfo.sub,
        username: userInfo.preferred_username,
        accessToken: access_token,
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 86400 * 7 } // 7 days
    );

    return new Response(JSON.stringify({
      sessionToken,
      robloxId: userInfo.sub,
      username: userInfo.preferred_username,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Helper: Generate a random token
 */
function generateToken() {
  return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}
