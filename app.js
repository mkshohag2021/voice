
// 1. Initialize GunDB with decentralized relay peers
const gun = Gun(['https://gun-manhattan.herokuapp.com/gun', 'https://relay.peer.ooo/gun']);

// 🔵 LOCKING YOUR OFFICIAL FOUNDER ID
const OFFICIAL_ADMIN_ID = "VOICE-691547";

// Select DOM Elements
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const generateBtn = document.getElementById('generate-btn');
const keyDisplay = document.getElementById('key-display');
const secretKeyEl = document.getElementById('secret-key');
const loginKeyInput = document.getElementById('login-key');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

const tabTimeline = document.getElementById('tab-timeline');
const tabMessages = document.getElementById('tab-messages');
const timelineSection = document.getElementById('timeline-section');
const messagesSection = document.getElementById('messages-section');

const postText = document.getElementById('post-text');
const submitPostBtn = document.getElementById('submit-post');
const timelineFeed = document.getElementById('timeline-feed');
const charCount = document.getElementById('char-count');

// Admin Elements
const adminBroadcastBox = document.getElementById('admin-broadcast-box');
const noticeText = document.getElementById('notice-text');
const submitNotice = document.getElementById('submit-notice');
const bellBtn = document.getElementById('bell-btn');
const bellDot = document.getElementById('bell-dot');
const noticeModal = document.getElementById('notice-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const adminNoticeFeed = document.getElementById('admin-notice-feed');

// Group Elements
const groupIdInput = document.getElementById('group-id-input');
const joinGroupBtn = document.getElementById('join-group-btn');
const generateRoomBtn = document.getElementById('generate-room-btn');
const generatedRoomDisplay = document.getElementById('generated-room-display');
const generatedRoomCode = document.getElementById('generated-room-code');
const activeChatBox = document.getElementById('active-chat-box');
const currentGroupTitle = document.getElementById('current-group-title');
const chatMessagesDisplay = document.getElementById('chat-messages-display');
const chatMsgInput = document.getElementById('chat-msg-input');
const sendChatBtn = document.getElementById('send-chat-btn');

let currentActiveGroup = null;

// 2. Generate Hybrid Credentials
generateBtn.addEventListener('click', () => {
    const randomAccNum = Math.floor(100000 + Math.random() * 900000);
    const accountNumber = "VOICE-" + randomAccNum;
    
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let passcode = "";
    for (let i = 0; i < 16; i++) {
        passcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const userCredentials = `Account Number: ${accountNumber}\nPasscode: ${passcode}`;
    secretKeyEl.innerText = userCredentials;
    keyDisplay.classList.remove('hidden');
});

// 3. Secure Cryptographic Login Logic
loginBtn.addEventListener('click', async () => {
    const inputCredentials = loginKeyInput.value.trim();
    if (!inputCredentials) return alert('Please paste your login details!');
    
    try {
        const accMatch = inputCredentials.match(/Account Number:\s*(VOICE-\d+)/);
        const passMatch = inputCredentials.match(/Passcode:\s*([^\n]+)/);
        
        if (!accMatch || !passMatch) {
            return alert('Invalid Format! Please paste the exact credentials generated.');
        }
        
        const accNum = accMatch[1];
        const passCode = passMatch[1];
        
        const deterministicKey = await SEA.work(accNum, passCode);
        
        localStorage.setItem('voice_session_acc', accNum);
        localStorage.setItem('voice_session_key', deterministicKey);
        
        showAppScreen(accNum);
        loadTimeline();
        loadNotifications();
        
    } catch (e) {
        alert('Authentication failed! Check your credentials.');
    }
});

function showAppScreen(userDisplayId) {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    
    // Check if current user is the locked Admin ID
    if (userDisplayId === OFFICIAL_ADMIN_ID) {
        adminBroadcastBox.classList.remove('hidden');
    } else {
        adminBroadcastBox.classList.add('hidden');
    }
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('voice_session_acc');
    localStorage.removeItem('voice_session_key');
    location.reload();
});

// Tab & Modal Handlers
tabTimeline.addEventListener('click', () => {
    tabTimeline.classList.add('active');
    tabMessages.classList.remove('active');
    timelineSection.classList.remove('hidden');
    messagesSection.classList.add('hidden');
});

tabMessages.addEventListener('click', () => {
    tabMessages.classList.add('active');
    tabTimeline.classList.remove('active');
    messagesSection.classList.remove('hidden');
    timelineSection.classList.add('hidden');
});

bellBtn.addEventListener('click', () => {
    noticeModal.classList.remove('hidden');
    bellDot.classList.add('hidden'); // Clear alert dot when opened
});

closeModalBtn.addEventListener('click', () => {
    noticeModal.classList.add('hidden');
});

postText.addEventListener('input', () => {
    charCount.innerText = 10000 - postText.value.length;
});

// 4. Admin Announcement Posting Logic
submitNotice.addEventListener('click', () => {
    const text = noticeText.value.trim();
    const activeAcc = localStorage.getItem('voice_session_acc');
    
    if (activeAcc !== OFFICIAL_ADMIN_ID || !text) return;

    const timestamp = Date.now();
    gun.get('voice_admin_announcements').get(timestamp).put({
        msg: text,
        time: timestamp
    });
    
    noticeText.value = '';
    alert('Notice broadcasted successfully to all users! 🔔');
});

function loadNotifications() {
    let hasNotices = false;
    gun.get('voice_admin_announcements').map().on((data, id) => {
        if (!data || !data.msg) return;
        if (!hasNotices) {
            adminNoticeFeed.innerHTML = '';
            hasNotices = true;
        }

        const existingNotice = document.getElementById(`notice-${id}`);
        if (existingNotice) existingNotice.remove();

        const noticeCard = document.createElement('div');
        noticeCard.id = `notice-${id}`;
        noticeCard.style.padding = "12px";
        noticeCard.style.borderBottom = "1px solid #222";
        noticeCard.style.marginBottom = "10px";
        
        noticeCard.innerHTML = `
            <div style="font-size:0.8rem; color:#2ecc71; margin-bottom:5px;">
                🔵 <strong>FOUNDER & ADMIN</strong> <span style="float:right; color:var(--text-muted);">${new Date(data.time).toLocaleDateString()}</span>
            </div>
            <p style="white-space:pre-wrap; margin:0; font-size:0.95rem; color:#fff;">${data.msg}</p>
        `;
        adminNoticeFeed.insertBefore(noticeCard, adminNoticeFeed.firstChild);
        bellDot.classList.remove('hidden'); // Trigger red alert dot for new notice
    });
}

// 5. Timeline System with Client-Side Moderation For Admin
submitPostBtn.addEventListener('click', () => {
    const text = postText.value.trim();
    const activeAcc = localStorage.getItem('voice_session_acc');
    if (!text || !activeAcc) return;

    const timestamp = Date.now();
    const postData = { msg: text, author: activeAcc, time: timestamp };

    gun.get('voice_global_public_feed').get(timestamp).put(postData);
    postText.value = '';
    charCount.innerText = '10000';
});

function loadTimeline() {
    timelineFeed.innerHTML = '';
    const activeAcc = localStorage.getItem('voice_session_acc');

    gun.get('voice_global_public_feed').map().on((data, id) => {
        if (!data || !data.msg) return;
        
        const existingPost = document.getElementById(`post-${id}`);
        if (existingPost) existingPost.remove();

        const postCard = document.createElement('div');
        postCard.id = `post-${id}`;
        postCard.className = 'card';
        
        // Check Name and Badge Styling
        let authorLabel = `<strong>Anonymous ID:</strong> ${data.author}`;
        if (data.author === OFFICIAL_ADMIN_ID) {
            authorLabel = `<span style="background-color: #2980b9; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">🔵 FOUNDER & ADMIN</span>`;
        }

        // Admin Client-Side Delete Capability
        let adminDeleteBtn = '';
        if (activeAcc === OFFICIAL_ADMIN_ID) {
            adminDeleteBtn = `<button class="btn btn-danger" style="padding:2px 8px; font-size:0.75rem;" onclick="document.getElementById('post-${id}').remove()">Delete from View</button>`;
        }

        postCard.innerHTML = `
            <div style="font-size: 0.85rem; margin-bottom: 8px; display:flex; justify-content:space-between; align-items:center;">
                <div>${authorLabel}</div>
                ${adminDeleteBtn}
            </div>
            <p style="white-space: pre-wrap; user-select: text;">${data.msg}</p>
            <div style="margin-top: 15px; display: flex; gap: 15px; font-size: 0.85rem; color: var(--text-muted);">
                <span style="cursor:pointer;" onclick="alert('Liked!')">👍 Like</span>
                <span style="cursor:pointer;" onclick="alert('Disliked!')">👎 Dislike</span>
                <span>🕒 ${new Date(data.time).toLocaleTimeString()}</span>
            </div>
        `;
        timelineFeed.insertBefore(postCard, timelineFeed.firstChild);
    });
}

// 6. Predictable vs Cryptographic Random Room Engine
generateRoomBtn.addEventListener('click', () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomRoomId = "ROOM-";
    for (let i = 0; i < 8; i++) {
        randomRoomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generatedRoomCode.innerText = randomRoomId;
    groupIdInput.value = randomRoomId;
    generatedRoomDisplay.classList.remove('hidden');
});

joinGroupBtn.addEventListener('click', () => {
    const rawGroupName = groupIdInput.value.trim().toUpperCase();
    if (!rawGroupName) return alert('Please enter a room code!');

    currentActiveGroup = rawGroupName.replace(/[^A-Z0-9_-]/g, '');
    currentGroupTitle.innerText = currentActiveGroup;
    activeChatBox.classList.remove('hidden');
    
    loadGroupMessages(currentActiveGroup);
});

sendChatBtn.addEventListener('click', () => {
    const text = chatMsgInput.value.trim();
    const activeAcc = localStorage.getItem('voice_session_acc');
    if (!text || !currentActiveGroup || !activeAcc) return;

    const timestamp = Date.now();
    const chatData = { msg: text, sender: activeAcc, time: timestamp };

    gun.get('voice_group_rooms').get(currentActiveGroup).get(timestamp).put(chatData);
    chatMsgInput.value = '';
});

function loadGroupMessages(groupName) {
    chatMessagesDisplay.innerHTML = '';
    
    gun.get('voice_group_rooms').get(groupName).map().on((data, id) => {
        if (!data || !data.msg) return;

        const existingMsg = document.getElementById(`msg-${id}`);
        if (existingMsg) existingMsg.remove();

        const msgLine = document.createElement('div');
        msgLine.id = `msg-${id}`;
        msgLine.style.marginBottom = "12px";
        msgLine.style.padding = "8px 12px";
        msgLine.style.borderRadius = "6px";
        msgLine.style.backgroundColor = "#1e1e1e";

        let senderLabel = `<strong style="color:var(--primary-color); font-size:0.85rem;">${data.sender}:</strong>`;
        if (data.sender === OFFICIAL_ADMIN_ID) {
            senderLabel = `<span style="background-color: #2980b9; color: #fff; padding: 1px 5px; border-radius: 3px; font-weight: bold; font-size: 0.65rem; margin-right:5px;">🔵 FOUNDER & ADMIN</span>`;
        }

        msgLine.innerHTML = `
            <div style="margin-bottom: 4px;">${senderLabel} <span style="font-size:0.75rem; color:var(--text-muted); float:right;">${new Date(data.time).toLocaleTimeString()}</span></div>
            <p style="margin:0; font-size:0.95rem; white-space:pre-wrap;">${data.msg}</p>
        `;

        chatMessagesDisplay.appendChild(msgLine);
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
    });
}

// Session Lock On Boot
window.addEventListener('load', () => {
    const savedAcc = localStorage.getItem('voice_session_acc');
    const savedKey = localStorage.getItem('voice_session_key');
    if (savedAcc && savedKey) {
        showAppScreen(savedAcc);
        loadTimeline();
        loadNotifications();
    }
});

