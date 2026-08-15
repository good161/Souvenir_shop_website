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
            if (!grid) return;
            if (channels.length === 0) { grid.innerHTML = '<span style="color:#94a3b8;">Нет каналов</span>'; return; }
            grid.innerHTML = channels.map(c => `
                <a href="${c.url}" target="_blank" class="channel-icon" title="${c.name}">
                    <img src="https://www.google.com/s2/favicons?domain=${c.url}&sz=32" alt="${c.name}" class="channel-logo">
                    <span class="icon-label">${c.name}</span>
                </a>
            `).join('');
        } catch (err) { 
            const grid = document.getElementById('channelsGrid');
            if (grid) grid.innerHTML = '<span style="color:#94a3b8;">Ошибка загрузки</span>'; 
        }
    }

    async function loadChannelsForEdit() {
        try {
            const res = await fetch('/api/channels');
            const channels = await res.json();
            const list = document.getElementById('channelsEditList');
            if (!list) {
                console.log('channelsEditList not found');
                return;
            }
            
            if (channels.length === 0) {
                list.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;">Нет каналов</p>';
                return;
            }
            
            list.innerHTML = channels.map((c, i) => `
                <div style="display:flex;gap:0.3rem;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
                    <button onclick="moveChannel(${c.id}, ${i}, -1)" ${i === 0 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▲</button>
                    <button onclick="moveChannel(${c.id}, ${i}, 1)" ${i === channels.length - 1 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▼</button>
                    <input type="text" value="${escapeHtml(c.name)}" onchange="updateChannel(${c.id}, 'name', this.value)" style="flex:1;min-width:100px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                    <input type="text" value="${escapeHtml(c.url)}" onchange="updateChannel(${c.id}, 'url', this.value)" style="flex:2;min-width:150px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                    <button onclick="deleteChannel(${c.id})" style="background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;padding:0.3rem 0.5rem;font-size:0.7rem;">🗑️</button>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error loading channels for edit:', err);
        }
    }

    window.updateChannel = async function(id, field, value) {
        await fetch(`/api/channels/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ [field]: value }) });
        loadChannels();
        loadChannelsForEdit();
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
                    const title = cardEl.querySelector('.card-title');
                    if (title && title.childNodes[0]) {
                        title.childNodes[0].textContent = card.name;
                    }
                    const desc = cardEl.querySelector('.card-description');
                    if (desc) desc.textContent = card.description;
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

    // Динамическое изменение высоты при ручном вводе текста в модальном окне
    const descTextarea = document.getElementById('editCardDescription');
    if (descTextarea) {
        descTextarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    // Объединённая функция редактирования карточки
    window.openCardEditor = function(cardId) {
        const card = document.querySelector(`[data-service="${cardId}"]`);
        if (!card) return;
        
        const title = card.querySelector('.card-title');
        const description = card.querySelector('.card-description');
        
        document.getElementById('editCardId').value = cardId;
        
        // Получаем текст названия без карандаша
        let titleText = '';
        for (const node of title.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                titleText += node.textContent;
            }
        }
        titleText = titleText.trim();
        
        document.getElementById('editCardName').value = titleText;
        document.getElementById('editCardDescription').value = description ? description.textContent : '';
        
        // Показываем модальное окно
        document.getElementById('editCardModal').style.display = 'flex';
        
        // Если это карточка каналов, добавляем секцию редактирования каналов
        if (cardId === 'official-channels') {
            const modalContent = document.querySelector('#editCardModal .channels-modal-content');
            if (modalContent) {
                // Удаляем старую секцию, если есть
                const oldSection = document.getElementById('channelsEditSection');
                if (oldSection) oldSection.remove();
                
                // Создаём новую секцию
                const channelsSection = document.createElement('div');
                channelsSection.id = 'channelsEditSection';
                channelsSection.style.cssText = 'margin-top:1rem;padding-top:1rem;border-top:2px solid #e2e8f0;';
                channelsSection.innerHTML = `
                    <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:0.5rem;color:#1e293b;">Каналы</h4>
                    <div id="channelsEditList"></div>
                    <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">
                        <input type="text" id="newChannelName" placeholder="Название канала" class="channels-input" style="flex:1;min-width:100px;margin-bottom:0;">
                        <input type="text" id="newChannelUrl" placeholder="URL канала" class="channels-input" style="flex:2;min-width:150px;margin-bottom:0;">
                    </div>
                    <button id="addChannelInCardBtn" class="channels-btn primary" style="margin-top:0.5rem;">Добавить канал</button>
                `;
                modalContent.appendChild(channelsSection);
                
                // Загружаем каналы для редактирования
                loadChannelsForEdit();
                
                // Добавляем обработчик для кнопки добавления канала
                document.getElementById('addChannelInCardBtn').addEventListener('click', async () => {
                    const name = document.getElementById('newChannelName').value.trim();
                    const url = document.getElementById('newChannelUrl').value.trim();
                    if (!name || !url) return alert('Заполните название и URL');
                    await fetch('/api/channels', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name, url, icon: '🌐' }) });
                    document.getElementById('newChannelName').value = '';
                    document.getElementById('newChannelUrl').value = '';
                    loadChannelsForEdit();
                    loadChannels();
                });
            }
        } else {
            // Удаляем секцию каналов для других карточек
            const channelsSection = document.getElementById('channelsEditSection');
            if (channelsSection) channelsSection.remove();
        }
    };

    document.getElementById('saveCardBtn').addEventListener('click', async () => {
        const id = document.getElementById('editCardId').value;
        const name = document.getElementById('editCardName').value.trim();
        const description = document.getElementById('editCardDescription').value.trim();
        await fetch(`/api/cards/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ name, description }) });
        document.getElementById('editCardModal').style.display = 'none';
        loadCards();
    });
    
    document.getElementById('closeEditCardBtn').addEventListener('click', () => {
        document.getElementById('editCardModal').style.display = 'none';
        // Удаляем секцию каналов при закрытии
        const channelsSection = document.getElementById('channelsEditSection');
        if (channelsSection) channelsSection.remove();
    });

    loadChannels();
    loadCards();
    bindCardEvents();
})();
