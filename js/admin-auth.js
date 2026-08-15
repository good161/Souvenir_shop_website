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
    
    // Показываем/скрываем кнопку добавления карточки
    const addCardBtn = document.getElementById('addCardBtn');
    if (addCardBtn) {
        addCardBtn.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Добавляем/удаляем иконки редактирования карточек
    if (isAdmin) {
        document.querySelectorAll('.service-card').forEach(card => {
            if (card.querySelector('.edit-icon')) return;
            
            const editBtn = document.createElement('span');
            editBtn.textContent = '✏️';
            editBtn.className = 'edit-icon';
            editBtn.style.cssText = 'position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:white;border:2px solid #e31e24;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0.7;transition:opacity 0.2s,transform 0.2s,box-shadow 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.1);font-size:0.9rem;z-index:10;line-height:1;padding:0;';
            editBtn.title = 'Редактировать карточку';
            card.appendChild(editBtn);
            
            editBtn.addEventListener('mouseenter', () => {
                editBtn.style.opacity = '1';
                editBtn.style.transform = 'scale(1.1)';
                editBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            
            editBtn.addEventListener('mouseleave', () => {
                editBtn.style.opacity = '0.7';
                editBtn.style.transform = 'scale(1)';
                editBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            });
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = card.getAttribute('data-service');
                window.openCardEditor(cardId);
            });
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
