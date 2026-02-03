<!DOCTYPE html><html lang="ru"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Broke Pro Max</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        :root { --ios-blue: #007AFF; --glass: rgba(255, 255, 255, 0.7); --text: #000; --msg-in: rgba(229, 229, 234, 0.6); --accent: #34c759; }
        body.dark-mode { --glass: rgba(28, 28, 30, 0.8); --text: #fff; --msg-in: rgba(58, 58, 60, 0.6); background: #000; }
        * { box-sizing: border-box; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-family: -apple-system, sans-serif; }
        body, html { margin: 0; height: 100%; background: #000 url('https://w.wallhaven.cc/full/ex/wallhaven-ex96pw.png') center/cover; color: var(--text); overflow: hidden; }
        .app-container { display: flex; height: 100%; backdrop-filter: blur(30px); }
        .sidebar { width: 360px; background: var(--glass); border-right: 0.5px solid rgba(125,125,125,0.2); display: flex; flex-direction: column; z-index: 10; }
        .avatar { width: 55px; height: 55px; border-radius: 50%; background: var(--ios-blue); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; background-size: cover; position: relative; flex-shrink: 0; font-size: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .online-dot { position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; background: var(--accent); border: 2.5px solid white; border-radius: 50%; display: none; }
        .ios-input { background: rgba(125,125,125,0.1); border: none; border-radius: 14px; padding: 15px; width: 100%; color: var(--text); outline: none; margin-bottom: 10px; }
        .btn { background: var(--ios-blue); color: white; border: none; border-radius: 14px; padding: 16px; cursor: pointer; font-weight: 600; width: 100%; }
        .list-item { padding: 12px 18px; display: flex; align-items: center; gap: 15px; cursor: pointer; margin: 4px 12px; border-radius: 16px; }
        .active-chat { background: var(--ios-blue) !important; color: white !important; }
        .messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
        .msg { max-width: 70%; padding: 12px 16px; border-radius: 20px; font-size: 16px; line-height: 1.4; position: relative; animation: msgAppear 0.3s ease; }
        @keyframes msgAppear { from { opacity: 0; transform: translateY(10px); } }
        .m-in { background: var(--msg-in); align-self: flex-start; border-bottom-left-radius: 4px; }
        .m-out { background: linear-gradient(135deg, #007AFF, #00C6FF); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .nft-badge { background: linear-gradient(45deg, #FFD700, #FFA500); color: #000; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; margin-top: 4px; display: inline-block; }
        .reaction { position: absolute; bottom: -10px; right: 10px; background: var(--glass); border-radius: 10px; padding: 2px 5px; font-size: 12px; backdrop-filter: blur(5px); color: #000; }
        .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; backdrop-filter: blur(20px); }
        .modal-card { background: var(--glass); padding: 35px; border-radius: 35px; width: 90%; max-width: 380px; text-align: center; }
        @media (max-width: 768px) { .sidebar { width: 100%; } .chat-area { display: none; position: fixed; inset: 0; z-index: 100; background: var(--glass); } .chat-open .chat-area { display: flex !important; flex-direction: column; } }
    </style></head><body>

    <div id="auth-screen" style="display: flex; height: 100vh; justify-content: center; align-items: center;">
        <div class="modal-card">
            <h1>Broke Pro</h1><p style="opacity:0.6; margin-bottom:30px;">This is the best code.</p>
            <input type="text" id="auth-user" placeholder="Логин" class="ios-input">
            <input type="password" id="auth-pass" placeholder="Пароль (Admin)" class="ios-input">
            <button onclick="login()" class="btn">Войти в систему</button>
        </div>
    </div>

    <div id="app-screen" class="app-container" style="display:none;">
        <div class="sidebar">
            <div style="padding:60px 25px 20px;" onclick="openMyProfile()">
                <div style="display:flex; align-items:center; gap:15px; cursor:pointer;">
                    <div id="my-av-ui" class="avatar"></div>
                    <div><strong id="my-name-ui"></strong><br><small id="my-user-ui" style="opacity:0.5;"></small></div>
                </div>
            </div>
            <div style="padding: 0 20px 20px;"><input type="text" id="search-inp" placeholder="Поиск @username" class="ios-input" onkeyup="if(event.key==='Enter') searchStart(this.value)"></div>
            <div id="chat-list" style="flex:1; overflow-y:auto;"></div>
            <div style="padding:25px;">
                <button id="adm-btn" onclick="openModal('modal-admin')" class="btn" style="display:none; background:none; border:1px solid var(--ios-blue); color:var(--ios-blue); margin-bottom:12px;">🛠 АДМИН ПАНЕЛЬ</button>
                <button onclick="toggleTheme()" class="btn" style="background:rgba(125,125,125,0.1); color:var(--text);">🌓 Тема</button>
                <button onclick="logout()" class="btn" style="background:none; color:#FF3B30; margin-top:10px;">🚪 Выйти</button>
            </div>
        </div>

        <div class="chat-area">
            <div style="padding:15px 25px; display:flex; align-items:center; border-bottom:0.5px solid rgba(125,125,125,0.2); background: var(--glass); min-height:85px;">
                <button onclick="closeChat()" style="background:none; border:none; font-size:35px; color:var(--ios-blue); padding-right:15px;">‹</button>
                <div id="header-av" class="avatar" style="width:45px; height:45px; margin-right:15px;" onclick="viewUserProfile(activeID)"></div>
                <div style="flex:1;"><strong id="header-name"></strong><br><small id="typing-ui" style="color:var(--accent); font-weight:600; display:none;">печатает...</small></div>
            </div>
            <div id="msg-box" class="messages"></div>
            <div id="rec-status" style="display:none; text-align:center; color:#FF3B30; font-size:12px; padding:5px;">● ЗАПИСЬ ГОЛОСА...</div>
            <div style="padding:20px 25px; background: var(--glass); display:flex; gap:12px; align-items:center;">
                <label style="cursor:pointer; font-size:22px;">🖼️<input type="file" hidden accept="image/*" onchange="sendMedia(this, 'img')"></label>
                <button id="voice-btn" onclick="toggleRecord()" style="background:none; border:none; font-size:22px;">🎤</button>
                <input type="text" id="m-text" class="ios-input" style="margin:0;" placeholder="Сообщение..." oninput="socket.emit('typing', {to: activeID, from: db.username})">
                <button onclick="sendMsg()" class="btn" style="width:55px; height:50px; padding:0;">⬆</button>
            </div>
        </div>
    </div>

    <div id="modal-admin" class="modal" onclick="closeModals()"><div class="modal-card" onclick="event.stopPropagation()">
        <h3>Управление Broke Pro</h3>
        <button onclick="requestStats()" class="btn" style="background:#5856D6; margin-bottom:12px;">👥 СПИСОК ЮЗЕРОВ (DB)</button>
        <button onclick="admNFT()" class="btn" style="background:var(--accent); margin-bottom:12px;">💎 ВЫДАТЬ NFT ЗНАЧОК</button>
        <button onclick="admKick()" class="btn" style="background:#FF9500; margin-bottom:12px;">🗑 СНЕСТИ АККАУНТ</button>
        <button onclick="admBanIP()" class="btn" style="background:#FF3B30;">🚫 ПОЛНЫЙ БАН ПО IP</button>
        <div id="admin-stats-container" style="display:none; text-align:left; max-height:200px; overflow-y:auto; background:rgba(0,0,0,0.1); border-radius:15px; padding:15px; margin-top:15px;">
            <div id="stats-items"></div>
        </div>
    </div></div>

    <div id="modal-profile" class="modal" onclick="closeModals()"><div class="modal-card" onclick="event.stopPropagation()">
        <div id="p-av" class="avatar" style="width:110px; height:110px; margin:0 auto 20px; font-size:45px;"></div>
        <h2 id="p-name-top" style="margin:5px 0;"></h2>
        <p id="p-user-top" style="color:var(--ios-blue); font-weight:600; margin:0 0 20px;"></p>
        <div id="profile-edit-fields" style="display:none;">
            <input type="text" id="ed-name" placeholder="Имя" class="ios-input">
            <input type="text" id="ed-about" placeholder="О себе" class="ios-input">
            <input type="text" id="ed-av" placeholder="URL аватара" class="ios-input">
            <input type="color" id="ed-color" style="width:100%; height:45px; border:none; margin:15px 0; background:none;">
            <button onclick="saveProfile()" class="btn">Сохранить</button>
        </div>
        <div id="p-info-static" style="text-align:left; border-top:0.5px solid rgba(125,125,125,0.2); padding-top:15px;">
            <p><b>О себе:</b> <span id="p-about-val"></span></p>
            <div id="p-nfts"></div>
        </div>
    </div></div>

    <script>
        const socket = io();
        let db = JSON.parse(localStorage.getItem('broke_user')) || null;
        let history = JSON.parse(localStorage.getItem('broke_history')) || [];
        let msgLog = JSON.parse(localStorage.getItem('broke_msgs')) || [];
        let onlineUsers = {}, activeID = null, rec, chunks = [];
        const botID = "@11319";

        window.onload = () => { if(db) startApp(); };

        function login() {
            const u = document.getElementById('auth-user').value.trim();
            const p = document.getElementById('auth-pass').value.trim();
            if(!u) return;
            const nick = u.startsWith('@') ? u.toLowerCase() : '@'+u.toLowerCase();
            if(nick==='@paramov' && p==='565811') db = {username:nick, name:'Admin', isAdmin:true, nfts:['👑'], about:'This is the best code.', pColor:'#007AFF'};
            else {
                let old = history.find(h => h.username === nick);
                db = old || {username:nick, name:u, nfts:[], about:'Broke User', pColor:'#ffffff00'};
            }
            save(); startApp();
        }

        function startApp() {
            document.getElementById('auth-screen').style.display='none';
            document.getElementById('app-screen').style.display='flex';
            if(db.isAdmin) document.getElementById('adm-btn').style.display='block';
            socket.emit('online', db.username);
            updateUI(); renderList();
        }

        function sendMsg() {
            const inp = document.getElementById('m-text');
            if(!inp.value.trim() || !activeID) return;
            const d = { id:Date.now(), to:activeID, from:db.username, text:inp.value, type:'text', time:Date.now() };
            socket.emit('private_msg', d); msgLog.push(d); saveMsgs(); appendMsg(d); inp.value=""; renderList();
            if(activeID === botID) botResponse(d.text);
        }

        function botResponse(val) {
            setTimeout(() => {
                let res = "❌ Юзер не найден.";
                const target = history.find(h => h.username.toLowerCase() === val.toLowerCase().trim() || h.username.toLowerCase() === '@'+val.toLowerCase().trim());
                if(target) {
                    const logs = msgLog.filter(m => m.from === target.username).length;
                    res = `🔍 ОТЧЕТ: ${target.username}\n📂 СООБЩЕНИЙ: ${logs}\n📍 СТАТУС: ${onlineUsers[target.username]?'ONLINE':'OFFLINE'}\n📝 О СЕБЕ: ${target.about}`;
                }
                const bd = { id:Date.now(), from:botID, to:db.username, text:res, type:'text', time:Date.now() };
                msgLog.push(bd); saveMsgs(); appendMsg(bd); renderList();
            }, 1000);
        }

        function appendMsg(d) {
            const isMe = d.from === db.username;
            const div = document.createElement('div');
            div.className = `msg ${isMe?'m-out':'m-in'}`;
            div.id = `msg-${d.id}`;
            div.onclick = () => { if(confirm('❤️?')) { d.react = '❤️'; socket.emit('add_reaction', {id:d.id, emoji:'❤️', to:activeID}); div.innerHTML += '<div class="reaction">❤️</div>'; } };
            div.oncontextmenu = (e) => { e.preventDefault(); if(isMe && confirm('Удалить?')) { socket.emit('delete_msg', {id:d.id, to:activeID}); div.remove(); } };

            if(d.type==='img') div.innerHTML = `<img src="${d.text}" class="msg-img">`;
            else if(d.type==='voice') div.innerHTML = `▶️ Голосовое`;
            else div.innerText = d.text;

            if(d.react) div.innerHTML += `<div class="reaction">${d.react}</div>`;
            const box = document.getElementById('msg-box');
            box.appendChild(div); box.scrollTop = box.scrollHeight;
            if(d.type==='voice') div.onclick = () => new Audio(d.text).play();
        }

        async function toggleRecord() {
            if(!rec || rec.state === 'inactive') {
                const s = await navigator.mediaDevices.getUserMedia({audio:true});
                rec = new MediaRecorder(s); chunks = [];
                rec.ondataavailable = e => chunks.push(e.data);
                rec.onstop = () => {
                    const b = new Blob(chunks, {type:'audio/ogg'});
                    const r = new FileReader();
                    r.onload = (e) => {
                        const d = { id:Date.now(), to:activeID, from:db.username, text:e.target.result, type:'voice', time:Date.now() };
                        socket.emit('private_msg', d); msgLog.push(d); saveMsgs(); appendMsg(d);
                    };
                    r.readAsDataURL(b);
                };
                rec.start(); document.getElementById('rec-status').style.display='block';
            } else { rec.stop(); document.getElementById('rec-status').style.display='none'; }
        }

        function sendMedia(inp, type) {
            const r = new FileReader();
            r.onload = (e) => {
                const d = { id:Date.now(), to:activeID, from:db.username, text:e.target.result, type:type, time:Date.now() };
                socket.emit('private_msg', d); msgLog.push(d); saveMsgs(); appendMsg(d);
            };
            r.readAsDataURL(inp.files[0]);
        }

        function renderList() {
            const contacts = [...new Set(msgLog.map(m=>m.from===db.username?m.to:m.from))];
            if(msgLog.some(m=>m.from===botID)) if(!contacts.includes(botID)) contacts.push(botID);
            
            document.getElementById('chat-list').innerHTML = contacts.map(c => {
                const u = history.find(h => h.username === c) || {name:c, username:c};
                return `<div class="list-item ${activeID===c?'active-chat':''}" onclick="openChat('${c}')">
                    <div class="avatar" style="background-image:url('${u.avatar||''}'); box-shadow:0 0 10px ${u.pColor}">${u.avatar?'':u.name[0]}
                        <div class="online-dot" style="display:${onlineUsers[c]?'block':'none'}"></div>
                    </div>
                    <div><b>${u.name}</b><br><small>${u.username}</small></div>
                </div>`;
            }).join('');
        }

        function openChat(id) {
            activeID = id; document.body.classList.add('chat-open');
            document.getElementById('header-name').innerText = id;
            const u = history.find(h=>h.username===id) || {name:id};
            document.getElementById('header-av').style.backgroundImage = u.avatar ? `url('${u.avatar}')` : 'none';
            document.getElementById('header-av').innerText = u.avatar ? '' : u.name[0];
            document.getElementById('msg-box').innerHTML = '';
            msgLog.filter(m=>(m.from===id && m.to===db.username)||(m.from===db.username && m.to===id)).forEach(appendMsg);
        }

        function saveProfile() {
            db.name = document.getElementById('ed-name').value || db.name;
            db.about = document.getElementById('ed-about').value || db.about;
            db.avatar = document.getElementById('ed-av').value || db.avatar;
            db.pColor = document.getElementById('ed-color').value;
            save(); 
            const idx = history.findIndex(h => h.username === db.username);
            if(idx !== -1) history[idx] = db; else history.push(db);
            localStorage.setItem('broke_history', JSON.stringify(history));
            socket.emit('update_profile_broadcast', db); updateUI(); closeModals();
        }

        function updateUI() {
            document.getElementById('my-name-ui').innerText = db.name;
            document.getElementById('my-user-ui').innerText = db.username;
            const av = document.getElementById('my-av-ui');
            av.style.backgroundImage = db.avatar ? `url('${db.avatar}')` : 'none';
            av.innerText = db.avatar ? '' : db.name[0];
            av.style.boxShadow = `0 0 15px ${db.pColor}`;
        }

        function openMyProfile() { 
            openModal('modal-profile'); document.getElementById('profile-edit-fields').style.display='block'; 
            showProfileData(db);
        }

        function viewUserProfile(id) {
            if(id === botID) return;
            openModal('modal-profile'); document.getElementById('profile-edit-fields').style.display='none';
            showProfileData(history.find(h => h.username === id) || {name:id, username:id, about:'Нет данных'});
        }

        function showProfileData(u) {
            document.getElementById('p-name-top').innerText = u.name;
            document.getElementById('p-user-top').innerText = u.username;
            document.getElementById('p-av').style.backgroundImage = u.avatar ? `url('${u.avatar}')` : 'none';
            document.getElementById('p-av').innerText = u.avatar ? '' : u.name[0];
            document.getElementById('p-av').style.boxShadow = `0 0 20px ${u.pColor}`;
            document.getElementById('p-about-val').innerText = u.about || 'Broke User';
            document.getElementById('p-nfts').innerHTML = (u.nfts || []).map(n => `<span class="nft-badge">${n}</span>`).join(' ');
        }

        function requestStats() { document.getElementById('admin-stats-container').style.display='block'; socket.emit('get_admin_stats'); }
        socket.on('receive_admin_stats', (users) => {
            document.getElementById('stats-items').innerHTML = users.map(u => `<div class="stats-item"><b>${u.username}</b><br><small>${u.firstSeen}</small></div>`).join('');
        });

        socket.on('receive_msg', (d) => { msgLog.push(d); saveMsgs(); if(activeID===d.from) appendMsg(d); renderList(); });
        socket.on('user_status', (d) => { onlineUsers[d.username] = d.status==='online'; renderList(); });
        socket.on('kick_signal', (u) => { if(db.username.toLowerCase()===u) { localStorage.clear(); location.reload(); } });
        socket.on('display_typing', (d) => { if(activeID===d.from) { document.getElementById('typing-ui').style.display='block'; setTimeout(()=>document.getElementById('typing-ui').style.display='none', 2000); } });
        socket.on('user_profile_updated', (u) => { const i=history.findIndex(h=>h.username===u.username); if(i!==-1) history[i]=u; else history.push(u); renderList(); });

        function searchStart(v) { let t = v.startsWith('@')?v.toLowerCase():'@'+v.toLowerCase(); if(!history.find(h=>h.username===t)) { history.push({username:t, name:t.replace('@',''), nfts:[], about:'New User', pColor:'#ffffff00'}); localStorage.setItem('broke_history', JSON.stringify(history)); } openChat(t); renderList(); }
        function toggleTheme() { document.body.classList.toggle('dark-mode'); }
        function closeChat() { document.body.classList.remove('chat-open'); activeID=null; }
        function openModal(id) { document.getElementById(id).style.display='flex'; }
        function closeModals() { document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); document.getElementById('admin-stats-container').style.display='none'; }
        function save() { localStorage.setItem('broke_user', JSON.stringify(db)); }
        function saveMsgs() { localStorage.setItem('broke_msgs', JSON.stringify(msgLog)); }
        function logout() { localStorage.clear(); location.reload(); }
        function admKick() { const u = prompt('Кого?'); if(u) socket.emit('adm_kick_request', u.toLowerCase()); }
        function admBanIP() { const u = prompt('Кого?'); if(u) socket.emit('adm_ban_ip', u.toLowerCase()); }
        function admNFT() { const u = prompt('Кому?'); const n = prompt('Символ:'); const target=history.find(h=>h.username===u); if(target){ target.nfts.push(n); socket.emit('update_profile_broadcast', target); } }
    </script></body></html>
