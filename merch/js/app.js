let products = [];

async function loadProductsFromDB() {
    try {
        const res = await fetch('/api/products');
        products = await res.json();
    } catch (err) {
        products = [];
    }
}

function updateCategoryButtons() {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const container = document.querySelector('.category-filters');
    container.querySelectorAll('.cat-btn:not([data-category="all"])').forEach(b => b.remove());
    categories.sort((a, b) => a.localeCompare(b, 'ru')).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderProducts(products);
        });
        container.appendChild(btn);
    });
}

(async function() {
    await loadProductsFromDB();
    updateCategoryButtons();

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
})();
