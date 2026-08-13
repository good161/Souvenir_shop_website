let authToken = localStorage.getItem('authToken') || '';

// Переменные для админа
let isAdmin = false;
let adminRole = '';
let editingProductId = null;
let showArchived = false;

// Проверяем localStorage при загрузке (восстанавливаем сессию)
if (localStorage.getItem('isAdmin') === 'true') {
    isAdmin = true;
}

// ===== ФУНКЦИЯ ОБНОВЛЕНИЯ UI =====
function updateAdminUI() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    // Показываем/скрываем кнопку редактирования каналов
    const editChannelsBtn = document.getElementById('editChannelsBtn');
    if (editChannelsBtn) {
        editChannelsBtn.style.display = isAdmin ? 'inline-block' : 'none';
    }
    
    // Добавляем/удаляем иконки редактирования карточек
    if (isAdmin) {
        document.querySelectorAll('.service-card').forEach(card => {
            const title = card.querySelector('.card-title');
            if (title && !title.querySelector('.edit-icon')) {
                const editBtn = document.createElement('span');
                editBtn.textContent = '✏️';
                editBtn.className = 'edit-icon';
                editBtn.style.cssText = 'font-size:0.9rem;margin-left:0.5rem;cursor:pointer;opacity:0.5;';
                editBtn.title = 'Редактировать карточку';
                title.appendChild(editBtn);
                
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cardEl = card;
                    const cardId = cardEl.getAttribute('data-service');
                    document.getElementById('editCardId').value = cardId;
                    document.getElementById('editCardName').value = title.childNodes[0].textContent.trim();
                    document.getElementById('editCardDescription').value = cardEl.querySelector('.card-description').textContent;
                    document.getElementById('editCardModal').style.display = 'flex';
                });
            }
        });
    } else {
        document.querySelectorAll('.edit-icon').forEach(el => el.remove());
    }
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').classList.remove('show');
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

function restoreSession() {
    const savedToken = localStorage.getItem('authToken');
    const savedRole = localStorage.getItem('adminRole');
    if (savedToken && savedRole) {
        authToken = savedToken;
        isAdmin = true;
        adminRole = savedRole;
        document.getElementById('adminBtn').classList.add('active');
        document.getElementById('showAdminsBtn').style.display = 'block';
        updateAdminUI();
        return true;
    }
    return false;
}

function initAdminAuth() {
    restoreSession();
    
    document.getElementById('loginSubmit').addEventListener('click', async () => {
        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;
        const errorElement = document.getElementById('loginError');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });

            const data = await res.json();

            if (data.success) {
                authToken = data.token;
                isAdmin = true;
                adminRole = data.role;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('adminRole', data.role);
                localStorage.setItem('isAdmin', 'true');
                
                document.getElementById('showAdminsBtn').style.display = 'block';
                document.getElementById('adminBtn').classList.add('active');
                updateAdminUI();
                hideLoginModal();
            } else {
                errorElement.textContent = data.error || 'Неверный логин или пароль';
                errorElement.classList.add('show');
            }
        } catch (err) {
            errorElement.textContent = 'Ошибка сервера';
            errorElement.classList.add('show');
        }
    });
    
    document.getElementById('loginCancel').addEventListener('click', hideLoginModal);
}

document.getElementById('adminBtn').addEventListener('click', () => {
    if (isAdmin) {
        document.getElementById('adminBtn').classList.remove('active');
        isAdmin = false;
        adminRole = '';
        showArchived = false;
        authToken = '';
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminRole');
        document.getElementById('showAdminsBtn').style.display = 'none';
        updateAdminUI();
        if (typeof renderProducts === 'function') renderProducts(products);
    } else {
        showLoginModal();
    }
});

// Вызываем при загрузке
updateAdminUI();

initAdminAuth();
initAdminManagers();
