<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Broke Messenger</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        :root {
            --ios-blue: #007AFF;
            --glass: rgba(255, 255, 255, 0.7);
            --text-color: #000;
            --msg-in: #e5e5ea;
            --bg-blur: blur(25px);
        }

        body.dark-mode {
            --glass: rgba(30, 30, 30, 0.85);
            --text-color: #fff;
            --msg-in: #3a3a3c;
            background-color: #000;
        }

        * { box-sizing: border-box; transition: background 0.3s, color 0.3s; }

        body, html {
            margin: 0; padding: 0; height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
            background: #000 url('https://w.wallhaven.cc/full/ex/wallhaven-ex96pw.png') no-repeat center center fixed;
            background-size: cover; overflow: hidden; color: var(--text-color);
        }

        .screen { display: none; height: 100vh; width: 100vw; }
        .active-screen { display: flex; animation: slideUp 0.4s ease; }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        #auth-screen { justify-content: center; align-items: center; backdrop-filter: blur(40px); }
        .auth-card { background: var(--glass); padding: 40px; border-radius: 30px; width: 320px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }

        .app-container { display: flex; width: 100%; height: 100%; }

        /* Sidebar */
        .sidebar {
            width: 320px; background: var(--glass); backdrop-filter: var(--bg-blur);
            border-right: 0.5px solid rgba(125,125,125,0.2); display: flex; flex-direction: column;
        }

        .profile-trigger { padding: 50px 20px 20px; cursor: pointer; border-bottom: 0.5px solid rgba(125,125,125,0.2); }
        .avatar-circle {
            width: 70px; height: 70px; border-radius: 50%; background: var(--ios-blue);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;
            background-size: cover; background-position: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .menu-btn { padding: 15px 20px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 17px; }
        .menu-btn:hover { background: rgba(125,125,125,0.1); }

        /* Chat area */
        .chat-area { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.03); }
        .chat-header {
            padding: 12px 20px; background: var(--glass); backdrop-filter: var(--bg-blur);
            display: flex; align-items: center; gap: 15px; border-bottom: 0.5px solid rgba(125,125,125,0.2);
        }

        .messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .msg { 
            max-width: 75%; padding: 10px 16px; border-radius: 20px; font-size: 16px; 
            position: relative; cursor: pointer; animation: msgPop 0.2s ease;
        }
        @keyframes msgPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .m-in { background: var(--msg-in); align-self: flex-start; border-bottom-left-radius: 4px; }
        .m-out { background: var(--ios-blue); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }

        .react-badge {
            position: absolute; bottom: -8px; right: 10px; background: white;
            border-radius: 10px; padding: 1px 6px; font-size: 12px; color: black; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Inputs */
        .input-row { padding: 15px; display: flex; gap: 10px; background: var(--glass); backdrop-filter: var(--bg-blur); }
        .ios-input {
            background: rgba(125,125,125,0.1); border: none; border-radius: 18px;
            padding: 12px 15px; flex: 1; color: var(--text-color); outline: none; font-size: 16px;
        }

        /* Modals */
        .modal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 100; justify-content: center; align-items: center;
        }
        .modal-card { background: var(--glass); backdrop-filter: blur(40px); width: 340px; border-radius: 30px; padding: 25px; text-align: center; }

        #reaction-picker {
            display: none; position: absolute; background: var(--glass); border-radius: 20px;
            padding: 10px; gap: 15px; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>

    <div id="auth-screen" class="screen">
        <div class="auth-card">
            <h1 style="margin:0;">Broke</h1>
            <p style="opacity:0.6; margin-bottom:20px;">Messenger</p>
            <input type="text" id="reg-name" placeholder="@username" class="ios-input" style="width:100%; margin-bottom:15px;">
            <button onclick="register()" style="width:100%; padding:14px; background:var(--ios-blue); color:white; border:none; border-radius:15px; font-weight:bold; cursor:pointer;">Войти</button>
        </div>
    </div>

    <div id="main-screen" class="screen app-container">
        <div class="sidebar">
            <div class="profile-trigger" onclick="viewProfile('me')">
                <div class="avatar-circle" id="my-av"></div>
                <strong id="my-name">User</strong><br>
                <small id="my-user" style="opacity:0.6;">@user</small>
            </div>
            <div style="padding: 15px;">
                <input type="text" placeholder="Поиск @username..." class="ios-input" style="width:100%;" onkeyup="doSearch(event)">
            </div>
            <div class="menu-btn" onclick="viewProfile('me')">👤 Мой Профиль</div>
            <div class="menu-btn" onclick="switchTheme()">🌓 Сменить тему</div>
            <div class="menu-btn" onclick="setAv()">🖼 Сменить аватар</div>
            <div class="menu-btn" onclick="goAdmin()">🛠 Админ панель</div>
        </div>

        <div class="chat-area">
            <div class="chat-header">
                <div class="avatar-circle" style="width:40px; height:40px; font-size:14px; margin:0;" id="chat-av"></div>
                <div>
                    <strong id="chat-target">Выберите чат</strong><br>
                    <small style="color:var(--ios-blue)">в сети</small>
                </div>
            </div>
            <div class="messages" id="chat-box"></div>
            <div class="input-row">
                <input type="text" id="msg-input" placeholder="Сообщение..." class="ios-input">
                <button onclick="send()" style="border:none; background:none; color:var(--ios-blue); font-size:24px; cursor:pointer;">⬆</button>
            </div>
        </div>
    </div>

    <div id="profile-modal" class="modal" onclick="closeAll(event)">
        <div class="modal-card">
            <div class="avatar-circle" style="width:100px; height:100px; margin: 0 auto 15px;" id="p-av"></div>
            <h2 id="p-name" style="margin:5px 0;"></h2>
            <p id="p-user" style="color:var(--ios-blue); margin:0;"></p>
            <div id="p-nfts" style="margin-top:10px;"></div>
            <div style="text-align: left; margin-top:15px; border-top: 1px solid rgba(125,125,125,0.2); padding-top:15px;">
                <p><b>О себе:</b> Broke User</p>
                <p><b>Номер:</b> <span id="p-num"></span></p>
            </div>
            <button onclick="closeAll(event,true)" class="ios-input" style="background:var(--ios-blue); color:white; width:100%; margin-top:10px; cursor:pointer;">Закрыть</button>
        </div>
    </div>

    <div id="admin-modal" class="modal">
        <div class="modal-card">
            <h3>🛠 Админ Панель</h3>
            <button class="menu-btn" style="width:100%; border-radius:10px; margin-bottom:5px;" onclick="adm('nft')">💎 Выдать NFT подарок</button>
            <button class="menu-btn" style="width:100%; border-radius:10px;" onclick="adm('sub')">📈 Накрутить статистику</button>
            <button onclick="closeAll(event,true)" class="ios-input" style="width:100%; margin-top:20px; cursor:pointer;">Выход</button>
        </div>
    </div>

    <div id="reaction-picker">
        <span onclick="react('👍')" style="cursor:pointer; font-size:24px;">👍</span>
        <span onclick="react('❤️')" style="cursor:pointer; font-size:24px;">❤️</span>
        <span onclick="react('🔥')" style="cursor:pointer; font-size:24px;">🔥</span>
        <span onclick="react('😂')" style="cursor:pointer; font-size:24px;">😂</span>
    </div>

    <script>
        const socket = io();
        let db = JSON.parse(localStorage.getItem('broke_v5')) || null;
        let active = null;
        let lastMsg = null;

        window.onload = () => {
            if (db) {
                if (db.dark) document.body.classList.add('dark-mode');
                init();
            } else document.getElementById('auth-screen').classList.add('active-screen');
        };

        function register() {
            const v = document.getElementById('reg-name').value;
            if (v.length < 2) return alert("Слишком короткий ник");
            db = {
                user: v.startsWith('@') ? v : '@' + v,
                name: v.replace('@', ''),
                dark: false, av: '', nfts: [], num: "+7 " + Math.floor(Math.random()*9000000000)
            };
            save(); init();
        }

        function save() { localStorage.setItem('broke_v5', JSON.stringify(db)); }

        function init() {
            document.getElementById('auth-screen').classList.remove('active-screen');
            document.getElementById('main-screen').classList.add('active-screen');
            updateUI();
            socket.emit('online', db.user);
        }

        function updateUI() {
            document.getElementById('my-name').innerText = db.name;
            document.getElementById('my-user').innerText = db.user;
            const el = document.getElementById('my-av');
            if (db.av) { el.style.backgroundImage = `url(${db.av})`; el.innerText = ''; }
            else { el.innerText = db.name[0].toUpperCase(); el.style.backgroundImage = 'none'; }
        }

        function switchTheme() {
            document.body.classList.toggle('dark-mode');
            db.dark = document.body.classList.contains('dark-mode');
            save();
        }

        function setAv() {
            const url = prompt("Введите прямую ссылку на фото (URL):");
            if (url) { db.av = url; save(); updateUI(); }
        }

        function doSearch(e) {
            if (e.key === "Enter") {
                const target = e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value;
                active = target;
                document.getElementById('chat-target').innerText = active;
                document.getElementById('chat-av').innerText = active[1].toUpperCase();
                document.getElementById('chat-box').innerHTML = "<center style='opacity:0.5; margin-top:20px;'>Чат с "+active+" создан</center>";
            }
        }

        function send() {
            const i = document.getElementById('msg-input');
            if (!i.value || !active) return;
            addMsg(i.value, 'm-out');
            socket.emit('private_msg', { to: active, from: db.user, text: i.value });
            i.value = "";
        }

        socket.on('receive_msg', (d) => {
            if (d.from === active) addMsg(d.text, 'm-in');
            else alert("Новое сообщение от " + d.from);
        });

        function addMsg(t, c) {
            const d = document.createElement('div');
            d.className = 'msg ' + c; d.innerText = t;
            d.onclick = (e) => {
                lastMsg = d;
                const p = document.getElementById('reaction-picker');
                p.style.display = 'flex'; p.style.top = e.pageY + 'px'; p.style.left = e.pageX + 'px';
                e.stopPropagation();
            };
            document.getElementById('chat-box').appendChild(d);
            document.getElementById('chat-box').scrollTop = 9999;
        }

        function react(emoji) {
            let b = lastMsg.querySelector('.react-badge') || document.createElement('span');
            b.className = 'react-badge'; b.innerText = emoji;
            lastMsg.appendChild(b);
            document.getElementById('reaction-picker').style.display = 'none';
        }

        function goAdmin() {
            if (prompt("Логин:") === "парамов" && prompt("Пароль:") === "565811") {
                document.getElementById('admin-modal').style.display = 'flex';
            } else alert("Доступ запрещен!");
        }

        function adm(type) {
            if (type === 'nft') {
                const n = prompt("Название подарка:");
                if (n) { db.nfts.push(n); save(); alert("NFT выдано!"); }
            } else alert("Успешно накручено!");
        }

        function viewProfile(who) {
            const isMe = who === 'me';
            const data = isMe ? db : { name: active, user: active, num: "Скрыт", av: '', nfts: [] };
            document.getElementById('profile-modal').style.display = 'flex';
            document.getElementById('p-name').innerText = data.name;
            document.getElementById('p-user').innerText = data.user;
            document.getElementById('p-num').innerText = data.num;
            const pav = document.getElementById('p-av');
            if (data.av) { pav.style.backgroundImage = `url(${data.av})`; pav.innerText = ''; }
            else { pav.innerText = data.name[isMe ? 0 : 1].toUpperCase(); pav.style.backgroundImage = 'none'; }
            document.getElementById('p-nfts').innerHTML = isMe ? db.nfts.map(n => `<span style='background:gold; color:black; padding:2px 8px; border-radius:10px; font-size:12px; margin:2px; display:inline-block;'>💎 ${n}</span>`).join('') : '';
        }

        function closeAll(e, f=false) {
            if (f || e.target.className === 'modal') document.querySelectorAll('.modal').forEach(m => m.style.display='none');
            document.getElementById('reaction-picker').style.display = 'none';
        }

        document.addEventListener('click', () => { document.getElementById('reaction-picker').style.display = 'none'; });
    </script>
</body>
</html>
