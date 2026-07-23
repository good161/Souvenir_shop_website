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
            localStorage.removeItem('isAdmin');
            renderProducts(products);
        } else {
            showLoginModal();
        }
    });
    
    initAdminAuth();
    initAdminProducts();
    initAdminUI();
    initAdminManagers();
}

initAdmin();
