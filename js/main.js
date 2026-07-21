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

    const serviceData = {
        'it-services': { 
            name: 'IT-сервисы', 
            description: 'Личный кабинет, расписание, электронные заявки' ,
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
            const serviceKey = card.getAttribute('data-service');
            const info = serviceData[serviceKey];
            
            if ((serviceKey === 'merch' || serviceKey === 'it-services' || serviceKey === 'bots') && info.url) {
                showMessage(`✨ ${info.name} — загрузка...`);
                setTimeout(() => {
                    window.location.href = info.url;
                }, 500);
            } else {
                showMessage(`🔹 ${info.name} — раздел в разработке`);
            }
        });
    });

    console.log('🚀 ЧГУ Дашборд сервисов активирован');
})();
