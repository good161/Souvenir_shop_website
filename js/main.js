(function() {
    const toast = document.getElementById('toastMsg');
    let toastTimeout = null;
    
    function showMessage(text, duration = 2300) {
        if (!toast) return;
        clearTimeout(toastTimeout);
        toast.textContent = text;
        toast.classList.add('show');
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, duration);
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

    function escapeValueAttr(text) {
        if (!text) return '';
        return String(text).replace(/"/g, '&quot;');
    }

    async function loadChannels() {
        try {
            const res = await fetch('/api/channels');
            if (!res.ok) throw new Error('Network response was not ok');
            const channels = await res.json();
            const grid = document.getElementById('channelsGrid');
            if (!grid) return;
            if (channels.length === 0) { 
                grid.innerHTML = '<span style="color:#94a3b8;">Нет каналов</span>'; 
                return; 
            }
            
            grid.innerHTML = channels.map(c => `
                <a href="${escapeValueAttr(c.url)}" target="_blank" class="channel-icon" title="${escapeHtml(c.name)}">
                    <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(c.url)}&sz=32" alt="${escapeHtml(c.name)}" class="channel-logo">
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
            if (!res.ok) throw new Error('Network response was not ok');
            const channels = await res.json();
            const list = document.getElementById('channelsEditList');
            if (!list) {
                console.error('channelsEditList not found');
                return;
            }
            
            if (channels.length === 0) {
                list.innerHTML = '<span style="color:#94a3b8;">Нет каналов</span>';
                return;
            }
            
            list.innerHTML = channels.map((c, i) => `
                <div style="display:flex;gap:0.3rem;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">
                    <button onclick="moveChannel(${c.id}, ${i}, -1)" ${i === 0 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▲</button>
                    <button onclick="moveChannel(${c.id}, ${i}, 1)" ${i === channels.length - 1 ? 'disabled' : ''} style="background:#94a3b8;color:white;border:none;border-radius:4px;cursor:pointer;padding:0.2rem 0.4rem;font-size:0.7rem;">▼</button>
                    <input type="text" value="${escapeValueAttr(c.name)}" onchange="updateChannel(${c.id}, 'name', this.value)" style="flex:1;min-width:100px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                    <input type="text" value="${escapeValueAttr(c.url)}" onchange="updateChannel(${c.id}, 'url', this.value)" style="flex:2;min-width:150px;padding:0.4rem;border:2px solid #e2e8f0;border-radius:6px;font-size:0.8rem;">
                    <button onclick="deleteChannel(${c.id})" style="background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;padding:0.3rem 0.5rem;font-size:0.7rem;">🗑️</button>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error loading channels for edit:', err);
        }
    }

    window.updateChannel = async function(id, field, value) {
        try {
            const res = await fetch(`/api/channels/${id}`, { 
                method: 'PATCH', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ [field]: value }) 
            });
            if (!res.ok) throw new Error('Update failed');
            await Promise.all([loadChannels(), loadChannelsForEdit()]);
        } catch (e) { 
            showMessage('Ошибка обновления'); 
        }
    };

    window.moveChannel = async function(id, index, direction) {
        try {
            const res = await fetch('/api/channels');
            if (!res.ok) return;
            const channels = await res.json();
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= channels.length) return;
            
            [channels[index], channels[newIndex]] = [channels[newIndex], channels[index]];
            
            const promises = channels.map((ch, idx) => 
                fetch(`/api/channels/${ch.id}`, { 
                    method: 'PATCH', 
                    headers: getAuthHeaders(), 
                    body: JSON.stringify({ display_order: idx }) 
                })
            );
            
            await Promise.all(promises);
            await Promise.all([loadChannels(), loadChannelsForEdit()]);
        } catch (e) { 
            showMessage('Ошибка перемещения'); 
        }
    };

    window.deleteChannel = async function(id) {
        if (confirm('Удалить канал?')) {
            try {
                const res = await fetch(`/api/channels/${id}`, { 
                    method: 'DELETE', 
                    headers: getAuthHeaders() 
                });
                if (!res.ok) throw new Error('Delete failed');
                await Promise.all([loadChannels(), loadChannelsForEdit()]);
            } catch(e) { 
                showMessage('Ошибка удаления'); 
            }
        }
    };

    async function loadCards() {
        try {
            const res = await fetch('/api/cards');
            if (!res.ok) return;
            const cards = await res.json();
            cards.forEach(card => {
                const cardEl = document.querySelector(`[data-service="${card.id}"]`);
                if (cardEl) {
                    const title = cardEl.querySelector('.card-title');
                    if (title) {
                        const textNode = Array.from(title.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                        if (textNode) {
                            textNode.textContent = card.name;
                        } else {
                            title.prepend(document.createTextNode(card.name));
                        }
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
                if (url) { 
                    showMessage('Загрузка...'); 
                    setTimeout(() => { window.location.href = url; }, 500); 
                }
            });
        });
    }

    const descTextarea = document.getElementById('editCardDescription');
    if (descTextarea) {
        descTextarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
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
        titleText = titleText.trim();
        
        document.getElementById('editCardName').value = titleText;
        document.getElementById('editCardDescription').value = description ? description.textContent : '';
        
        document.getElementById('editCardModal').style.display = 'flex';
        
        if (cardId === 'official-channels') {
            // Перемещаем содержимое channelsModal внутрь editCardModal
            const channelsModalContent = document.querySelector('#channelsModal .channels-modal-content');
            const editCardModalContent = document.querySelector('#editCardModal .channels-modal-content');
            
            if (channelsModalContent && editCardModalContent) {
                // Сохраняем оригинального родителя для возврата
                const originalParent = channelsModalContent.parentElement;
                
                // Перемещаем содержимое channelsModal в editCardModal
                editCardModalContent.appendChild(channelsModalContent);
                
                // Загружаем каналы
                loadChannelsForEdit();
                
                // Сохраняем ссылку для возврата при закрытии
                window._channelsModalOriginalParent = originalParent;
                window._channelsModalContent = channelsModalContent;
            }
        } else {
            // Возвращаем channelsModalContent на место если он был перемещён
            if (window._channelsModalContent && window._channelsModalOriginalParent) {
                window._channelsModalOriginalParent.appendChild(window._channelsModalContent);
                window._channelsModalContent = null;
                window._channelsModalOriginalParent = null;
            }
        }
    };

    document.getElementById('saveCardBtn').addEventListener('click', async () => {
        const id = document.getElementById('editCardId').value;
        const name = document.getElementById('editCardName').value.trim();
        const description = document.getElementById('editCardDescription').value.trim();
        try {
            const res = await fetch(`/api/cards/${id}`, { 
                method: 'PATCH', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ name, description }) 
            });
            if (!res.ok) throw new Error('Save failed');
            document.getElementById('editCardModal').style.display = 'none';
            loadCards();
        } catch(e) {
            showMessage('Ошибка сохранения');
        }
    });
    
    document.getElementById('closeEditCardBtn').addEventListener('click', () => {
        document.getElementById('editCardModal').style.display = 'none';
        // Возвращаем channelsModalContent на место
        if (window._channelsModalContent && window._channelsModalOriginalParent) {
            window._channelsModalOriginalParent.appendChild(window._channelsModalContent);
            window._channelsModalContent = null;
            window._channelsModalOriginalParent = null;
        }
    });

    // Обработчики для кнопок channelsModal (которые теперь внутри editCardModal)
    document.getElementById('closeChannelsBtn').addEventListener('click', () => {
        // Просто скрываем editCardModal, так как channelsModal теперь внутри него
        document.getElementById('editCardModal').style.display = 'none';
        if (window._channelsModalContent && window._channelsModalOriginalParent) {
            window._channelsModalOriginalParent.appendChild(window._channelsModalContent);
            window._channelsModalContent = null;
            window._channelsModalOriginalParent = null;
        }
    });

    document.getElementById('addChannelBtn').addEventListener('click', async () => {
        const name = document.getElementById('newChannelName').value.trim();
        const url = document.getElementById('newChannelUrl').value.trim();
        if (!name || !url) return alert('Заполните название и URL');
        try {
            const res = await fetch('/api/channels', { 
                method: 'POST', 
                headers: getAuthHeaders(), 
                body: JSON.stringify({ name, url, icon: '🌐' }) 
            });
            if (!res.ok) throw new Error('Add failed');
            document.getElementById('newChannelName').value = '';
            document.getElementById('newChannelUrl').value = '';
            loadChannelsForEdit();
            loadChannels();
        } catch(e) {
            showMessage('Ошибка добавления');
        }
    });

    loadChannels();
    loadCards();
    bindCardEvents();
})();
