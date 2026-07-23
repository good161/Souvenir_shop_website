function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').classList.remove('show');
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}

function initAdminAuth() {
    document.getElementById('loginSubmit').addEventListener('click', async () => {
        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            
            const data = await res.json();
            
            if (data.success) {
                isAdmin = true;
                adminRole = data.role;
                localStorage.setItem('isAdmin', 'true');
                document.getElementById('adminBtn').classList.add('active');
                hideLoginModal();
                updateCategoryButtons();
                renderProducts(products);
            } else {
                document.getElementById('loginError').textContent = data.error || 'Неверный логин или пароль';
                document.getElementById('loginError').classList.add('show');
            }
        } catch (err) {
            document.getElementById('loginError').textContent = 'Ошибка сервера';
            document.getElementById('loginError').classList.add('show');
        }
    });
    
    document.getElementById('loginCancel').addEventListener('click', hideLoginModal);
}
