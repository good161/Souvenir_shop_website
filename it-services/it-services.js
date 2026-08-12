(function() {
    const cardId = 'it-services';
    const toast = document.getElementById('toastMsg');

    function showMessage(text, duration = 2300) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, duration);
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

    async function loadServices() {
        try {
            const res = await fetch(`/api/card-links/${cardId}`);
            const links = await res.json();
            const grid = document.getElementById('servicesGrid');
            
            if (links.length === 0) {
                grid.innerHTML = '<div class="no-results">Нет сервисов</div>';
                return;
            }
            
            grid.innerHTML = links.map(l => `
                <div class="service-card" data-url="${l.url}">
                    <div class="card-accent"></div>
                    <div class="card-content">
                        <div class="card-title">${escapeHtml(l.name)}</div>
                        ${l.description ? `<div class="card-description">${escapeHtml(l.description)}</div>` : ''}
                        <span class="card-link">Перейти <span class="arrow">→</span></span>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.service-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.card-link')) return;
                    const url = card.getAttribute('data-url');
                    if (url) window.open(url, '_blank');
                });
            });

            document.querySelectorAll('.card-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const url = link.closest('.service-card').getAttribute('data-url');
                    if (url) window.location.href = url;
                });
            });
        } catch (err) {
            document.getElementById('servicesGrid').innerHTML = '<div class="no-results">Ошибка загрузки</div>';
        }
    }

    async function loadServicesForEdit() {
        const res = await fetch(`/api/card-links/${cardId}`);
        const links = await res.json();
        const list = document.getElementById('servicesEditList');
        list.innerHTML = links.map((l, i) => `
            <div style="display:flex;gap:0.3rem;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
                <button onclick="moveService(${l.id}, ${i}, -1)" ${i === 0 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▲</button>
                <button onclick="moveService(${l.id}, ${i}, 1)" ${i === links.length - 1 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▼</button>
                <input type="text" value="${escapeHtml(l.name)}" onchange="updateService(${l.id}, 'name', this.value)" style="flex:1;min-width:80px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                <input type="text" value="${escapeHtml(l.url)}" onchange="updateService(${l.id}, 'url', this.value)" style="flex:2;min-width:120px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                <input type="text" value="${escapeHtml(l.description || '')}" onchange="updateService(${l.id}, 'description', this.value)" style="flex:1;min-width:80px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                <button onclick="deleteService(${l.id})" style="background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;padding:0.3rem 0.5rem;font-size:0.7rem;">🗑️</button>
            </div>
        `).join('');
    }

    window.updateService = async function(id, field, value) {
        await fetch(`/api/card-links/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ [field]: value }) });
        loadServices();
    };

    window.moveService = async function(id, index, direction) {
        const res = await fetch(`/api/card-links/${cardId}`);
        const links = await res.json();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= links.length) return;
        [links[index], links[newIndex]] = [links[newIndex], links[index]];
        for (const l of links) {
            await fetch(`/api/card-links/${l.id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ display_order: links.indexOf(l) }) });
        }
        loadServicesForEdit();
        loadServices();
    };

    window.deleteService = async function(id) {
        if (confirm('Удалить сервис?')) {
            await fetch(`/api/card-links/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            loadServicesForEdit();
            loadServices();
        }
    };

    if (localStorage.getItem('isAdmin') === 'true') {
        document.getElementById('editServicesBtn').style.display = 'block';
    }

    document.getElementById('editServicesBtn').addEventListener('click', () => {
        document.getElementById('servicesModal').style.display = 'flex';
        loadServicesForEdit();
    });
    document.getElementById('closeServicesBtn').addEventListener('click', () => document.getElementById('servicesModal').style.display = 'none');
    document.getElementById('addServiceBtn').addEventListener('click', async () => {
        const name = document.getElementById('newServiceName').value.trim();
        const url = document.getElementById('newServiceUrl').value.trim();
        const description = document.getElementById('newServiceDesc').value.trim();
        if (!name || !url) return alert('Заполните название и URL');
        await fetch('/api/card-links', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ card_id: cardId, name, url, description }) });
        document.getElementById('newServiceName').value = '';
        document.getElementById('newServiceUrl').value = '';
        document.getElementById('newServiceDesc').value = '';
        loadServicesForEdit();
        loadServices();
    });

    loadServices();
})();
