let isAdmin = false;
let adminRole = '';
let editingProductId = null;
let showArchived = false;

// Просто проверяем, есть ли админ в localStorage
if (localStorage.getItem('isAdmin') === 'true') {
    isAdmin = true;
    adminRole = localStorage.getItem('adminRole') || '';
}

function initAdmin() {
    // Только инициализация продуктов
    initAdminProducts();
}



initAdmin();
