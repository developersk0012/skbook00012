// Testing Firebase + Telegram configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJA-6ulrkajXAQZCNvR06_Lr-l9GxYPM8",
  authDomain: "testing-5ce76.firebaseapp.com",
  databaseURL: "https://testing-5ce76-default-rtdb.firebaseio.com",
  projectId: "testing-5ce76",
  storageBucket: "testing-5ce76.firebasestorage.app",
  messagingSenderId: "236048523039",
  appId: "1:236048523039:android:2b77e9729a8fe975f75a2a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const TELEGRAM_BOT_TOKEN = "8240568393:AAFJsYPZt94X4vetJ7eSj-ovTcbRgIGY9ho";
const TELEGRAM_CHAT_ID = "6416284194";

function telegramSend(text) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text})
  }).then(r => {
    if (!r.ok) throw new Error("Telegram API error");
    return r.json();
  });
}

function getUserId() {
  let id = localStorage.getItem("simple_chat_uid");
  if (!id) {
    id = (crypto && crypto.randomUUID) ? crypto.randomUUID() :
      "uid_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem("simple_chat_uid", id);
  }
  return id;
}
function getUserName(){ return localStorage.getItem("simple_chat_name") || ""; }
function setUserName(n){ localStorage.setItem("simple_chat_name", n); }
function clearUser(){ localStorage.removeItem("simple_chat_name"); localStorage.removeItem("simple_chat_uid"); }

function loadPassword(path) {
  return db.ref(path).once("value").then(s => {
    const v = s.val();
    return (typeof v === "string" && v.length >= 4) ? v : "seema12345";
  }).catch(() => "seema12345");
}

function notifyNewUserMessage(name, message) {
  return telegramSend(`📩 New message - SK Education\n\n👤 From: ${name}\n💬 Message: ${message}`);
}
