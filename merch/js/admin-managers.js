async function loadAdmins() {
    const res = await fetch('/api/admins');
    const admins = await res.json();
    const managerCount = admins.filter(a => a.role === 'manager').length;
    
    document.getElementById('adminsList').innerHTML = `
        <div style="margin-bottom:1rem;padding:0.5rem;background:#f1f5f9;border-radius:8px;">
            Всего: ${admins.length} | Менеджеров: ${managerCount} | Protoadmin: ${admins.length - managerCount}
        </div>
        ${admins.map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;">
            <span>${a.username} (${a.role})</span>
            ${a.role !== 'Protoadmin' ? `<button class="modal-btn small danger" onclick="deleteAdmin(${a.id})">🗑️</button>` : ''}
        </div>
        `).join('')}
    `;
}

async function addAdmin() {
    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value.trim();
    const role = document.getElementById('newAdminRole').value;
    if (!username || !password) return alert('Заполните все поля');
    await fetch('/api/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, role }) });
    document.getElementById('newAdminUsername').value = '';
    document.getElementById('newAdminPassword').value = '';
    loadAdmins();
}

async function deleteAdmin(id) {
    if (confirm('Удалить администратора?')) {
        await fetch(`/api/admins/${id}`, { method: 'DELETE' });
        loadAdmins();
    }
}

function showAdminsModal() { document.getElementById('adminsModal').classList.add('show'); loadAdmins(); }
function hideAdminsModal() { document.getElementById('adminsModal').classList.remove('show'); }

function initAdminManagers() {
    document.getElementById('showAdminsBtn').addEventListener('click', showAdminsModal);
    document.getElementById('closeAdminsBtn').addEventListener('click', hideAdminsModal);
    document.getElementById('addAdminBtn').addEventListener('click', addAdmin);
}
