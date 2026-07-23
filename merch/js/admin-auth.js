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
        const errorElement = document.getElementById('loginError');

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
                localStorage.setItem('adminRole', data.role);
                
                errorElement.classList.remove('show');
                document.getElementById('adminBtn').classList.add('active');
                hideLoginModal();
                
            } else {

                errorElement.textContent = data.error || 'Неверный логин или пароль';
                errorElement.classList.add('show');
            }
        } catch (err) {
            console.error(err);
            errorElement.textContent = 'Ошибка сервера. Попробуйте позже.';
            errorElement.classList.add('show');
        }
    });
}
