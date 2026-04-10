// Функция перехода на страницу описания
function goToGamePage(id, name, img) {
    console.log("Переход к игре:", name);
    // Сохраняем данные, чтобы вторая страница их подхватила
    localStorage.setItem('selectedGameId', id);
    localStorage.setItem('selectedGameName', name);
    localStorage.setItem('selectedGameImg', img);
    
    // Переходим
    window.location.href = 'game_page.html';
}

// Функции модального окна
function openFavoritesModal() {
    const modal = document.getElementById("favModal");
    const list = document.getElementById("favoritesList");
    const favs = JSON.parse(localStorage.getItem('igrogus_favs')) || [];
    
    list.innerHTML = "";
    if (favs.length === 0) {
        list.innerHTML = "<p>Тут пока пусто... 🐥</p>";
    } else {
        favs.forEach(game => {
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #333;">
                    <span>${game}</span>
                    <button class="fav-item-btn" onclick="window.location.href='game_page.html'" style="background:#ffc107; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Играть</button>
                </div>`;
        });
    }
    modal.style.display = "block";
}

function closeFavoritesModal() {
    document.getElementById("favModal").style.display = "none";
}

// Закрытие при клике на темный фон
window.onclick = function(event) {
    if (event.target == document.getElementById("favModal")) {
        closeFavoritesModal();
    }
    // Функция отправки лайка/дизлайка на сервер
async function sendAction(actionType) {
    const id = localStorage.getItem('igrogus_current_id'); // Получаем ID текущей игры
    if (!id) return alert("Ошибка: ID игры не найден");

    try {
        const res = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: id, action: actionType })
        });
        const stats = await res.json();
        
        // Обновляем цифры на странице сразу после клика
        if (actionType === 'likes') document.getElementById('likeCount').innerText = stats.likes;
        if (actionType === 'dislikes') document.getElementById('dislikeCount').innerText = stats.dislikes;
    } catch (err) {
        console.error("Сервер не ответил. Ты запустил server.py?", err);
    }
}
// Эта функция срабатывает при нажатии на лайк или дизлайк
async function sendAction(type) {
    const gameId = localStorage.getItem('igrogus_current_id');
    
    // Отправляем запрос на сервер (server.py)
    const response = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, action: type })
    });

    const data = await response.json();
    
    // Обновляем числа на странице без перезагрузки
    document.getElementById('likeCount').innerText = data.likes;
    document.getElementById('dislikeCount').innerText = data.dislikes;
}

// Эта функция должна запускаться при открытии страницы, чтобы подтянуть старые лайки из базы
async function loadStats() {
    const gameId = localStorage.getItem('igrogus_current_id');
    const response = await fetch(`/api/game/${gameId}`);
    const data = await response.json();
    
    if (document.getElementById('likeCount')) {
        document.getElementById('likeCount').innerText = data.likes || 0;
        document.getElementById('dislikeCount').innerText = data.dislikes || 0;
        document.getElementById('visitCount').innerText = data.visits || 0;
    }
}

// Запускаем загрузку статы при старте страницы
window.onload = loadStats;
}
// --- ПУБЛИЧНЫЕ ЛАЙКИ ---

// Функция, которая слушает базу и меняет цифры на странице
function syncVotes() {
    const gameId = localStorage.getItem('igrogus_current_id') || 'game1';
    
    // Подключаемся к ветке этой игры в базе
    db.ref('votes/' + gameId).on('value', (snapshot) => {
        const data = snapshot.val() || { likes: 0, dislikes: 0 };
        
        // Обновляем текст в кнопках
        if (document.getElementById('likeCount')) {
            document.getElementById('likeCount').innerText = data.likes || 0;
            document.getElementById('dislikeCount').innerText = data.dislikes || 0;
        }
    });
}

// Функция для клика по кнопке
function handleVote(type) {
    const gameId = localStorage.getItem('igrogus_current_id') || 'game1';
    const voteRef = db.ref('votes/' + gameId + '/' + type);
    
    // Плюсуем 1 в общую базу Google
    voteRef.transaction((current) => (current || 0) + 1);
}

// --- ЛИЧНЫЕ ЛЮБИМЫЕ ИГРЫ (LocalStorage) ---

function toggleFavorite() {
    const name = localStorage.getItem('igrogus_current_name');
    const img = localStorage.getItem('igrogus_current_img');
    
    let favs = JSON.parse(localStorage.getItem('igrogus_favs')) || [];
    const exists = favs.find(g => g.name === name);
    
    if (!exists) {
        favs.push({ name: name, img: img });
        alert("Игра сохранена в 'Мои игры'! ⭐");
    } else {
        alert("Игра уже там!");
    }
    localStorage.setItem('igrogus_favs', JSON.stringify(favs));
}

// Запускаем всё, как только страница открылась
document.addEventListener('DOMContentLoaded', () => {
    if (typeof db !== 'undefined') {
        syncVotes();
    }
});