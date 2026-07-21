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
    document.getElementById('loginSubmit').addEventListener('click', () => {
        const login = document.getElementById('loginInput').value;
        const password = document.getElementById('passwordInput').value;
        
        if (login === 'admin' && password === 'admin') {
            isAdmin = true;
            adminRole = 'Protoadmin';
            document.getElementById('adminBtn').classList.add('active');
            hideLoginModal();
            updateCategoryButtons();
            renderProducts(products);
        } else {
            document.getElementById('loginError').textContent = 'Неверный логин или пароль';
            document.getElementById('loginError').classList.add('show');
        }
    });
    
    document.getElementById('loginCancel').addEventListener('click', hideLoginModal);
}
