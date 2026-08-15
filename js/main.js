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
                if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a') || e.target.closest('.edit-icon')) return;
                const url = card.getAttribute('data-url');
                if (url) { showMessage('Загрузка...'); setTimeout(() => { window.location.href = url; }, 500); }
            });
        });
    }

    function addEditIcons() {
        document.querySelectorAll('.service-card').forEach(card => {
            // Проверяем, нет ли уже карандаша
            const title = card.querySelector('.card-title');
            if (!title || title.querySelector('.edit-icon')) return;
            
            const editBtn = document.createElement('span');
            editBtn.textContent = '✏️';
            editBtn.className = 'edit-icon';
            editBtn.style.cssText = 'font-size:0.9rem;margin-left:0.5rem;cursor:pointer;opacity:0.5;transition:opacity 0.2s;display:inline-block;vertical-align:middle;';
            editBtn.title = 'Редактировать карточку';
            
            editBtn.addEventListener('mouseenter', () => editBtn.style.opacity = '1');
            editBtn.addEventListener('mouseleave', () => editBtn.style.opacity = '0.5');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = card.getAttribute('data-service');
                
                document.getElementById('editCardId').value = cardId;
                document.getElementById('editCardName').value = title.childNodes[0].textContent.trim();
                document.getElementById('editCardDescription').value = card.querySelector('.card-description').textContent;
                document.getElementById('editCardModal').style.display = 'flex';
            });
            
            title.appendChild(editBtn);
        });
    }

    if (localStorage.getItem('isAdmin') === 'true') {
        // Показываем кнопку редактирования каналов
        const editChannelsBtn = document.getElementById('editChannelsBtn');
        if (editChannelsBtn) editChannelsBtn.style.display = 'inline-block';
        
        // Добавляем карандаши на карточки
        addEditIcons();
    }

    // Динамическое изменение высоты при ручном вводе текста в модальном окне
    const descTextarea = document.getElementById('editCardDescription');
    if (descTextarea) {
        descTextarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
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

    document.getElementById('saveCardBtn').addEventListener('click', async () => {
        const id = document.getElementById('editCardId').value;
        const name = document.getElementById('editCardName').value.trim();
        const description = document.getElementById('editCardDescription').value.trim();
        await fetch(`/api/cards/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ name, description }) });
        document.getElementById('editCardModal').style.display = 'none';
        loadCards();
    });
    document.getElementById('closeEditCardBtn').addEventListener('click', () => document.getElementById('editCardModal').style.display = 'none');

    loadChannels();
    loadCards();
    bindCardEvents();
})();
