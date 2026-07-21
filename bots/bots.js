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

    // Все ссылки на ботов — заглушки (#)
    const botData = {
        'freshman': { name: 'Бот первокурсника', url: '#' },
        'dean': { name: 'Единый деканат', url: '#' },
        'support': { name: 'Поддержка студентов', url: '#' },
        'vuc': { name: 'ВУЦ бот', url: '#' },
        'guide': { name: 'Путеводитель по вузу', url: '#' },
        'library': { name: 'Электронная библиотека', url: '#' }
    };

    function addBackButton() {
        const header = document.querySelector('.brand-header .header-overlay');
        if (header && !document.querySelector('.back-button')) {
            const backBtn = document.createElement('a');
            backBtn.href = '../index.html';
            backBtn.className = 'back-button';
            backBtn.innerHTML = '← На главную';
            header.prepend(backBtn);
        }
    }

    addBackButton();

    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-link')) return;

            const key = card.getAttribute('data-type');
            const info = botData[key];

            if (!info) return;

            if (info.url && info.url !== '#') {
                window.open(info.url, '_blank');
            } else {
                showMessage(`🔹 ${info.name} — в разработке`);
            }
        });
    });

    document.querySelectorAll('.card-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            const card = link.closest('.service-card');
            const key = card.getAttribute('data-type');
            const info = botData[key];

            if (!info) return;

            if (info.url && info.url !== '#') {
                window.location.href = info.url;
            } else {
                showMessage(`🔹 ${info.name} — в разработке`);
            }
        });
    });

    console.log('🤖 Боты ЧГУ активированы');
})();
