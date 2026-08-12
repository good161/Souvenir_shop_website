const params = new URLSearchParams(window.location.search);
const cardId = params.get('id') || 'it-services';

async function init() {
    const res = await fetch(`/api/cards`);
    const cards = await res.json();
    const card = cards.find(c => c.id === cardId);
    if (card) {
        document.getElementById('pageTitle').textContent = card.name;
        document.title = card.name + ' ЧГУ';
    }
    loadLinks();
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadLinks() {
    try {
        const res = await fetch(`/api/card-links/${cardId}`);
        const links = await res.json();
        const list = document.getElementById('linksList');
        
        if (links.length === 0) {
            list.innerHTML = '<div class="no-results">Нет ссылок</div>';
            return;
        }
        
        list.innerHTML = `
            <div class="links-grid">
                ${links.map(l => `
                    <a href="${l.url}" target="_blank" class="service-link-card">
                        <div class="card-accent"></div>
                        <div class="card-content">
                            <div class="card-title">${l.name}</div>
                            ${l.description ? `<div class="card-description">${l.description}</div>` : ''}
                            <span class="card-link">Перейти <span>→</span></span>
                        </div>
                    </a>
                `).join('')}
            </div>`;
    } catch (err) {
        document.getElementById('linksList').innerHTML = '<div class="no-results">Ошибка загрузки</div>';
    }
}

async function loadLinksForEdit() {
    const res = await fetch(`/api/card-links/${cardId}`);
    const links = await res.json();
    const list = document.getElementById('linksEditList');
    list.innerHTML = links.map((l, i) => `
        <div style="display:flex;gap:0.3rem;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
            <button onclick="moveLink(${l.id}, ${i}, -1)" ${i === 0 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▲</button>
            <button onclick="moveLink(${l.id}, ${i}, 1)" ${i === links.length - 1 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▼</button>
            <input type="text" value="${escapeHtml(l.name)}" onchange="updateLink(${l.id}, 'name', this.value)" style="flex:1;min-width:80px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
            <input type="text" value="${escapeHtml(l.url)}" onchange="updateLink(${l.id}, 'url', this.value)" style="flex:2;min-width:120px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
            <input type="text" value="${escapeHtml(l.description || '')}" onchange="updateLink(${l.id}, 'description', this.value)" style="flex:1;min-width:80px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
            <button onclick="deleteLink(${l.id})" style="background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;padding:0.3rem 0.5rem;font-size:0.7rem;">🗑️</button>
        </div>
    `).join('');
}

window.updateLink = async function(id, field, value) {
    await fetch(`/api/card-links/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ [field]: value }) });
    loadLinks();
};

window.moveLink = async function(id, index, direction) {
    const res = await fetch(`/api/card-links/${cardId}`);
    const links = await res.json();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= links.length) return;
    [links[index], links[newIndex]] = [links[newIndex], links[index]];
    for (const l of links) {
        await fetch(`/api/card-links/${l.id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ display_order: links.indexOf(l) }) });
    }
    loadLinksForEdit();
    loadLinks();
};

window.deleteLink = async function(id) {
    if (confirm('Удалить ссылку?')) {
        await fetch(`/api/card-links/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        loadLinksForEdit();
        loadLinks();
    }
};

if (localStorage.getItem('isAdmin') === 'true') {
    document.getElementById('editLinksBtn').style.display = 'inline-block';
}

document.getElementById('editLinksBtn').addEventListener('click', () => {
    document.getElementById('linksModal').style.display = 'flex';
    loadLinksForEdit();
});
document.getElementById('closeLinksBtn').addEventListener('click', () => document.getElementById('linksModal').style.display = 'none');
document.getElementById('addLinkBtn').addEventListener('click', async () => {
    const name = document.getElementById('newLinkName').value.trim();
    const url = document.getElementById('newLinkUrl').value.trim();
    const description = document.getElementById('newLinkDesc').value.trim();
    if (!name || !url) return alert('Заполните название и URL');
    await fetch('/api/card-links', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ card_id: cardId, name, url, description }) });
    document.getElementById('newLinkName').value = '';
    document.getElementById('newLinkUrl').value = '';
    document.getElementById('newLinkDesc').value = '';
    loadLinksForEdit();
    loadLinks();
});

init();
