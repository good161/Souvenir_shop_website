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
                <button class="modal-btn small" onclick="showEditAdminModal(${a.id}, '${escapeHtml(a.full_name || '').replace(/'/g, "\\'")}', '${escapeHtml(a.username).replace(/'/g, "\\'")}', '${a.role}', ${JSON.stringify(a.permissions || { main: true, merch: true }).replace(/"/g, '&quot;')})">✏️</button>
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
    const permissions = {
        main: document.getElementById('newPermMain').checked,
        merch: document.getElementById('newPermMerch').checked
    };

    if (!username || !password) return alert('Заполните логин и пароль');

    await fetch('/api/admins', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password, role, full_name, permissions })
    });
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('newAdminFullName').value = '';
    document.getElementById('newPermMain').checked = true;
    document.getElementById('newPermMerch').checked = true;
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

function showEditAdminModal(id, fullName, username, role, permissions) {
    if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions); } catch (e) { permissions = { main: true, merch: true }; }
    }
    permissions = permissions || { main: true, merch: true };

    document.getElementById('editAdminId').value = id;
    document.getElementById('editAdminFullName').value = fullName;
    document.getElementById('editAdminUsername').value = username;
    document.getElementById('editAdminRole').value = role;
    document.getElementById('editAdminPassword').value = '';
    document.getElementById('editPermMain').checked = !!permissions.main;
    document.getElementById('editPermMerch').checked = !!permissions.merch;

    const permsBlock = document.getElementById('editAdminPermissions');
    permsBlock.style.display = role === 'Protoadmin' ? 'none' : 'flex';

    document.getElementById('editAdminRole').addEventListener('change', function() {
        permsBlock.style.display = this.value === 'Protoadmin' ? 'none' : 'flex';
    });

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
    const password = document.getElementById('editAdminPassword').value.trim();
    const permissions = {
        main: document.getElementById('editPermMain').checked,
        merch: document.getElementById('editPermMerch').checked
    };

    if (!username) return alert('Логин обязателен');

    const payload = { username, full_name, role, permissions };
    if (password) payload.password = password;

    await fetch(`/api/admins/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    hideEditAdminModal();
    loadAdmins();
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

    const saveEditBtn = document.getElementById('saveEditAdminBtn');
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveAdminEdit);
    const closeEditBtn = document.getElementById('closeEditAdminBtn');
    if (closeEditBtn) closeEditBtn.addEventListener('click', hideEditAdminModal);
}
