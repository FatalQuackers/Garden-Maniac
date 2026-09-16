/**
 * Garden Maniac API Client
 * Frontend utility for communicating with Cloudflare Workers backend
 */

const API_BASE = 'https://api.gardenmaniac.com'; // Update with your Cloudflare domain

class GardenManiticAPI {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
    this.sessionToken = localStorage.getItem('gm_session_token');
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // ===== ANNOUNCEMENTS =====

  async getAnnouncements() {
    return this.request('/api/announcements');
  }

  async getAnnouncement(id) {
    return this.request(`/api/announcements?id=${id}`);
  }

  async createAnnouncement(title, content, author = 'Garden Maniac Team', icon = '📰') {
    return this.request('/api/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, content, author, icon }),
    });
  }

  // ===== LEAKS =====

  async getLeaks() {
    return this.request('/api/leaks');
  }

  async getLeak(id) {
    return this.request(`/api/leaks?id=${id}`);
  }

  async createLeak(title, description, credibility = 'unverified', images = [], icon = '👀') {
    return this.request('/api/leaks', {
      method: 'POST',
      body: JSON.stringify({ title, description, credibility, images, icon }),
    });
  }

  // ===== PLAYER STATS =====

  async getPlayerStats(robloxId) {
    return this.request(`/api/players?robloxId=${robloxId}`);
  }

  async updatePlayerStats(robloxId, username, level = 1, seeds = 0, plants = [], mutations = []) {
    return this.request('/api/players', {
      method: 'POST',
      body: JSON.stringify({
        robloxId,
        username,
        level,
        seeds,
        plants,
        mutations,
      }),
    });
  }

  // ===== AUTHENTICATION =====

  async handleRobloxOAuth(code, state) {
    const response = await this.request('/api/auth/roblox', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });

    if (response.sessionToken) {
      localStorage.setItem('gm_session_token', response.sessionToken);
      this.sessionToken = response.sessionToken;
    }

    return response;
  }

  logout() {
    localStorage.removeItem('gm_session_token');
    this.sessionToken = null;
  }
}

// Global API instance
const gmAPI = new GardenManiticAPI();
