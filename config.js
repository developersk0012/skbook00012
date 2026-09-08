// ============================================
// SK EDUCATION - CONFIGURATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyAzWlTFo9sIycAKkvV2tDSaMB3HqZXCV0U",
    authDomain: "simaji-ff970.firebaseapp.com",
    databaseURL: "https://simaji-ff970-default-rtdb.firebaseio.com",
    projectId: "simaji-ff970",
    storageBucket: "simaji-ff970.firebasestorage.app",
    messagingSenderId: "397843196773",
    appId: "1:397843196773:android:810280a4289abf84288f8c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const ADMIN_EMAIL = "satendrakkushwaha12@gmail.com";

const WHATSAPP_GROUP_LINK =
    "https://whatsapp.com/channel/0029Vb8HmPi8V0tqX1Ojz61U";

// ============================================
// TELEGRAM CONFIG
// ============================================

// Yahan apna Telegram Bot Token daalo
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN";

// Yahan apna Telegram Chat ID daalo
const TELEGRAM_CHAT_ID = "YOUR_CHAT_ID";

// ============================================
// TELEGRAM SEND
// ============================================

function telegramSend(text) {
    const url =
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text
        })
    }).then(function (res) {
        if (!res.ok) {
            throw new Error("Telegram API error");
        }

        return res.json();
    });
}

// ============================================
// NEW MESSAGE
// ============================================

function sendTelegramMessage(userName, messageText, context) {

    let text =
        `📩 New message - SK Education\n\n` +
        `👤 From: ${userName}\n` +
        `💬 Message: ${messageText}`;

    if (context) {
        const preview =
            context.length > 200
                ? context.slice(0, 200) + "…"
                : context;

        text += `\n\n↩️ Replying to: "${preview}"`;
    }

    return telegramSend(text);
}

// ============================================
// SEEN NOTIFICATION
// ============================================

function sendSeenNotification(userName, announcementText) {

    const preview =
        (announcementText || "").length > 250
            ? announcementText.slice(0, 250) + "…"
            : (announcementText || "(no text)");

    const text =
        `👀 Seen Update - SK Education\n\n` +
        `👤 ${userName} ne ye announcement dekh liya:\n` +
        `"${preview}"`;

    return telegramSend(text);
}

// ============================================
// ANNOUNCEMENT OPEN
// ============================================

function sendAnnouncementOpenNotification(userName) {

    const text =
        `📢 Announcement Open - SK Education\n\n` +
        `👤 ${userName} ne Announcement page open kiya`;

    return telegramSend(text);
}

// ============================================
// HUSBAND NOTIFICATION
// ============================================

function sendHusbandNotifyNotification(userName) {

    const text =
        `💌 Husband Notification - SK Education\n\n` +
        `👤 ${userName} ne "Notify Your Husband" par click kiya.\n` +
        `💬 User admin se baat karna chahta/chahti hai.`;

    return telegramSend(text);
}

// ============================================
// LOGIN NOTIFICATION
// ============================================

function sendLoginNotification(userName) {

    const text =
        `🔑 New Login - SK Education\n\n` +
        `👤 ${userName} ne app open kiya`;

    return telegramSend(text);
}

// ============================================
// MESSAGE PAGE UNLOCK
// ============================================

function sendMessagePageUnlockNotification(userName) {

    const text =
        `🔓 Message Page - SK Education\n\n` +
        `👤 ${userName} ne password daal ke Message page khola`;

    return telegramSend(text);
}

// ============================================
// USER MESSAGE
// ============================================

function sendUserMessage(userName, messageText, context) {

    const data = {
        user_id: getUserId(),
        user_name: userName,
        type: "text",
        message: messageText,
        context: context || null,
        telegram_message_id: null,
        timestamp: new Date().toISOString()
    };

    const ref = db.ref("user_messages").push();

    const firebaseSave = ref.set(data);

    const telegramSendPromise =
        sendTelegramMessage(
            userName,
            messageText,
            context
        ).then(function (resp) {

            const messageId =
                resp && resp.result
                    ? resp.result.message_id
                    : null;

            return ref.update({
                telegram_message_id: messageId
            }).then(function () {
                return resp;
            });
        });

    return Promise.all([
        firebaseSave,
        telegramSendPromise
    ]).then(function (results) {
        return results[1];
    });
}

// ============================================
// SEND PHOTO
// ============================================

function sendUserPhoto(
    userName,
    caption,
    file,
    context
) {

    return sendTelegramPhoto(
        caption,
        file
    ).then(function (resp) {

        const messageId =
            resp && resp.result
                ? resp.result.message_id
                : null;

        return db.ref("user_messages").push({

            user_id: getUserId(),

            user_name: userName,

            type: "photo",

            message: "📷 Photo bheji thi",

            context: context || null,

            telegram_message_id: messageId,

            timestamp: new Date().toISOString()

        }).then(function () {
            return resp;
        });
    });
}

// ============================================
// CHAT REQUEST
// ============================================

function notifyAdminForChat(userName) {

    const text =
        `🫣 Chat Request - SK Education\n\n` +
        `👤 ${userName} aapse baat karna chahte hain. ` +
        `Unhe Telegram pe seedha message karein.`;

    return telegramSend(text).then(function (resp) {

        const messageId =
            resp && resp.result
                ? resp.result.message_id
                : null;

        return db.ref("user_messages").push({

            user_id: getUserId(),

            user_name: userName,

            type: "notify",

            message:
                "🫣 Chat ke liye admin ko notify kiya tha",

            telegram_message_id: messageId,

            timestamp: new Date().toISOString()

        }).then(function () {
            return resp;
        });
    });
}

// ============================================
// DELETE USER MESSAGE
// ============================================

function deleteUserMessage(key) {
    return db.ref("user_messages/" + key).remove();
}

// ============================================
// TELEGRAM PHOTO
// ============================================

function sendTelegramPhoto(caption, file) {

    const url =
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();

    formData.append(
        "chat_id",
        TELEGRAM_CHAT_ID
    );

    formData.append(
        "photo",
        file
    );

    if (caption) {
        formData.append(
            "caption",
            caption
        );
    }

    return fetch(url, {
        method: "POST",
        body: formData
    }).then(function (res) {

        if (!res.ok) {
            throw new Error(
                "Telegram photo send failed"
            );
        }

        return res.json();
    });
}

// ============================================
// DEFAULT BATCHES
// ============================================

const DEFAULT_BATCHES = {

    "1": {
        name: "Khazana Batch",
        icon: "🏆",
        image:
            "https://i.ibb.co/7tJkXSRJ/IMG-20260820-221756-560.jpg",
        description:
            "Morning Batch - Complete Study Material"
    },

    "2": {
        name: "Disha Online Classes",
        icon: "🌟",
        image:
            "https://i.ibb.co/pBGDQq8m/1771220242-10th-batch.webp",
        description:
            "Evening Batch - Expert Guidance"
    },

    "3": {
        name: "Target Board",
        icon: "🎯",
        image:
            "https://i.ibb.co/KcDw1wwN/IMG-20260820-222646-987.jpg",
        description:
            "Weekend Batch - Board Exam Preparation"
    }
};

window.BATCHES = DEFAULT_BATCHES;

// ============================================
// CATEGORIES
// ============================================

const CATEGORIES = {

    science: "Science",

    math: "Mathematics",

    hindi: "Hindi",

    sanskrit: "Sanskrit",

    sst: "Social Studies"

};

const CATEGORY_ICONS = {

    science: "🔬",

    math: "📐",

    hindi: "📝",

    sanskrit: "🕉️",

    sst: "🌍"

};

// ============================================
// SUBCATEGORIES
// ============================================

const SUBCATEGORIES = {

    science: {

        physics: "Physics",

        chemistry: "Chemistry",

        biology: "Biology"

    },

    math: {

        objective: "Objective",

        subjective: "Subjective",

        notes: "Notes"

    },

    hindi: {

        grammar: "Grammar",

        book_notes: "Book Notes",

        imp_question: "Important Questions"

    },

    sanskrit: {

        grammar: "Grammar",

        book_notes: "Book Notes",

        imp_question: "Important Questions"

    },

    sst: {

        history: "History",

        geography: "Geography",

        civics: "Civics",

        economics: "Economics"

    }

};

// ============================================
// URL PARAM
// ============================================

function getUrlParam(name) {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    return urlParams.get(name);
}

// ============================================
// USER NAME
// ============================================

function getUserName() {

    return localStorage.getItem(
        "sk_user_name"
    ) || null;
}

function setUserName(name) {

    localStorage.setItem(
        "sk_user_name",
        name
    );
}

function clearUserName() {

    localStorage.removeItem(
        "sk_user_name"
    );
}

function isUserLoggedIn() {

    return getUserName() !== null;
}

// ============================================
// USER ID
// ============================================

function getUserId() {

    let id =
        localStorage.getItem(
            "sk_user_id"
        );

    if (!id) {

        id =
            window.crypto &&
            crypto.randomUUID

                ? crypto.randomUUID()

                : (
                    "uid_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .slice(2)
                );

        localStorage.setItem(
            "sk_user_id",
            id
        );
    }

    return id;
}

// ============================================
// LOAD BATCHES
// ============================================

function loadBatches() {

    return db.ref("batches")
        .once("value")
        .then(function (snap) {

            let data = snap.val();

            if (!data) {

                data = DEFAULT_BATCHES;

                db.ref("batches")
                    .set(DEFAULT_BATCHES)
                    .catch(function (err) {

                        console.error(
                            "Batch seeding failed:",
                            err
                        );

                    });
            }

            window.BATCHES = data;

            return data;

        })
        .catch(function (err) {

            console.error(
                "loadBatches failed:",
                err
            );

            window.BATCHES =
                DEFAULT_BATCHES;

            return DEFAULT_BATCHES;

        });
}

// ============================================
// NEXT BATCH ID
// ============================================

function getNextBatchId(batches) {

    const ids =
        Object.keys(batches)
            .map(Number)
            .filter(function (n) {
                return !isNaN(n);
            });

    return ids.length
        ? Math.max.apply(null, ids) + 1
        : 1;
}

// ============================================
// ADMIN PASSWORD
// ============================================

function loadAdminPassword() {

    return db.ref(
        "settings/adminPassword"
    )
    .once("value")
    .then(function (snap) {

        const value = snap.val();

        return (
            typeof value === "string" &&
            value.length >= 4
        )
            ? value
            : "seema12345";

    })
    .catch(function () {

        return "seema12345";

    });
}

function updateAdminPassword(newPassword) {

    return db.ref(
        "settings/adminPassword"
    ).set(String(newPassword));
}

// ============================================
// ANNOUNCEMENT PASSWORD
// ============================================

function loadAnnouncementPassword() {

    return db.ref(
        "settings/announcementPassword"
    )
    .once("value")
    .then(function (snap) {

        const value = snap.val();

        return (
            typeof value === "string" &&
            value.length >= 4
        )
            ? value
            : "seema12345";

    })
    .catch(function () {

        return "seema12345";

    });
}

function updateAnnouncementPassword(
    newPassword
) {

    return db.ref(
        "settings/announcementPassword"
    ).set(String(newPassword));
}

// ============================================
// DATABASE ERROR
// ============================================

function showDbError(
    container,
    err
) {

    console.error(
        "🔥 Firebase Error:",
        err
    );

    let msg =
        "❌ Data load nahi ho paya.";

    let hint =
        "Kuch der baad phir try karein.";

    if (
        err &&
        err.code === "PERMISSION_DENIED"
    ) {

        msg =
            "🔒 Permission Denied";

        hint =
            "Firebase Database Rules mein read access allow nahi hai.";

    } else if (!navigator.onLine) {

        msg =
            "📡 Internet Connection Nahi Hai";

        hint =
            "Apna internet connection check karke phir try karein.";
    }

    if (container) {

        container.innerHTML = `

            <div style="
                text-align:center;
                padding:40px 20px;
                color:#f72585;
            ">

                <div style="
                    font-size:42px;
                    margin-bottom:10px;
                ">
                    ⚠️
                </div>

                <div style="
                    font-size:16px;
                    font-weight:600;
                    margin-bottom:6px;
                ">
                    ${msg}
                </div>

                <div style="
                    font-size:13px;
                    color:#a5b4fc;
                    max-width:420px;
                    margin:0 auto;
                ">
                    ${hint}
                </div>

            </div>
        `;
    }
}

// ============================================
// LOADING TIMEOUT
// ============================================

function withLoadingTimeout(
    container,
    timeoutMs = 10000
) {

    const timer =
        setTimeout(function () {

            if (
                container &&
                container.innerHTML.includes(
                    "Loading"
                )
            ) {

                showDbError(
                    container,
                    {
                        code: "TIMEOUT"
                    }
                );
            }

        }, timeoutMs);

    return timer;
}

// ============================================
// FIREBASE CONNECTION
// ============================================

db.ref(".info/connected")
    .on("value", function (snap) {

        if (snap.val() === true) {

            console.log(
                "✅ Firebase Connected"
            );

        } else {

            console.warn(
                "⚠️ Firebase Disconnected / Connecting..."
            );
        }
    });

// ============================================
// TOAST
// ============================================

function showToast(
    msg,
    type
) {

    type = type || "success";

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "sk-toast sk-toast-" +
        type;

    toast.textContent = msg;

    document.body.appendChild(
        toast
    );

    requestAnimationFrame(
        function () {

            toast.classList.add(
                "show"
            );

        }
    );

    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

            setTimeout(
                function () {

                    toast.remove();

                },
                300
            );

        },
        2800
    );
}

// ============================================
// MESSAGE ADMIN POPUP (text/photo + optional reply-context)
// ============================================
function showMessageAdminModal(context) {
    if (document.getElementById('msgAdminOverlay')) return;
    const userName = getUserName() || 'Unknown';
    const contextPreview = context ? (context.length > 120 ? context.slice(0, 120) + '…' : context) : null;

    const overlay = document.createElement('div');
    overlay.className = 'wa-modal-overlay';
    overlay.id = 'msgAdminOverlay';
    overlay.innerHTML = `
        <div class="wa-modal msg-admin-modal">
            <div class="wa-icon">✉️</div>
            <h3>Message Admin</h3>
            ${contextPreview ? `<div class="reply-context">↩️ Replying to: "${contextPreview}"</div>` : ''}
            <p>Apna sawaal likhein ya photo attach karein — seedha admin ke Telegram pe pahunch jayega.</p>
            <textarea id="msgAdminText" placeholder="Apna message yahan likhein... (optional agar sirf photo bhejni ho)" rows="4"></textarea>
            <label class="photo-attach-label" for="msgAdminPhoto">
                📷 <span id="msgAdminPhotoName">Photo attach karein (optional)</span>
            </label>
            <input type="file" id="msgAdminPhoto" accept="image/*" style="display:none;">
            <button class="wa-join-btn" id="msgAdminSendBtn" type="button">📤 Send Message</button>
            <button class="wa-skip-btn" id="msgAdminCancelBtn" type="button">Cancel</button>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('show'); });

    function closeModal() {
        overlay.classList.remove('show');
        setTimeout(function() { overlay.remove(); }, 300);
    }

    overlay.querySelector('#msgAdminCancelBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#msgAdminPhoto').addEventListener('change', function() {
        const nameSpan = document.getElementById('msgAdminPhotoName');
        if (this.files && this.files[0]) {
            nameSpan.textContent = '✅ ' + this.files[0].name;
        } else {
            nameSpan.textContent = 'Photo attach karein (optional)';
        }
    });

    overlay.querySelector('#msgAdminSendBtn').addEventListener('click', function() {
        const text = document.getElementById('msgAdminText').value.trim();
        const photoInput = document.getElementById('msgAdminPhoto');
        const photoFile = photoInput.files && photoInput.files[0];

        if (!text && !photoFile) {
            showToast('Pehle kuch likhein ya photo attach karein!', 'error');
            return;
        }
        if (photoFile && photoFile.size > 10 * 1024 * 1024) {
            showToast('Photo 10MB se choti honi chahiye!', 'error');
            return;
        }

        const btn = this;
        btn.disabled = true;
        btn.textContent = '⏳ Sending...';

        let sendPromise;
        if (photoFile) {
            let caption = `📩 New photo - SK Education\n\n👤 From: ${userName}`;
            if (text) caption += `\n💬 ${text}`;
            if (context) {
                const cPreview = context.length > 150 ? context.slice(0, 150) + '…' : context;
                caption += `\n↩️ Replying to: "${cPreview}"`;
            }
            if (caption.length > 1000) caption = caption.slice(0, 1000) + '…';
            sendPromise = sendUserPhoto(userName, caption, photoFile, context);
        } else {
            sendPromise = sendUserMessage(userName, text, context);
        }

        sendPromise.then(function() {
            showToast('✅ Admin ko bhej diya gaya!');
            closeModal();
        }).catch(function(err) {
            console.error('Telegram send failed:', err);
            showToast('❌ Send nahi ho paya, phir try karein.', 'error');
            btn.disabled = false;
            btn.textContent = '📤 Send Message';
        });
    });
}

// ============================================
// WHATSAPP CHANNEL JOIN POPUP
// ============================================
function showWhatsAppPopup() {
    if (document.getElementById('waModalOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'wa-modal-overlay';
    overlay.id = 'waModalOverlay';
    overlay.innerHTML = `
        <div class="wa-modal">
            <div class="wa-icon">💬</div>
            <h3>Join Our WhatsApp Channel!</h3>
            <p>Latest updates, study materials aur announcements sabse pehle paane ke liye humara WhatsApp Channel abhi join karein.</p>
            <a href="${WHATSAPP_GROUP_LINK}" target="_blank" class="wa-join-btn">✅ Join Now</a>
            <button class="wa-skip-btn">Maybe Later</button>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('show'); });

    function closePopup() {
        overlay.classList.remove('show');
        setTimeout(function() { overlay.remove(); }, 300);
    }
    overlay.querySelector('.wa-join-btn').addEventListener('click', closePopup);
    overlay.querySelector('.wa-skip-btn').addEventListener('click', closePopup);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopup(); });
}

// ============================================
// GLOBAL INJECTED STYLES (toast + whatsapp/message modal)
// Har page mein alag se CSS likhne ke bajaye, ek hi jagah se
// inject karte hain taaki design consistent rahe.
// ============================================
(function injectGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sk-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(26,26,62,0.97); backdrop-filter: blur(12px); color: white; padding: 14px 26px; border-radius: 12px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 40px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); z-index: 99999; opacity: 0; transition: all 0.3s ease; max-width: 90vw; text-align: center; }
        .sk-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .sk-toast-success { border-left: 4px solid #4cc9f0; }
        .sk-toast-error { border-left: 4px solid #f72585; }
        .wa-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 99998; padding: 20px; opacity: 0; transition: opacity 0.3s ease; }
        .wa-modal-overlay.show { opacity: 1; }
        .wa-modal { background: linear-gradient(145deg, #1a1a3e, #2d1b69); border-radius: 22px; padding: 35px 30px; max-width: 380px; width: 100%; text-align: center; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 70px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s ease; }
        .wa-modal-overlay.show .wa-modal { transform: scale(1); }
        .wa-modal .wa-icon { font-size: 56px; margin-bottom: 12px; }
        .wa-modal h3 { font-size: 22px; margin-bottom: 8px; color: white; }
        .wa-modal p { color: #a5b4fc; font-size: 14px; margin-bottom: 22px; line-height: 1.5; }
        .wa-modal .wa-join-btn { display: block; width: 100%; padding: 14px; background: linear-gradient(90deg, #25d366, #128c7e); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; margin-bottom: 10px; transition: transform 0.2s; box-sizing: border-box; }
        .wa-modal .wa-join-btn:hover { transform: scale(1.02); }
        .wa-modal .wa-skip-btn { display: block; width: 100%; padding: 10px; background: transparent; border: none; color: #6a7a9e; font-size: 13px; cursor: pointer; }
        .wa-modal .wa-skip-btn:hover { color: #a5b4fc; }
        .msg-admin-modal textarea { width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 14px; margin-bottom: 14px; resize: vertical; font-family: inherit; box-sizing: border-box; }
        .msg-admin-modal textarea:focus { outline: none; border-color: #4361ee; background: rgba(255,255,255,0.08); }
        .msg-admin-modal textarea::placeholder { color: #4a5a7a; }
        .reply-context { background: rgba(67,97,238,0.12); border-left: 3px solid #4361ee; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; color: #a5b4fc; text-align: left; margin-bottom: 16px; word-break: break-word; }
        .ann-link-btn { display: inline-flex; align-items: center; gap: 6px; background: rgba(76,201,240,0.12); color: #4cc9f0; border: 1px solid rgba(76,201,240,0.25); padding: 8px 16px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 8px; transition: all 0.2s ease; }
        .ann-link-btn:hover { background: rgba(76,201,240,0.22); transform: translateY(-1px); }
        .photo-attach-label { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px dashed rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: #a5b4fc; font-size: 13px; cursor: pointer; margin-bottom: 14px; transition: all 0.2s ease; box-sizing: border-box; }
        .photo-attach-label:hover { border-color: #4361ee; background: rgba(67,97,238,0.08); color: white; }
    `;
    document.head.appendChild(style);
})();

// ============================================
// GLOBAL EXPORTS
// ============================================

window.db = db;

window.getUserName =
    getUserName;

window.setUserName =
    setUserName;

window.clearUserName =
    clearUserName;

window.isUserLoggedIn =
    isUserLoggedIn;

window.getUserId =
    getUserId;

window.getUrlParam =
    getUrlParam;

window.DEFAULT_BATCHES =
    DEFAULT_BATCHES;

window.loadBatches =
    loadBatches;

window.getNextBatchId =
    getNextBatchId;

window.CATEGORIES =
    CATEGORIES;

window.CATEGORY_ICONS =
    CATEGORY_ICONS;

window.SUBCATEGORIES =
    SUBCATEGORIES;

window.ADMIN_EMAIL =
    ADMIN_EMAIL;

window.WHATSAPP_GROUP_LINK =
    WHATSAPP_GROUP_LINK;

window.showDbError =
    showDbError;

window.withLoadingTimeout =
    withLoadingTimeout;

window.showToast =
    showToast;

window.sendTelegramMessage =
    sendTelegramMessage;

window.sendSeenNotification =
    sendSeenNotification;

window.sendLoginNotification =
    sendLoginNotification;

window.sendAnnouncementOpenNotification =
    sendAnnouncementOpenNotification;

window.sendHusbandNotifyNotification =
    sendHusbandNotifyNotification;

window.sendMessagePageUnlockNotification =
    sendMessagePageUnlockNotification;

window.sendTelegramPhoto =
    sendTelegramPhoto;

window.sendUserMessage =
    sendUserMessage;

window.sendUserPhoto =
    sendUserPhoto;

window.notifyAdminForChat =
    notifyAdminForChat;

window.deleteUserMessage =
    deleteUserMessage;

window.loadAdminPassword =
    loadAdminPassword;

window.updateAdminPassword =
    updateAdminPassword;

window.loadAnnouncementPassword =
    loadAnnouncementPassword;

window.updateAnnouncementPassword =
    updateAnnouncementPassword;

window.showMessageAdminModal =
    showMessageAdminModal;

window.showWhatsAppPopup =
    showWhatsAppPopup;

console.log(
    "✅ SK Education Config Loaded!"
);

console.log(
    "🔥 Firebase Project: simaji-ff970"
);