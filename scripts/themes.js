/**
 * Garden Maniac - Animated Theme System
 * Dynamic theme switching with smooth animations
 */

const THEMES = {
  'cave-forge': {
    name: '⛏️ Cave Forge',
    bg: 'radial-gradient(ellipse at 10% 10%, #0b0a0a 0%, #060504 40%, #0e0e0e 100%)',
    color: '#f3e8d6',
    accent: '#ff8a3d',
    orbColors: ['#ff6a00', '#ffb86b', '#4b3621'],
    particles: ['🔥', '⚒️', '✨', '🪨'],
    displayName: 'Cave Forge'
  },
  'neon-garden': {
    name: '🌸 Neon Garden',
    bg: 'radial-gradient(ellipse at 20% 50%, #0a1a2e 0%, #16213e 30%, #0f3460 100%)',
    color: '#e8f4f8',
    accent: '#00d9ff',
    orbColors: ['#00d9ff', '#00b4d8', '#48cae4'],
    particles: ['🌿', '🌸', '🌺', '✨'],
    displayName: 'Neon Garden'
  },
  'sunset-blaze': {
    name: '🌅 Sunset Blaze',
    bg: 'radial-gradient(ellipse at 30% 40%, #2a1810 0%, #5a3a2a 25%, #1a0f0a 100%)',
    color: '#ffd4a3',
    accent: '#ff6b35',
    orbColors: ['#ff6b35', '#f7931e', '#fdb833'],
    particles: ['🌅', '🔥', '🌊', '☀️'],
    displayName: 'Sunset Blaze'
  },
  'midnight-void': {
    name: '🌌 Midnight Void',
    bg: 'radial-gradient(ellipse at 50% 50%, #0a0e27 0%, #050a1a 50%, #0a0e27 100%)',
    color: '#b8c5d6',
    accent: '#6366f1',
    orbColors: ['#6366f1', '#818cf8', '#c4b5fd'],
    particles: ['⭐', '🌙', '✨', '💫'],
    displayName: 'Midnight Void'
  },
  'forest-pulse': {
    name: '🌲 Forest Pulse',
    bg: 'radial-gradient(ellipse at 25% 45%, #0a2618 0%, #1a4d2e 30%, #0d1b0f 100%)',
    color: '#c8e6c9',
    accent: '#66bb6a',
    orbColors: ['#66bb6a', '#81c784', '#a5d6a7'],
    particles: ['🌿', '🍃', '🌲', '🦋'],
    displayName: 'Forest Pulse'
  },
  'cyberpunk-pink': {
    name: '💀 Cyberpunk',
    bg: 'radial-gradient(ellipse at 15% 30%, #2d0a3e 0%, #1a0a2e 40%, #0f0415 100%)',
    color: '#ff10f0',
    accent: '#ff006e',
    orbColors: ['#ff006e', '#ff10f0', '#8338ec'],
    particles: ['⚡', '💻', '🎮', '🔌'],
    displayName: 'Cyberpunk'
  }
};

let currentTheme = 'cave-forge';

/**
 * Apply theme with smooth animation
 */
function setTheme(themeName) {
  if (!THEMES[themeName]) return;
  
  const theme = THEMES[themeName];
  const body = document.body;
  
  // Remove all theme classes
  Object.keys(THEMES).forEach(t => body.classList.remove(`theme-${t}`));
  
  // Add new theme class
  body.classList.add(`theme-${themeName}`);
  currentTheme = themeName;
  
  // Apply CSS variables for smooth transitions
  document.documentElement.style.setProperty('--theme-bg', theme.bg);
  document.documentElement.style.setProperty('--theme-color', theme.color);
  document.documentElement.style.setProperty('--theme-accent', theme.accent);
  
  // Update orbs
  updateThemeOrbs(theme.orbColors);
  
  // Save preference
  localStorage.setItem('selectedTheme', themeName);
  
  // Trigger transition animation
  body.style.animation = 'none';
  setTimeout(() => {
    body.style.animation = 'themeTransition 0.8s ease-in-out';
  }, 10);
}

/**
 * Cycle through themes
 */
function cycleTheme() {
  const themeNames = Object.keys(THEMES);
  const currentIndex = themeNames.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  setTheme(themeNames[nextIndex]);
}

/**
 * Update orb colors dynamically
 */
function updateThemeOrbs(colors) {
  const orbs = document.querySelectorAll('.glow-orb');
  orbs.forEach((orb, index) => {
    if (colors[index]) {
      orb.style.background = colors[index];
    }
  });
}

/**
 * Populate theme picker in account page
 */
function populateThemePicker() {
  const grid = document.getElementById('themeGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  Object.entries(THEMES).forEach(([themeKey, theme]) => {
    const button = document.createElement('button');
    button.className = 'theme-option-btn animated-theme-btn';
    if (currentTheme === themeKey) button.classList.add('active');
    
    button.innerHTML = `
      <span class="theme-preview">
        <span class="theme-dot" style="background: ${theme.accent}"></span>
      </span>
      <span class="theme-label">${theme.name}</span>
    `;
    
    button.onclick = () => setTheme(themeKey);
    grid.appendChild(button);
  });
}

/**
 * Initialize theme on page load
 */
function initThemes() {
  const saved = localStorage.getItem('selectedTheme');
  const theme = saved && THEMES[saved] ? saved : 'cave-forge';
  setTheme(theme);
  
  // Populate theme picker after page loads
  setTimeout(populateThemePicker, 100);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemes);
} else {
  initThemes();
}
