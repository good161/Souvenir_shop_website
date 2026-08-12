(function() {
    const toast = document.getElementById('toastMsg');
    
    function showMessage(text, duration = 2300) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    function getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
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
            
            if (channels.length === 0) {
                grid.innerHTML = '<span style="color:#94a3b8;">Нет каналов</span>';
                return;
            }
            
            grid.innerHTML = channels.map(c => `
                <a href="${c.url}" target="_blank" class="channel-icon" title="${c.name}">
                    <img src="https://www.google.com/s2/favicons?domain=${c.url}&sz=32" alt="${c.name}" class="channel-logo">
                    <span class="icon-label">${c.name}</span>
                </a>
            `).join('');
        } catch (err) {
            document.getElementById('channelsGrid').innerHTML = '<span style="color:#94a3b8;">Ошибка загрузки</span>';
        }
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
        await fetch(`/api/channels/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ [field]: value })
        });
        loadChannels();
    };

    window.moveChannel = async function(id, index, direction) {
        const res = await fetch('/api/channels');
        const channels = await res.json();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= channels.length) return;
        
        [channels[index], channels[newIndex]] = [channels[newIndex], channels[index]];
        
        for (const ch of channels) {
            await fetch(`/api/channels/${ch.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ display_order: channels.indexOf(ch) })
            });
        }
        
        loadChannelsForEdit();
        loadChannels();
    };

    window.deleteChannel = async function(id) {
        if (confirm('Удалить канал?')) {
            await fetch(`/api/channels/${id}`, { 
                method: 'DELETE', 
                headers: getAuthHeaders() 
            });
            loadChannelsForEdit();
            loadChannels();
        }
    };

    document.getElementById('addChannelBtn').addEventListener('click', async function() {
        const name = document.getElementById('newChannelName').value.trim();
        const url = document.getElementById('newChannelUrl').value.trim();
        
        if (!name || !url) return alert('Заполните название и URL');
        
        await fetch('/api/channels', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, url, icon: '🌐' })
        });
        
        document.getElementById('newChannelName').value = '';
        document.getElementById('newChannelUrl').value = '';
        loadChannelsForEdit();
        loadChannels();
    });

    if (localStorage.getItem('isAdmin') === 'true') {
        document.getElementById('editChannelsBtn').style.display = 'inline-block';
    }

    document.getElementById('editChannelsBtn').addEventListener('click', function() {
        document.getElementById('channelsModal').style.display = 'flex';
        loadChannelsForEdit();
    });

    document.getElementById('closeChannelsBtn').addEventListener('click', function() {
        document.getElementById('channelsModal').style.display = 'none';
    });

    const serviceData = {
        'it-services': { 
            name: 'IT-сервисы', 
            description: 'Личный кабинет, расписание, электронные заявки',
            url: 'it-services/index.html'
        },
        'official-channels': { 
            name: 'Официальные каналы связи', 
            description: 'Почта, Telegram, ВКонтакте, Rutube, Дзен'
        },
        'bots': { 
            name: 'Боты', 
            description: 'Чат-боты для студентов и сотрудников',
            url: 'bots/index.html'
        },
        'merch': { 
            name: 'Сувенирная продукция', 
            description: 'Магазин брендированных товаров ЧГУ',
            url: 'merch/index.html'
        }
    };

    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.channel-icon') || e.target.closest('button') || e.target.closest('input')) return;
            
            const serviceKey = card.getAttribute('data-service');
            const info = serviceData[serviceKey];
            
            if ((serviceKey === 'merch' || serviceKey === 'it-services' || serviceKey === 'bots') && info.url) {
                showMessage(`✨ ${info.name} — загрузка...`);
                setTimeout(() => {
                    window.location.href = info.url;
                }, 500);
            }
        });
    });

    loadChannels();
    console.log('🚀 ЧГУ Дашборд сервисов активирован');
})();
