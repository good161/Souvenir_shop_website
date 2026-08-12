(function() {
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

    async function loadChannels() {
        try {
            const res = await fetch('/api/channels');
            const channels = await res.json();
            const grid = document.getElementById('channelsGrid');
            if (channels.length === 0) { grid.innerHTML = '<span style="color:#94a3b8;">Нет каналов</span>'; return; }
            grid.innerHTML = channels.map(c => `
                <a href="${c.url}" target="_blank" class="channel-icon" title="${c.name}">
                    <img src="https://www.google.com/s2/favicons?domain=${c.url}&sz=32" alt="${c.name}" class="channel-logo">
                    <span class="icon-label">${c.name}</span>
                </a>
            `).join('');
        } catch (err) { document.getElementById('channelsGrid').innerHTML = '<span style="color:#94a3b8;">Ошибка загрузки</span>'; }
    }

    async function loadChannelsForEdit() {
        const res = await fetch('/api/channels');
        const channels = await res.json();
        const list = document.getElementById('channelsEditList');
        list.innerHTML = channels.map((c, i) => `
            <div style="display:flex;gap:0.3rem;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
                <button onclick="moveChannel(${c.id}, ${i}, -1)" ${i === 0 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▲</button>
                <button onclick="moveChannel(${c.id}, ${i}, 1)" ${i === channels.length - 1 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▼</button>
                <input type="text" value="${escapeHtml(c.name)}" onchange="updateChannel(${c.id}, 'name', this.value)" style="flex:1;min-width:100px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                <input type="text" value="${escapeHtml(c.url)}" onchange="updateChannel(${c.id}, 'url', this.value)" style="flex:2;min-width:150px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                <button onclick="deleteChannel(${c.id})" style="background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;padding:0.3rem 0.5rem;font-size:0.7rem;">🗑️</button>
            </div>
        `).join('');
    }

    window.updateChannel = async function(id, field, value) {
        await fetch(`/api/channels/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ [field]: value }) });
        loadChannels();
    };

    window.moveChannel = async function(id, index, direction) {
        const res = await fetch('/api/channels');
        const channels = await res.json();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= channels.length) return;
        [channels[index], channels[newIndex]] = [channels[newIndex], channels[index]];
        for (const ch of channels) {
            await fetch(`/api/channels/${ch.id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ display_order: channels.indexOf(ch) }) });
        }
        loadChannelsForEdit();
        loadChannels();
    };

    window.deleteChannel = async function(id) {
        if (confirm('Удалить канал?')) {
            await fetch(`/api/channels/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            loadChannelsForEdit();
            loadChannels();
        }
    };

    async function loadCards() {
        try {
            const res = await fetch('/api/cards');
            const cards = await res.json();
            cards.forEach(card => {
                const cardEl = document.querySelector(`[data-service="${card.id}"]`);
                if (cardEl) {
                    cardEl.querySelector('.card-title').childNodes[0].textContent = card.name;
                    cardEl.querySelector('.card-description').textContent = card.description;
                    if (card.url) cardEl.setAttribute('data-url', card.url);
                }
            });
        } catch (err) {}
    }

    function bindCardEvents() {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.classList.contains('editing')) return;
                if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
                const url = card.getAttribute('data-url');
                if (url) { showMessage('Загрузка...'); setTimeout(() => { window.location.href = url; }, 500); }
            });
        });
    }

    if (localStorage.getItem('isAdmin') === 'true') {
        document.getElementById('editChannelsBtn').style.display = 'inline-block';
        document.querySelectorAll('.card-title').forEach(title => {
            const editBtn = document.createElement('span');
            editBtn.textContent = '✏️';
            editBtn.style.cssText = 'font-size:0.9rem;margin-left:0.5rem;cursor:pointer;opacity:0.5;';
            editBtn.title = 'Редактировать карточку';
            title.appendChild(editBtn);
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardEl = title.closest('.service-card');
                
                if (cardEl.classList.contains('editing')) {
                    const newName = cardEl.querySelector('.card-title-input').value;
                    const newDesc = cardEl.querySelector('.card-desc-input').value;
                    const newUrl = cardEl.querySelector('.card-url-input').value;
                    const cardId = cardEl.getAttribute('data-service');
                    
                    fetch(`/api/cards/${cardId}`, {
                        method: 'PATCH',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ name: newName, description: newDesc, url: newUrl })
                    }).then(() => loadCards());
                    
                    cardEl.classList.remove('editing');
                    cardEl.style.cursor = 'pointer';
                    editBtn.textContent = '✏️';
                    loadCards();
                    return;
                }
                
                cardEl.classList.add('editing');
                cardEl.style.cursor = 'default';
                editBtn.textContent = '✓';
                
                const name = title.childNodes[0].textContent;
                const desc = cardEl.querySelector('.card-description').textContent;
                const url = cardEl.getAttribute('data-url') || '';
                
                title.innerHTML = `<input type="text" class="card-title-input" value="${escapeHtml(name)}" style="width:100%;font-size:1.6rem;font-weight:700;border:none;border-bottom:2px solid #e31e24;outline:none;background:transparent;">`;
                cardEl.querySelector('.card-description').innerHTML = `<input type="text" class="card-desc-input" value="${escapeHtml(desc)}" style="width:100%;font-size:0.92rem;border:none;border-bottom:2px solid #e31e24;outline:none;background:transparent;color:#4b4b4b;">`;
                
                const linkEl = cardEl.querySelector('.card-link');
                if (linkEl) {
                    linkEl.innerHTML = `<input type="text" class="card-url-input" value="${escapeHtml(url)}" style="width:100%;font-size:0.85rem;border:none;border-bottom:2px solid #e31e24;outline:none;background:transparent;color:#e31e24;">`;
                }
            });
        });
    }

    document.getElementById('editChannelsBtn').addEventListener('click', function() {
        document.getElementById('channelsModal').style.display = 'flex';
        loadChannelsForEdit();
    });
    document.getElementById('closeChannelsBtn').addEventListener('click', () => document.getElementById('channelsModal').style.display = 'none');

    document.getElementById('addChannelBtn').addEventListener('click', async () => {
        const name = document.getElementById('newChannelName').value.trim();
        const url = document.getElementById('newChannelUrl').value.trim();
        if (!name || !url) return alert('Заполните название и URL');
        await fetch('/api/channels', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name, url, icon: '🌐' }) });
        document.getElementById('newChannelName').value = '';
        document.getElementById('newChannelUrl').value = '';
        loadChannelsForEdit();
        loadChannels();
    });

    loadChannels();
    loadCards();
    bindCardEvents();
})();
