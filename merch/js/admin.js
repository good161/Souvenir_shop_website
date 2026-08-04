let isAdmin = false;
let adminRole = '';
let editingProductId = null;
let showArchived = false;

if (localStorage.getItem('isAdmin') !== 'true') {
    isAdmin = false;
    adminRole = '';
}

function initAdmin() {
    document.getElementById('adminBtn').addEventListener('click', () => {
        if (isAdmin) {
            document.getElementById('adminBtn').classList.remove('active');
            isAdmin = false;
            adminRole = '';
            showArchived = false;
            authToken = '';
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminRole');
            renderProducts(products);
        } else {
            showLoginModal();
        }
    });

    initAdminAuth();
    initAdminProducts();
    initAdminManagers();
}

initAdmin();
