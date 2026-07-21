let isAdmin = false;
let adminRole = '';
let editingProductId = null;
let showArchived = false;

function initAdmin() {
    document.getElementById('adminBtn').addEventListener('click', () => {
        if (isAdmin) {
            document.getElementById('adminBtn').classList.remove('active');
            isAdmin = false;
            adminRole = '';
            showArchived = false;
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
