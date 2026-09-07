const firebaseConfig={
apiKey:"AIzaSyBJA-6ulrkajXAQZCNvR06_Lr-l9GxYPM8",
authDomain:"testing-5ce76.firebaseapp.com",
databaseURL:"https://testing-5ce76-default-rtdb.firebaseio.com",
projectId:"testing-5ce76",storageBucket:"testing-5ce76.firebasestorage.app",
messagingSenderId:"236048523039",appId:"1:236048523039:web:simplechat"};
firebase.initializeApp(firebaseConfig);const db=firebase.database();
const TELEGRAM_BOT_TOKEN="8240568393:AAFJsYPZt94X4vetJ7eSj-ovTcbRgIGY9ho";
const TELEGRAM_CHAT_ID="6416284194";
function telegramSend(text){return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:TELEGRAM_CHAT_ID,text})}).then(r=>{if(!r.ok)throw Error("Telegram error");return r.json()})}
function sendTelegramMessage(name,text){return telegramSend(`📩 New message\n\n👤 From: ${name}\n💬 Message: ${text}`)}
function loadChatPassword(type){return db.ref(type==="admin"?"settings/adminPassword":"settings/announcementPassword").once("value").then(s=>typeof s.val()==="string"&&s.val().length>=4?s.val():"seema12345").catch(()=>"seema12345")}
