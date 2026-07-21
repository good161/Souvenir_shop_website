const STORAGE_KEY = 'mini_shop_products_v21';

function formatPrice(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(value);
}

function getDefaultProducts() {
    return [
        // ОДЕЖДА
        { id: 'bandana', name: 'Бандана/косынка с логотипом ЧГУ', category: 'Одежда', image: 'images/2026-05-27_12-54-46.png', price: 220, inStock: true, description: 'Стильная бандана с логотипом ЧГУ' },
        { id: 'baseball-cap', name: 'Бейсболка с логотипом ЧГУ', category: 'Одежда', image: 'images/2026-05-27_12-54-57.png', price: 240, inStock: true, description: 'Классическая бейсболка с вышитым логотипом' },
        { id: 'windbreaker', name: 'Ветровка с логотипом', category: 'Одежда', image: 'images/2026-05-27_12-55-52.png', price: 1600, inStock: true, description: 'Легкая ветровка с логотипом университета' },
        { id: 'socks', name: 'Высокие носки с логотипом', category: 'Одежда', image: 'images/2026-05-27_12-56-13.png', price: 250, inStock: false, description: 'Белые или красные носки с символикой ЧГУ' },
        { id: 'mask', name: 'Маска с логотипом', category: 'Одежда', image: 'images/2026-05-27_12-57-06.png', price: 65, inStock: true, description: 'Защитная маска с символикой ЧГУ' },
        { id: 'sweatshirt', name: 'Свитшот с логотипом', category: 'Одежда', image: 'images/2026-05-27_12-58-25.png', variants: [{ label: '250гр флекс', price: 1550, inStock: true }, { label: '250гр вышивка', price: 2150, inStock: true }, { label: '310гр флекс', price: 2435, inStock: false }, { label: '310гр вышивка', price: 3000, inStock: true }], description: 'Свитшот с логотипом ЧГУ' },
        { id: 'hoodie', name: 'Толстовка с капюшоном и логотипом', category: 'Одежда', image: 'images/2026-05-27_12-59-51.png', variants: [{ label: 'Флекс', price: 2435, inStock: true }, { label: 'Вышивка', price: 3000, inStock: true }], description: 'Толстовка с капюшоном и логотипом ЧГУ' },
        { id: 'tshirt', name: 'Футболка с логотипом ЧГУ', category: 'Одежда', image: 'images/2026-05-27_13-00-09.png', variants: [{ label: '1 лого (на спине)', price: 400, inStock: true }, { label: '2 лого (спина + грудь)', price: 490, inStock: false }], description: 'Футболка с логотипом ЧГУ' },

        // АКСЕССУАРЫ
        { id: 'bracelet', name: 'Браслет силиконовый', category: 'Аксессуары', image: 'images/2026-05-27_12-55-08.png', price: 60, inStock: true, description: 'Силиконовый браслет с символикой ЧГУ' },
        { id: 'powerbank', name: 'Внешний аккумулятор', category: 'Аксессуары', image: 'images/2026-05-27_12-56-00.png', price: 580, inStock: false, description: 'Easy Metal 2200 мАч, красный' },
        { id: 'backpack', name: 'Рюкзак Unit Back To Back', category: 'Аксессуары', image: 'images/2026-05-27_12-58-14.png', price: 1120, inStock: true, description: 'Рюкзак, красный' },
        { id: 'bag-canvas', name: 'Холщовая сумка Strong 210', category: 'Аксессуары', image: 'images/2026-05-27_13-00-22.png', price: 350, inStock: true, description: 'Белая сумка с логотипом ЧГУ' },
        { id: 'bag-docs', name: 'Сумка для документов HotDoc', category: 'Аксессуары', image: 'images/2026-05-27_12-59-16.png', price: 650, inStock: true, description: 'Серая сумка для документов' },
        { id: 'pass-cover', name: 'Чехол для пропуска Twill', category: 'Аксессуары', image: 'images/2026-05-27_13-00-28.png', price: 230, inStock: true, description: 'Красный чехол для пропуска' },
        { id: 'umbrella', name: 'Прозрачный зонт-трость Clear', category: 'Аксессуары', image: 'images/2026-05-27_12-57-54.png', price: 880, inStock: true, description: 'Прозрачный зонт-трость' },

        // КАНЦЕЛЯРИЯ
        { id: 'notebook', name: 'Ежедневник', category: 'Канцелярия', image: 'images/2026-05-27_12-56-25.png', price: 650, inStock: true, description: 'Chillout, недатированный, красный' },
        { id: 'folder', name: 'Папка с резинками', category: 'Канцелярия', image: 'images/2026-05-27_12-57-42.png', price: 62, inStock: true, description: 'Папка А4, пластик' },
        { id: 'pen-scribo', name: 'Ручка шариковая Scribo', category: 'Канцелярия', image: 'images/2026-05-27_12-58-02.png', price: 140, inStock: true, description: 'Красная ручка Scribo' },
        { id: 'pen-slider', name: 'Ручка шариковая Slider', category: 'Канцелярия', image: 'images/2026-05-27_12-58-06.png', price: 49, inStock: true, description: 'Красная с белым ручка' },
        { id: 'flash-drive', name: 'Флешка «Капсула»', category: 'Канцелярия', image: 'images/2026-05-27_13-00-02.png', price: 700, inStock: true, description: 'Красная флешка, 8 Гб' },
        { id: 'plastic-bag', name: 'Пакет ПВД', category: 'Канцелярия', image: 'images/2026-05-27_12-57-16.png', variants: [{ label: '20×30 см', price: 20, inStock: true }, { label: '30×40 см', price: 19, inStock: false }, { label: '40×50 см', price: 18, inStock: true }], description: 'Пакет ПВД' },

        // СУВЕНИРЫ
        { id: 'toy-uchik', name: 'Сувенирная игрушка «Учик»', category: 'Сувениры', image: 'images/2026-05-27_12-59-04.png', variants: [{ label: 'Малый', price: 100, inStock: true }, { label: 'Большой', price: 215, inStock: false }], description: 'Мягкая игрушка Учик' },
        { id: 'magnet-uchik', name: 'Учик магнит', category: 'Сувениры', image: 'images/2026-05-27_12-59-56.png', price: 75, inStock: true, description: 'Магнит с Учиком' },
        { id: 'pin-ordered', name: 'Значок заказной с логотипом ЧГУ', category: 'Сувениры', image: 'images/2026-05-27_12-56-30.png', variants: [{ label: '56 мм, тираж 100 шт', price: 21, inStock: true }, { label: '56 мм, тираж 200 шт', price: 19, inStock: true }], description: 'Заказной значок с логотипом ЧГУ' },
        { id: 'pin-filled', name: 'Значок заливной', category: 'Сувениры', image: 'images/2026-05-27_12-56-51.png', price: 83, inStock: true, description: 'Заливной значок' },
        { id: 'reflector', name: 'Светоотражатель «Сердце»', category: 'Сувениры', image: 'images/2026-05-27_12-57-49.png', price: 85, inStock: true, description: 'Красный светоотражатель' },

        // ПРОЧЕЕ
        { id: 'dumbbell', name: 'Гантель', category: 'Прочее', image: 'images/2026-05-27_12-56-20.png', price: 500, inStock: true, description: 'Heracles 1 кг, красная' },
        { id: 'mug', name: 'Кружка с манжетом', category: 'Прочее', image: 'images/2026-05-27_12-56-57.png', price: 220, inStock: true, description: 'Кружка с манжетом' },
        { id: 'ball', name: 'Мяч футбольный', category: 'Прочее', image: 'images/2026-05-27_12-57-10.png', price: 660, inStock: true, description: 'Street, бело-красный' },
        { id: 'whistle', name: 'Свисток на шнурке Ready', category: 'Прочее', image: 'images/2026-05-27_12-58-17.png', price: 95, inStock: true, description: 'Белый свисток' },
        { id: 'bottle', name: 'Спортивная бутылка Marathon', category: 'Прочее', image: 'images/2026-05-27_12-58-58.png', price: 800, inStock: false, description: 'Красная спортивная бутылка' },
        { id: 'thermo-cup', name: 'Термостакан Forma', category: 'Прочее', image: 'images/2026-05-27_12-59-41.png', price: 780, inStock: true, description: 'Красный термостакан, 350 мл' }
    ];
}

function isProductAvailable(product) {
    if (product.variants && product.variants.length > 0) {
        return product.variants.some(v => v.inStock !== false);
    }
    return product.inStock !== false;
}

function loadProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    const defaults = getDefaultProducts();
    saveProducts(defaults);
    return defaults;
}

function saveProducts(products) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); } catch (e) {}
}
