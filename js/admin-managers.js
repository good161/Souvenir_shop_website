function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadAdmins() {
    const res = await fetch('/api/admins', { headers: getAuthHeaders() });
    const admins = await res.json();
    const managerCount = admins.filter(a => a.role === 'manager').length;

    document.getElementById('adminsList').innerHTML = `
        <div style="margin-bottom:1rem;padding:0.5rem;background:#f1f5f9;border-radius:8px;">
            Всего: ${admins.length} | Менеджеров: ${managerCount} | Protoadmin: ${admins.length - managerCount}
        </div>
        ${admins.map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;gap:0.5rem;flex-wrap:wrap;">
            <div style="flex:1;min-width:150px;">
                <div style="font-weight:600;">${escapeHtml(a.full_name || '—')}</div>
                <div style="font-size:0.8rem;color:#64748b;">${escapeHtml(a.username)} (${a.role})</div>
            </div>
            <div style="display:flex;gap:0.3rem;">
                <button class="modal-btn small" onclick="showEditAdminModal(${a.id}, '${escapeHtml(a.full_name || '').replace(/'/g, "\\'")}', '${escapeHtml(a.username).replace(/'/g, "\\'")}', '${a.role}')">✏️</button>
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
    const full_name = document.getElementById('newAdminFullName').value.trim();
    const role = document.getElementById('newAdminRole').value || 'manager';

    if (!username || !password) return alert('Заполните логин и пароль');

    await fetch('/api/admins', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password, role, full_name })
    });
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('newAdminFullName').value = '';
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

function showEditAdminModal(id, fullName, username, role) {
    document.getElementById('editAdminId').value = id;
    document.getElementById('editAdminFullName').value = fullName;
    document.getElementById('editAdminUsername').value = username;
    document.getElementById('editAdminRole').value = role;
    document.getElementById('editAdminModal').classList.add('show');
}

function hideEditAdminModal() {
    document.getElementById('editAdminModal').classList.remove('show');
}

async function saveAdminEdit() {
    const id = document.getElementById('editAdminId').value;
    const full_name = document.getElementById('editAdminFullName').value.trim();
    const username = document.getElementById('editAdminUsername').value.trim();
    const role = document.getElementById('editAdminRole').value;

    if (!username) return alert('Логин обязателен');

    await fetch(`/api/admins/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, full_name, role })
    });
    hideEditAdminModal();
    loadAdmins();
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
    if (typeof updateAdminUI === 'function') updateAdminUI();
}

function showAdminsModal() {
    document.getElementById('adminsModal').classList.add('show');
    loadAdmins();
}

function hideAdminsModal() {
    document.getElementById('adminsModal').classList.remove('show');
}

function initAdminManagers() {
    document.getElementById('showAdminsBtn').addEventListener('click', showAdminsModal);
    document.getElementById('closeAdminsBtn').addEventListener('click', hideAdminsModal);
    document.getElementById('addAdminBtn').addEventListener('click', addAdmin);
    document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
    document.getElementById('closeChangePasswordBtn').addEventListener('click', hideChangePasswordModal);

    const saveEditBtn = document.getElementById('saveEditAdminBtn');
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveAdminEdit);
    const closeEditBtn = document.getElementById('closeEditAdminBtn');
    if (closeEditBtn) closeEditBtn.addEventListener('click', hideEditAdminModal);
}
