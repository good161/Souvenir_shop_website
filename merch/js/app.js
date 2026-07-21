let products = [];

function loadProducts() {
    const stored = localStorage.getItem('chsu_merch_products');
    if (stored) {
        try {
            products = JSON.parse(stored);
        } catch (e) {
            products = [];
        }
    }
}

function saveProducts() {
    localStorage.setItem('chsu_merch_products', JSON.stringify(products));
}

loadProducts();

function init() {
    renderProducts(products);

    document.getElementById('searchInput').addEventListener('input', function() {
        searchQuery = this.value;
        renderProducts(products);
    });

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderProducts(products);
        });
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSortMode = this.dataset.sort;
            renderProducts(products);
        });
    });
}

init();
