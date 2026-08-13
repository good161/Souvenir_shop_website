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
        return true;
    }
    return false;
}

function initAdminAuth() {
    // ВАЖНО: здесь удалена строка с addEventListener на клик!

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
                
                errorElement.classList.remove('show');
                document.getElementById('adminBtn').classList.add('active');
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
        // Если админ уже вошел — делаем выход
        document.getElementById('adminBtn').classList.remove('active');
        isAdmin = false;
        adminRole = '';
        showArchived = false;
        authToken = '';
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminRole');
        
        // Обновите интерфейс (если есть функции)
        if (typeof renderProducts === 'function') renderProducts(products);
    } else {
        // Если не вошел — открываем модалку входа
        showLoginModal();
    }
});


initAdminAuth();
initAdminManagers();
