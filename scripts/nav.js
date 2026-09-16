/* ==========================================
   GARDEN MANIAC - NAV & CORE MODULE
   ========================================== */

// --- CONFIGURATION ---
const ROBLOX_CLIENT_ID = '4037165407323325158';

// Compute redirect URI to always match current host (local vs GitHub Pages)
const REDIRECT_URI = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5500/'
    : 'https://fatalquackers.github.io/Garden-Maniac/';

// Backend URL: Points to local Node.js or Render
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://playgarp-backend.onrender.com'; // <-- REPLACE with your actual Render service URL if named differently

// Live backend URL vs Local
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://playgarp-backend.onrender.com';


document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkSavedAccount();
    handleOAuthCallback();
    createCustomAuthModal();
    updateDebugPanel();
    refreshIcons();
});

function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/* Notification Toast Handler */
function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    toast.style.cssText = `
        background: rgba(15, 23, 42, 0.95);
        color: #fff;
        padding: 12px 20px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        backdrop-filter: blur(10px);
        margin-top: 8px;
        font-weight: 600;
        font-size: 0.85rem;
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* Page Display Switcher */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });

    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        window.scrollTo(0, 0);
    }

    refreshIcons();
    showToast(`Loaded ${pageId.replace('-page', '').toUpperCase()}`);
}

/* Menu Drawer Mechanics */
function toggleMenuDrawer() {
    const drawer = document.getElementById('menuDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (drawer && overlay) {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

/* Language and Theme Switcher */
const languages = ['US', 'ES', 'FR', 'DE'];
let currentLangIndex = 0;

function toggleLanguage() {
    currentLangIndex = (currentLangIndex + 1) % languages.length;
    const selectedLang = languages[currentLangIndex];

    const langText = document.getElementById('langText');
    if (langText) langText.innerText = selectedLang;

    showToast(`Language set to ${selectedLang}`);
}

function initTheme() {
    const savedTheme = localStorage.getItem('garp_theme') || 'theme-dark-energized';
    setHubTheme(savedTheme);
}

function setHubTheme(themeClassName) {
    document.body.className = themeClassName;
    localStorage.setItem('garp_theme', themeClassName);
    showToast(`Theme set to ${themeClassName}`);
}

function toggleThemeMode() {
    const current = document.body.className;
    const next = current.includes('light') ? 'theme-dark-energized' : 'theme-light-energized';
    setHubTheme(next);
}

let soundEnabled = true;
function toggleSound() {
    soundEnabled = !soundEnabled;
    showToast(`Sound FX ${soundEnabled ? 'Enabled' : 'Disabled'}`);
}

/* Audio Engine */
let isPlaying = false;

function toggleBGM() {
    const audio = document.getElementById('bgmAudio');
    if (!audio) return;

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        showToast("Music Paused");
    } else {
        audio.play().then(() => {
            isPlaying = true;
            showToast("Playing Garden Chill Beats");
        }).catch(err => {
            console.error("Audio playback error:", err);
            showToast("Missing assets/music.mp3 in folder");
        });
    }
}

function changeVolume(val) {
    const audio = document.getElementById('bgmAudio');
    if (audio) audio.volume = parseFloat(val);
}

/* Roblox OAuth - Using configuration constants */
function buildRobloxAuthUrl() {
    const encodedRedirect = encodeURIComponent(REDIRECT_URI);
    const scope = encodeURIComponent('openid profile');
    return `https://apis.roblox.com/oauth/v1/authorize?client_id=${ROBLOX_CLIENT_ID}&response_type=code&redirect_uri=${encodedRedirect}&scope=${scope}`;
}

function updateDebugPanel() {
    const fullUrl = buildRobloxAuthUrl();
    const origin = window.location.origin;

    const debugClientIdEl = document.getElementById('debugClientId');
    const debugOriginEl = document.getElementById('debugOrigin');
    const debugRedirectUriEl = document.getElementById('debugRedirectUri');
    const debugFullUrlEl = document.getElementById('debugFullUrl');

    if (debugClientIdEl) debugClientIdEl.innerText = ROBLOX_CLIENT_ID;
    if (debugOriginEl) debugOriginEl.innerText = origin;
    if (debugRedirectUriEl) debugRedirectUriEl.innerText = REDIRECT_URI;
    if (debugFullUrlEl) debugFullUrlEl.value = fullUrl;
}

function connectRobloxAccount() {
    const savedUser = localStorage.getItem('roblox_user');
    if (savedUser) {
        showPage('account-page');
        return;
    }

    testDirectRedirect();
}

function testDirectRedirect() {
    const targetUrl = buildRobloxAuthUrl();
    showToast("Redirecting to Roblox OAuth...");
    window.location.assign(targetUrl);
}

function copyDebugUrl() {
    navigator.clipboard.writeText(REDIRECT_URI);
    showToast(`Copied "${REDIRECT_URI}" to Clipboard!`);
}

function createCustomAuthModal() {
    if (document.getElementById('customAuthModal')) return;

    const modal = document.createElement('div');
    modal.id = 'customAuthModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(12px);
        z-index: 20000;
        align-items: center;
        justify-content: center;
    `;

    modal.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.15); padding: 32px; border-radius: 20px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); color: #fff; font-family: inherit;">
            <h3 style="margin-top: 0; font-size: 1.3rem;">Connect Roblox Profile</h3>
            <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px;">Enter your username for local sync:</p>
            <input type="text" id="robloxInputName" placeholder="Roblox Username..." style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.4); color: #fff; margin-bottom: 20px; outline: none; font-size: 0.95rem;" />
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="closeRobloxModal()" style="padding: 10px 18px; border-radius: 10px; border: none; background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; font-weight: 700;">Cancel</button>
                <button onclick="submitRobloxModal()" style="padding: 10px 18px; border-radius: 10px; border: none; background: #00ff88; color: #000; font-weight: 800; cursor: pointer;">Connect</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function openRobloxModal() {
    const modal = document.getElementById('customAuthModal');
    if (modal) modal.style.display = 'flex';
}

function closeRobloxModal() {
    const modal = document.getElementById('customAuthModal');
    if (modal) modal.style.display = 'none';
}

function submitRobloxModal() {
    const input = document.getElementById('robloxInputName');
    if (input && input.value.trim() !== "") {
        const cleanName = input.value.trim();
        const userObj = { username: cleanName, preferred_username: cleanName };
        localStorage.setItem('roblox_user', JSON.stringify(userObj));
        updateUIForConnectedAccount(userObj);
        closeRobloxModal();
        showPage('account-page');
        showToast(`Connected as ${cleanName}`);
    }
}

function checkSavedAccount() {
    const savedUser = localStorage.getItem('roblox_user');
    const navAvatarContainer = document.getElementById('navAvatarContainer');

    if (savedUser) {
        try {
            const userObj = JSON.parse(savedUser);
            updateUIForConnectedAccount(userObj);
        } catch (e) {
            console.error("User state read error:", e);
            if (navAvatarContainer) {
                navAvatarContainer.innerHTML = QUESTION_MARK_SVG;
                refreshIcons();
            }
        }
    } else {
        if (navAvatarContainer) {
            navAvatarContainer.innerHTML = QUESTION_MARK_SVG;
            refreshIcons();
        }
    }
}

/* Merged handleOAuthCallback using proper backend URLs & Payload */
async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        showToast("Authenticating with Backend Server...");
        
        // Clean up the URL bar
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
            const res = await fetch(`${BACKEND_URL}/api/oauth/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, redirect_uri: REDIRECT_URI })
            });

            const data = await res.json();

            // Handle successful auth (accepts 'data.user' or 'data' directly depending on backend response)
            if (res.ok && (data.user || data.sub || data.username)) {
                const userObj = data.user || data; 
                localStorage.setItem('roblox_user', JSON.stringify(userObj));
                updateUIForConnectedAccount(userObj);
                
                const displayName = userObj.preferred_username || userObj.username || "Player";
                showToast(`Authenticated as ${displayName}!`);
            } else {
                console.error('Authentication error:', data);
                showToast(`Auth Failed: ${data.error || 'Server rejected token'}`);
            }
        } catch (err) {
            console.error("Backend OAuth Error:", err);
            showToast("Backend Server is Offline or Connection Refused");
        }
    }
}

function updateUIForConnectedAccount(userObj) {
    const navUsername = document.getElementById('navUsername');
    const accountUsernameText = document.getElementById('accountUsernameText');
    const unconnectedCard = document.getElementById('accountUnconnected');
    const connectedCard = document.getElementById('accountConnected');
    const navAvatarContainer = document.getElementById('navAvatarContainer');

    const name = userObj.preferred_username || userObj.username || userObj.displayName || "Connected Player";

    if (navUsername) navUsername.innerText = name.toUpperCase();
    if (accountUsernameText) accountUsernameText.innerText = name;

    // Update Avatar Container with User Avatar
    if (navAvatarContainer) {
        if (userObj.avatarUrl || userObj.picture) {
            const imgUrl = userObj.avatarUrl || userObj.picture;
            navAvatarContainer.innerHTML = `<img src="${imgUrl}" alt="${name}" class="badge-logo-img" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else if (userObj.sub || userObj.userId) {
            // Fallback: Fetch headshot directly via Roblox Thumbnails API
            const userId = userObj.sub || userObj.userId;
            const headshotUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`;
            
            fetch(headshotUrl)
                .then(res => res.json())
                .then(data => {
                    if (data.data && data.data[0] && data.data[0].imageUrl) {
                        navAvatarContainer.innerHTML = `<img src="${data.data[0].imageUrl}" alt="${name}" class="badge-logo-img" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                    } else {
                        navAvatarContainer.innerHTML = QUESTION_MARK_SVG;
                        refreshIcons();
                    }
                })
                .catch(() => {
                    navAvatarContainer.innerHTML = QUESTION_MARK_SVG;
                    refreshIcons();
                });
        } else {
            navAvatarContainer.innerHTML = QUESTION_MARK_SVG;
            refreshIcons();
        }
    }

    if (unconnectedCard && connectedCard) {
        unconnectedCard.style.display = 'none';
        connectedCard.style.display = 'block';
    }
}

function unlinkRobloxAccount() {
    localStorage.removeItem('roblox_user');
    
    const navUsername = document.getElementById('navUsername');
    const unconnectedCard = document.getElementById('accountUnconnected');
    const connectedCard = document.getElementById('accountConnected');
    const navAvatarContainer = document.getElementById('navAvatarContainer');

    if (navUsername) navUsername.innerText = "CONNECT ROBLOX";
    
    if (navAvatarContainer) {
        navAvatarContainer.innerHTML = QUESTION_MARK_SVG;
        refreshIcons();
    }

    if (unconnectedCard && connectedCard) {
        unconnectedCard.style.display = 'block';
        connectedCard.style.display = 'none';
    }

    showToast("Unlinked Roblox Account");
}

// Default SVG Question Mark icon for logged-out state
const QUESTION_MARK_SVG = `<i data-lucide="help-circle" class="logged-out-question"></i>`;
