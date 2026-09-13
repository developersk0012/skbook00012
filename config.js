// ============================================
// SK CHAT - CONFIGURATION
// Sirf chatting ke liye bana hua standalone site.
// Same Firebase (chat) project + same Telegram bot
// jo SK Education wali site use karti hai, taaki
// dono jagah se messages ek hi jagah (aapke Telegram) aayein.
// ============================================

// ============================================
// 1. FIREBASE (CHAT) CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyB-xRozwE9wNq4Z0p2XPoT3R1tVa0xglq8",
    authDomain: "chatting--2.firebaseapp.com",
    databaseURL: "https://chatting--2-default-rtdb.firebaseio.com",
    projectId: "chatting--2",
    storageBucket: "chatting--2.firebasestorage.app",
    messagingSenderId: "572130314050",
    appId: "1:572130314050:web:f000cc780e861180b16adb",
    measurementId: "G-WHJ4DVQ62Y"
};

firebase.initializeApp(firebaseConfig);
const chatDb = firebase.database();

// ============================================
// 2. TELEGRAM BOT (Direct message to admin)
// ============================================
const TELEGRAM_BOT_TOKEN = '7819130123:AAEDqoO-eKWWa2bpUaqeBAJ5HAmanqUNOxE';
const TELEGRAM_CHAT_ID = '6416284194';

function telegramSend(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    }).then(function (res) {
        if (!res.ok) throw new Error('Telegram API error');
        return res.json();
    });
}

function sendTelegramPhoto(caption, file) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', file);
    if (caption) formData.append('caption', caption);
    return fetch(url, { method: 'POST', body: formData }).then(function (res) {
        if (!res.ok) throw new Error('Telegram photo send failed');
        return res.json();
    });
}

function sendTelegramMessage(userName, messageText, context) {
    let text = `📩 New message - SK Chat\n\n👤 From: ${userName}\n💬 Message: ${messageText}`;
    if (context) {
        const preview = context.length > 200 ? context.slice(0, 200) + '…' : context;
        text += `\n\n↩️ Replying to: "${preview}"`;
    }
    return telegramSend(text);
}

function sendLoginNotification(userName) {
    return telegramSend(`🔑 New Login - SK Chat\n\n👤 ${userName} ne app open kiya`);
}

function sendChatOpenNotification(userName) {
    return telegramSend(`🔓 Chat Opened - SK Chat\n\n👤 ${userName} ne password daal ke chat khola`);
}

function sendNotifyOwnerNotification(userName) {
    return telegramSend(`🔔 Notify - SK Chat\n\n👤 ${userName} aapse baat karna chahte hain. Unhe Telegram pe seedha message karein.`);
}

function sendSeenNotification(userName, text) {
    const preview = (text || '').length > 250 ? text.slice(0, 250) + '…' : (text || '(no text)');
    return telegramSend(`👀 Seen - SK Chat\n\n👤 ${userName} ne dekh liya:\n"${preview}"`);
}

// ============================================
// 3. USER IDENTITY (local device)
// ============================================
function getUserName() {
    return localStorage.getItem('skc_user_name') || null;
}
function setUserName(name) {
    localStorage.setItem('skc_user_name', name);
}
function clearUserName() {
    localStorage.removeItem('skc_user_name');
}
function isUserLoggedIn() {
    return getUserName() !== null;
}
function getUserId() {
    let id = localStorage.getItem('skc_user_id');
    if (!id) {
        id = (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : ('uid_' + Date.now() + '_' + Math.random().toString(36).slice(2));
        localStorage.setItem('skc_user_id', id);
    }
    return id;
}

// ============================================
// 4. PASSWORD SETTINGS (stored in Firebase, admin-editable)
// ============================================
function loadChatPassword() {
    return chatDb.ref('settings/chatPassword').once('value').then(function (snap) {
        const v = snap.val();
        return (typeof v === 'string' && v.length >= 4) ? v : 'seema12345';
    }).catch(function () { return 'seema12345'; });
}
function updateChatPassword(newPassword) {
    return chatDb.ref('settings/chatPassword').set(String(newPassword));
}

function loadAdminPassword() {
    return chatDb.ref('settings/adminPassword').once('value').then(function (snap) {
        const v = snap.val();
        return (typeof v === 'string' && v.length >= 4) ? v : 'seema12345';
    }).catch(function () { return 'seema12345'; });
}
function updateAdminPassword(newPassword) {
    return chatDb.ref('settings/adminPassword').set(String(newPassword));
}

function loadChatClosed() {
    return chatDb.ref('settings/chatClosed').once('value').then(function (snap) {
        return snap.val() === true;
    }).catch(function () { return false; });
}
function updateChatClosed(isClosed) {
    return chatDb.ref('settings/chatClosed').set(!!isClosed);
}

function loadMaintenance() {
    return chatDb.ref('settings/maintenance').once('value').then(function (snap) {
        return snap.val() === 'on';
    }).catch(function () { return false; });
}

// ============================================
// 5. PASSWORD LOCKOUT (3 wrong tries -> 5 min lock)
// ============================================
function getPasswordLockStatus() {
    const uid = getUserId();
    return chatDb.ref('users/' + uid + '/pwLock').once('value').then(function (snap) {
        return snap.val() || { failCount: 0, lockedUntil: null };
    });
}
function recordFailedPasswordAttempt() {
    const uid = getUserId();
    return getPasswordLockStatus().then(function (status) {
        const failCount = (status.failCount || 0) + 1;
        const update = { failCount: failCount, lockedUntil: status.lockedUntil || null };
        if (failCount >= 3) {
            update.failCount = 0;
            update.lockedUntil = Date.now() + 5 * 60 * 1000;
        }
        return chatDb.ref('users/' + uid + '/pwLock').set(update).then(function () { return update; });
    });
}
function clearPasswordLock() {
    const uid = getUserId();
    return chatDb.ref('users/' + uid + '/pwLock').set({ failCount: 0, lockedUntil: null });
}

// ============================================
// 6. USERS REGISTRY (block / unblock from admin panel)
// ============================================
function registerOrUpdateUser(name) {
    const uid = getUserId();
    const ref = chatDb.ref('users/' + uid);
    const now = new Date().toISOString();
    return ref.once('value').then(function (snap) {
        const existing = snap.val();
        const updates = { userId: uid, name: name, lastSeen: now };
        if (!existing) {
            updates.blocked = false;
            updates.firstSeen = now;
        }
        return ref.update(updates);
    });
}
function isUserBlocked() {
    const uid = getUserId();
    return chatDb.ref('users/' + uid + '/blocked').once('value').then(function (snap) {
        return snap.val() === true;
    }).catch(function () { return false; });
}
function watchBlockedStatus() {
    const uid = getUserId();
    chatDb.ref('users/' + uid + '/blocked').on('value', function (snap) {
        if (snap.val() === true) {
            clearUserName();
            alert('🚫 Aapko admin ne is chat se block kar diya hai.');
            window.location.href = 'index.html';
        }
    });
}
function blockUser(uid) { return chatDb.ref('users/' + uid).update({ blocked: true }); }
function unblockUser(uid) { return chatDb.ref('users/' + uid).update({ blocked: false }); }
function loadAllUsers() {
    return chatDb.ref('users').once('value').then(function (snap) { return snap.val() || {}; });
}

// ============================================
// 7. TOASTS + LOADING HELPERS
// ============================================
function showToast(msg, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'sk-toast sk-toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () { toast.remove(); }, 300);
    }, 2800);
}

function showDbError(container, err) {
    console.error('🔥 Firebase Error:', err);
    let msg = '❌ Data load nahi ho paya.';
    let hint = 'Kuch der baad phir try karein.';
    if (err && err.code === 'PERMISSION_DENIED') {
        msg = '🔒 Permission Denied';
        hint = 'Firebase Database Rules mein read access allow nahi hai.';
    } else if (!navigator.onLine) {
        msg = '📡 Internet Connection Nahi Hai';
        hint = 'Apna internet connection check karke phir try karein.';
    }
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:#f72585;">
                <div style="font-size:42px;margin-bottom:10px;">⚠️</div>
                <div style="font-size:16px;font-weight:600;margin-bottom:6px;">${msg}</div>
                <div style="font-size:13px;color:#a5b4fc;max-width:420px;margin:0 auto;">${hint}</div>
            </div>`;
    }
}

function withLoadingTimeout(container, timeoutMs) {
    timeoutMs = timeoutMs || 10000;
    return setTimeout(function () {
        if (container && container.innerHTML.includes('Loading')) {
            showDbError(container, { code: 'TIMEOUT' });
        }
    }, timeoutMs);
}

// ============================================
// 8. GLOBAL INJECTED STYLES (toast)
// ============================================
(function injectGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sk-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(16,30,50,0.97); backdrop-filter: blur(12px); color: white; padding: 14px 26px; border-radius: 12px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 40px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); z-index: 99999; opacity: 0; transition: all 0.3s ease; max-width: 90vw; text-align: center; }
        .sk-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .sk-toast-success { border-left: 4px solid #4cc9f0; }
        .sk-toast-error { border-left: 4px solid #f72585; }
    `;
    document.head.appendChild(style);
})();

chatDb.ref('.info/connected').on('value', function (snap) {
    if (snap.val() === true) console.log('✅ Firebase Connected');
    else console.warn('⚠️ Firebase Disconnected / Connecting...');
});

// ============================================
// 9. EXPOSE GLOBALLY
// ============================================
window.chatDb = chatDb;
window.getUserName = getUserName;
window.setUserName = setUserName;
window.clearUserName = clearUserName;
window.isUserLoggedIn = isUserLoggedIn;
window.getUserId = getUserId;
window.loadChatPassword = loadChatPassword;
window.updateChatPassword = updateChatPassword;
window.loadAdminPassword = loadAdminPassword;
window.updateAdminPassword = updateAdminPassword;
window.loadChatClosed = loadChatClosed;
window.updateChatClosed = updateChatClosed;
window.loadMaintenance = loadMaintenance;
window.getPasswordLockStatus = getPasswordLockStatus;
window.recordFailedPasswordAttempt = recordFailedPasswordAttempt;
window.clearPasswordLock = clearPasswordLock;
window.registerOrUpdateUser = registerOrUpdateUser;
window.isUserBlocked = isUserBlocked;
window.watchBlockedStatus = watchBlockedStatus;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.loadAllUsers = loadAllUsers;
window.showToast = showToast;
window.showDbError = showDbError;
window.withLoadingTimeout = withLoadingTimeout;
window.sendTelegramMessage = sendTelegramMessage;
window.sendTelegramPhoto = sendTelegramPhoto;
window.sendLoginNotification = sendLoginNotification;
window.sendChatOpenNotification = sendChatOpenNotification;
window.sendNotifyOwnerNotification = sendNotifyOwnerNotification;
window.sendSeenNotification = sendSeenNotification;

console.log('✅ SK Chat Config Loaded!');
console.log('💬 Chat DB: chatting--2 (same as SK Education chat)');
