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
        
        list.innerHTML = channels.map(c => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px solid #e2e8f0;">
                <span>${c.name}</span>
                <button onclick="deleteChannel(${c.id})" style="background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;padding:0.2rem 0.5rem;">🗑️</button>
            </div>
        `).join('');
    }

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
