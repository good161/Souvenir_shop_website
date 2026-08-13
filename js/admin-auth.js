
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// Обновление интерфейса
function updateUI() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (isAdmin) {
        loginBtn.textContent = '👤 Админ';
        loginBtn.classList.add('active');
        logoutBtn.classList.add('visible');
    } else {
        loginBtn.textContent = '🔑 Вход';
        loginBtn.classList.remove('active');
        logoutBtn.classList.remove('visible');
    }
}

// Toast уведомления
function showToast(message) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Показать модалку входа
function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// Скрыть модалку входа
function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

// Обработчик входа
function handleLogin() {
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    const error = document.getElementById('loginError');
    
    if (login === 'admin' && password === 'admin') {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        error.style.display = 'none';
        hideLoginModal();
        updateUI();
        showToast('✅ Вход выполнен');
    } else {
        error.textContent = 'Неверный логин или пароль';
        error.style.display = 'block';
    }
}

// Обработчик выхода
function handleLogout() {
    isAdmin = false;
    localStorage.removeItem('isAdmin');
    updateUI();
    showToast('👋 Выход выполнен');
}

// ИНИЦИАЛИЗАЦИЯ

document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    
    // Кнопка входа
    document.getElementById('adminLoginBtn').addEventListener('click', function() {
        if (isAdmin) {
            handleLogout();
        } else {
            showLoginModal();
        }
    });
    
    // Кнопка выхода
    document.getElementById('adminLogoutBtn').addEventListener('click', handleLogout);
    
    // Кнопка входа в модалке
    document.getElementById('loginSubmit').addEventListener('click', handleLogin);
    
    // Кнопка отмены
    document.getElementById('loginCancel').addEventListener('click', hideLoginModal);
    
    // Enter на полях
    document.getElementById('passwordInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('loginInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('passwordInput').focus();
    });
});
