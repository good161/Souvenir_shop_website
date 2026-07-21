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
        'student': { name: 'Личный кабинет', url: 'https://lk.chsu.ru/login' },
        'schedule': { name: 'Расписание', url: 'https://www.chsu.ru/raspisanie/' },
        'events': { name: 'Мероприятия', url: 'https://www.chsu.ru/meropriyatiya/' },
        'requests': { name: 'Электронные заявки', url: 'https://lk.chsu.ru/services/my/requests' },
        'library': { name: 'Электронная библиотека', url: 'https://www.chsu.ru/struktura-chgu/administrativnye-podrazdeleniya/biblioteka/elektronnye-resursy/ebs/' },
        'mail': { name: 'Корпоративная почта', url: ' https://biz.mail.ru/login/chsu.ru' }
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
            const info = serviceData[key];

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
            const info = serviceData[key];

            if (!info) return;

            if (info.url && info.url !== '#') {
                window.location.href = info.url;
            } else {
                showMessage(`🔹 ${info.name} — в разработке`);
            }
        });
    });

    console.log('🚀 IT-сервисы ЧГУ активированы');
})();
