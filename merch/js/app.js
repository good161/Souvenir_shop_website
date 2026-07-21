let products = [];

(function() {
    products = loadProducts();

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