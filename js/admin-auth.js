
let authToken = localStorage.getItem('authToken') || '';
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let adminRole = localStorage.getItem('adminRole') || 'user';

// Обновление интерфейса
function updateUI() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (isAdmin && authToken) {
        loginBtn.textContent = '👤 Админ';
        loginBtn.classList.add('active');
        logoutBtn.classList.add('visible');
        logoutBtn.style.display = 'inline-block';
    } else {
        loginBtn.textContent = '🔑 Вход';
        loginBtn.classList.remove('active');
        logoutBtn.classList.remove('visible');
        logoutBtn.style.display = 'none';
    }
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

function restoreSession() {
    const savedToken = localStorage.getItem('authToken');
    const savedRole = localStorage.getItem('adminRole');
    if (savedToken && savedRole) {
        authToken = savedToken;
        isAdmin = true;
        adminRole = savedRole;
        updateUI();
        return true;
    }
    return false;
}

// Toast уведомления
function showToast(message) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}


function initAdminAuth() {
    restoreSession();
    
    // Кнопка входа
    document.getElementById('adminLoginBtn').addEventListener('click', function() {
        if (isAdmin && authToken) {
            // Выход
            isAdmin = false;
            adminRole = 'user';
            authToken = '';
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminRole');
            localStorage.removeItem('isAdmin');
            updateUI();
            showToast('👋 Выход выполнен');
        } else {
            showLoginModal();
        }
    });
    
    // Кнопка выхода (отдельная)
    document.getElementById('adminLogoutBtn').addEventListener('click', function() {
        isAdmin = false;
        adminRole = 'user';
        authToken = '';
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('isAdmin');
        updateUI();
        showToast('👋 Выход выполнен');
    });
    
    // Вход
    document.getElementById('loginSubmit').addEventListener('click', async () => {
        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;
        const errorElement = document.getElementById('loginError');

        if (!login || !password) {
            errorElement.textContent = 'Введите логин и пароль';
            errorElement.style.display = 'block';
            return;
        }

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
                adminRole = data.role || 'admin';
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('adminRole', adminRole);
                localStorage.setItem('isAdmin', 'true');
                
                errorElement.style.display = 'none';
                hideLoginModal();
                updateUI();
                showToast('✅ Вход выполнен');
                
                // Если есть функция обновления - вызываем
                if (typeof updateCategoryButtons === 'function') {
                    updateCategoryButtons();
                }
                if (typeof renderProducts === 'function' && typeof products !== 'undefined') {
                    renderProducts(products);
                }
            } else {
                errorElement.textContent = data.error || 'Неверный логин или пароль';
                errorElement.style.display = 'block';
            }
        } catch (err) {
            errorElement.textContent = 'Ошибка сервера';
            errorElement.style.display = 'block';
            console.error('Login error:', err);
        }
    });
    
    // Отмена
    document.getElementById('loginCancel').addEventListener('click', hideLoginModal);
    
    // Enter
    document.getElementById('passwordInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('loginSubmit').click();
        }
    });
    document.getElementById('loginInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('passwordInput').focus();
        }
    });
}

// Запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminAuth);
} else {
    initAdminAuth();
}
