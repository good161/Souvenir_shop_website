(function() {
    const toast = document.getElementById('toastMsg');
    const PROTECTED_CARDS = ['merch', 'official-channels', 'it-services', 'bots'];
    
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
        if (!text) return '';
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
                <a href="${escapeHtml(c.url)}" target="_blank" class="channel-icon" title="${escapeHtml(c.name)}">
                    <img src="https://www.google.com/s2/favicons?domain=${c.url}&sz=32" alt="${escapeHtml(c.name)}" class="channel-logo">
                    <span class="icon-label">${escapeHtml(c.name)}</span>
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
            if (!list) return;
            
            if (channels.length === 0) {
                list.innerHTML = '<span style="color:#94a3b8;">Нет каналов</span>';
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
            console.error('Error loading channels:', err);
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
            if (!res.ok) throw new Error('Failed to load cards');
            const cards = await res.json();
            const grid = document.getElementById('servicesGrid');
            if (!grid) return;
            
            grid.innerHTML = cards.map(card => {
                if (card.id === 'official-channels') {
                    return `
                        <div class="service-card" data-service="${card.id}">
                            <div class="card-accent"></div>
                            <div class="card-content">
                                <div class="card-title">${escapeHtml(card.name)}</div>
                                <div class="channels-grid" id="channelsGrid">Загрузка...</div>
                            </div>
                        </div>`;
                } else {
                    return `
                        <div class="service-card" data-service="${card.id}" data-url="${escapeHtml(card.url || '')}">
                            <div class="card-accent"></div>
                            <div class="card-content">
                                <div class="card-title">${escapeHtml(card.name)}</div>
                                <div class="card-description">${escapeHtml(card.description || '')}</div>
                                <span class="card-link">Перейти <span>→</span></span>
                            </div>
                        </div>`;
                }
            }).join('');
            
            loadChannels();
            bindCardEvents();
            
            if (typeof updateAdminUI === 'function') {
                updateAdminUI();
            }
            
            const addCardBtn = document.getElementById('addCardBtn');
            if (addCardBtn) {
                addCardBtn.style.display = localStorage.getItem('isAdmin') === 'true' ? 'block' : 'none';
            }
        } catch (err) {
            console.error('Error loading cards:', err);
        }
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

    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    const nameTextarea = document.getElementById('editCardName');
    if (nameTextarea) {
        nameTextarea.style.resize = 'none';
        nameTextarea.style.overflow = 'hidden';
        nameTextarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }

    const descTextarea = document.getElementById('editCardDescription');
    if (descTextarea) {
        descTextarea.style.resize = 'none';
        descTextarea.style.overflow = 'hidden';
        descTextarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }

    window.openCardEditor = function(cardId) {
        const card = document.querySelector(`[data-service="${cardId}"]`);
        if (!card) return;
        
        const title = card.querySelector('.card-title');
        const description = card.querySelector('.card-description');
        
        document.getElementById('editCardId').value = cardId;
        
        let titleText = '';
        if (title) {
            for (const node of title.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    titleText += node.textContent;
                }
            }
        }
        
        const nameField = document.getElementById('editCardName');
        const descField = document.getElementById('editCardDescription');
        
        nameField.value = titleText.trim();
        descField.value = description ? description.textContent : '';
        
        setTimeout(() => {
            autoResizeTextarea(nameField);
            autoResizeTextarea(descField);
        }, 50);
        
        const channelsSection = document.getElementById('channelsEditSection');
        const deleteBtn = document.getElementById('deleteCardBtn');
        
        if (cardId === 'official-channels') {
            channelsSection.style.display = 'block';
            loadChannelsForEdit();
        } else {
            channelsSection.style.display = 'none';
        }
        
        // Показываем кнопку удаления только для незащищённых карточек
        if (deleteBtn) {
            if (PROTECTED_CARDS.includes(cardId)) {
                deleteBtn.style.display = 'none';
            } else {
                deleteBtn.style.display = 'inline-block';
            }
        }
        
        document.getElementById('editCardModal').style.display = 'flex';
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
    });

    // Обработчик удаления карточки
    document.getElementById('deleteCardBtn').addEventListener('click', async () => {
        const id = document.getElementById('editCardId').value;
        
        if (PROTECTED_CARDS.includes(id)) {
            showMessage('Эту карточку удалить нельзя');
            return;
        }
        
        if (!confirm('Удалить карточку?')) return;
        
        try {
            const res = await fetch(`/api/cards/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete card');
            document.getElementById('editCardModal').style.display = 'none';
            loadCards();
            showMessage('Карточка удалена');
        } catch (e) {
            showMessage('Ошибка удаления');
        }
    });

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

    // Обработчики для добавления карточки
    document.getElementById('showAddCardModal').addEventListener('click', () => {
        document.getElementById('newCardName').value = '';
        document.getElementById('newCardDescription').value = '';
        document.getElementById('addCardModal').style.display = 'flex';
    });

    document.getElementById('closeAddCardBtn').addEventListener('click', () => {
        document.getElementById('addCardModal').style.display = 'none';
    });

    document.getElementById('createCardBtn').addEventListener('click', async () => {
        const name = document.getElementById('newCardName').value.trim();
        const description = document.getElementById('newCardDescription').value.trim();
        
        if (!name) return alert('Введите название карточки');
        
        // Получаем все карточки для генерации следующего ID и display_order
        const res = await fetch('/api/cards');
        const cards = await res.json();
        
        // Находим максимальный номер среди карточек вида card-N
        let maxNum = 0;
        cards.forEach(card => {
            const match = card.id.match(/^card-(\d+)$/);
            if (match) {
                maxNum = Math.max(maxNum, parseInt(match[1]));
            }
        });
        
        // Находим максимальный display_order для вставки в конец
        const maxOrder = cards.reduce((max, card) => Math.max(max, card.display_order || 0), 0);
        
        const newId = `card-${maxNum + 1}`;
        const url = `services.html?id=${newId}`;
        const displayOrder = maxOrder + 1;
        
        try {
            const createRes = await fetch('/api/cards', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: newId, name, description, url, display_order: displayOrder })
            });
            if (!createRes.ok) throw new Error('Failed to create card');
            document.getElementById('addCardModal').style.display = 'none';
            loadCards();
            showMessage('Карточка добавлена');
        } catch (e) {
            showMessage('Ошибка добавления');
        }
    });

    loadCards();
})();
