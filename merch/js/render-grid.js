function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = getFilteredProducts(products);
    const sorted = getSortedProducts(filtered);

    grid.innerHTML = '';

    if (isAdmin && !showArchived) {
        const addCard = document.createElement('div');
        addCard.className = 'product-card admin-add-card';
        addCard.innerHTML = '<div class="admin-add-content"><span style="font-size:3rem;">+</span><span style="font-size:1rem;font-weight:600;">Добавить товар</span></div>';
        addCard.addEventListener('click', () => showProductModal(null));
        grid.appendChild(addCard);
    }

    if (isAdmin) {
        const adminBar = document.createElement('div');
        adminBar.style.cssText = 'grid-column:1/-1;display:flex;gap:0.5rem;align-items:center;';
        adminBar.innerHTML = `<button class="modal-btn small ${showArchived ? 'primary' : ''}" id="toggleArchivedBtn">${showArchived ? 'Обычные товары' : 'Архив'}</button><span style="font-size:0.75rem;color:#64748b;">${showArchived ? 'Просмотр архива' : 'Обычный режим'}</span>`;
        grid.appendChild(adminBar);
        document.getElementById('toggleArchivedBtn').addEventListener('click', toggleArchived);
    }

    const adminsBtn = document.getElementById('showAdminsBtn');
    if (adminsBtn) adminsBtn.style.display = (isAdmin && adminRole === 'Protoadmin') ? 'flex' : 'none';

    if (sorted.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'no-results';
        emptyMsg.textContent = isAdmin ? 'Товаров нет. Нажмите + чтобы добавить.' : 'Товаров пока нет.';
        grid.appendChild(emptyMsg);
    } else {
        sorted.forEach(product => grid.appendChild(renderProductCard(product)));
    }

    document.querySelectorAll('.variant-option input[type="radio"]:not([disabled])').forEach(radio => {
        radio.addEventListener('change', function() {
            const productId = this.name.replace('variant-', '');
            const price = parseInt(this.dataset.price);
            const image = this.dataset.image;
            const description = this.dataset.description;
            const priceEl = document.getElementById(`price-${productId}`);
            const card = document.querySelector(`.product-card[data-id="${productId}"]`);
            
            if (priceEl) priceEl.textContent = price ? formatPrice(price) : '';
            if (card) {
                const img = card.querySelector('.product-image-wrapper img');
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
