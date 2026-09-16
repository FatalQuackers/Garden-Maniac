export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Standard CORS headers so GitHub Pages can communicate with Cloudflare
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check root endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "online", service: "Garden Maniac Cloudflare Backend" }), {
        headers: corsHeaders
      });
    }

    // OAuth Callback & Token Exchange
    if (url.pathname === "/api/oauth/callback" && request.method === "POST") {
      try {
        const body = await request.json();
        const code = body.code;
        const redirect_uri = body.redirect_uri;

        if (!code) {
          return new Response(JSON.stringify({ error: "Missing authorization code" }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Determine redirect URI: use localhost if dev, else use configured production URI
        const isLocal = redirect_uri && (redirect_uri.includes("localhost") || redirect_uri.includes("127.0.0.1"));
        const redirectToUse = isLocal
          ? redirect_uri
          : (env.ROBLOX_REDIRECT_URI || "https://fatalquackers.github.io/Garden-Maniac/");

        // 1. Exchange authorization code for Roblox access token
        const tokenParams = new URLSearchParams({
          client_id: env.ROBLOX_CLIENT_ID,
          client_secret: env.ROBLOX_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectToUse
        });

        const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenParams.toString()
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok) {
          return new Response(JSON.stringify({
            error: tokenData.error_description || tokenData.error || "Token exchange failed"
          }), {
            status: tokenRes.status,
            headers: corsHeaders
          });
        }

        // 2. Fetch player profile from Roblox
        const userRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`
          }
        });

        const userData = await userRes.json();

        if (!userRes.ok) {
          return new Response(JSON.stringify({ error: "Failed to fetch user profile" }), {
            status: userRes.status,
            headers: corsHeaders
          });
        }

        // 3. Return user data to frontend
        return new Response(JSON.stringify({
          access_token: tokenData.access_token,
          user: {
            userId: userData.sub,
            username: userData.preferred_username || userData.name,
            displayName: userData.nickname || userData.name || userData.preferred_username,
            picture: userData.picture || null
          }
        }), {
          headers: corsHeaders
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Internal Worker error" }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Default 404
    return new Response(JSON.stringify({ error: "Endpoint Not Found" }), {
      status: 404,
      headers: corsHeaders
    });
  }
};
