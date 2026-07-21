function showAdminsModal() { document.getElementById('adminsModal').classList.add('show'); }

function hideAdminsModal() { document.getElementById('adminsModal').classList.remove('show'); }

function initAdminManagers() {
    document.getElementById('showAdminsBtn').addEventListener('click', showAdminsModal);
    document.getElementById('closeAdminsBtn').addEventListener('click', hideAdminsModal);
}
