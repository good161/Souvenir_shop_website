function renderProducts(products) {
const grid = document.getElementById('productsGrid');
if (!grid) return;

const filtered = getFilteredProducts(products);
const sorted = getSortedProducts(filtered);

grid.innerHTML = '';

   if (isAdmin && !showArchived) {
    if (isAdmin && !showArchived) {
const addCard = document.createElement('div');
addCard.className = 'product-card admin-add-card';
addCard.innerHTML = '<div class="admin-add-content"><span style="font-size:3rem;">+</span><span style="font-size:1rem;font-weight:600;">Добавить товар</span></div>';
@@ -39,15 +39,21 @@
radio.addEventListener('change', function() {
const productId = this.name.replace('variant-', '');
const price = parseInt(this.dataset.price);
            const image = this.dataset.image;
const description = this.dataset.description;
const priceEl = document.getElementById(`price-${productId}`);
const card = document.querySelector(`.product-card[data-id="${productId}"]`);

if (priceEl) priceEl.textContent = price ? formatPrice(price) : '';
if (card) {
                const img = card.querySelector('img');
const desc = card.querySelector('.product-description');
                if (img && image) {
                    img.src = image;
                    img.onerror = function() { this.src = 'https://placehold.co/400x400/e9eef3/8b9cb0?text=Error'; };
                }
if (desc) desc.textContent = description || '';
}
});
});
}
