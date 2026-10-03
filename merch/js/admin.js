let isAdmin = false;
let adminRole = '';
let adminPermissions = { main: true, merch: true };
let editingProductId = null;
let showArchived = false;

if (localStorage.getItem('isAdmin') === 'true') {
    const role = localStorage.getItem('adminRole') || '';
    let perms = { main: true, merch: true };
    try {
        perms = JSON.parse(localStorage.getItem('adminPermissions') || '{"main":true,"merch":true}');
    } catch (e) {}
    const canMerch = role === 'Protoadmin' || perms.merch;
    if (canMerch) {
        isAdmin = true;
        adminRole = role;
        adminPermissions = perms;
    }
}

function initAdmin() {
    initAdminProducts();
}

initAdmin();
