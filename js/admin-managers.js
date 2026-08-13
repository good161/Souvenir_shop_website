async function loadAdmins() {
    const res = await fetch('/api/admins', { headers: getAuthHeaders() });
    const admins = await res.json();
    const managerCount = admins.filter(a => a.role === 'manager').length;
    
    document.getElementById('adminsList').innerHTML = `
        <div style="margin-bottom:1rem;padding:0.5rem;background:#f1f5f9;border-radius:8px;">
            Всего: ${admins.length} | Менеджеров: ${managerCount} | Protoadmin: ${admins.length - managerCount}
        </div>
        ${admins.map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;">
            <span>${a.username} (${a.role})</span>
            <div style="display:flex;gap:0.3rem;">
                ${a.role === 'Protoadmin' ? `<button class="modal-btn small" onclick="showChangePasswordModal()">🔑</button>` : ''}
                ${a.role !== 'Protoadmin' ? `<button class="modal-btn small danger" onclick="deleteAdmin(${a.id})">🗑️</button>` : ''}
            </div>
        </div>
        `).join('')}
    `;
}

async function addAdmin() {
    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value.trim();
    const role = 'manager';
    
    if (!username || !password) return alert('Заполните все поля');
    
    await fetch('/api/admins', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password, role })
    });
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    loadAdmins();
}

async function deleteAdmin(id) {
    if (confirm('Удалить администратора?')) {
        await fetch(`/api/admins/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        loadAdmins();
    }
}

function showChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('show');
    document.getElementById('newPassword').value = '';
}

function hideChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('show');
}

async function changePassword() {
    const newPassword = document.getElementById('newPassword').value.trim();
    if (!newPassword) return alert('Введите новый пароль');
    
    await fetch('/api/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: newPassword })
    });
    
    hideChangePasswordModal();
    alert('Пароль изменён. Войдите заново.');
    isAdmin = false;
    adminRole = '';
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminRole');
    authToken = '';
    updateUI()
}

function showAdminsModal() { document.getElementById('adminsModal').classList.add('show'); loadAdmins(); }
function hideAdminsModal() { document.getElementById('adminsModal').classList.remove('show'); }

function initAdminManagers() {
    document.getElementById('showAdminsBtn').addEventListener('click', showAdminsModal);
    document.getElementById('closeAdminsBtn').addEventListener('click', hideAdminsModal);
    document.getElementById('addAdminBtn').addEventListener('click', addAdmin);
    document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
    document.getElementById('closeChangePasswordBtn').addEventListener('click', hideChangePasswordModal);
}
