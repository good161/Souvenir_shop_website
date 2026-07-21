function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = getFilteredProducts(products);
    const sorted = getSortedProducts(filtered);

    if (sorted.length === 0 && !isAdmin) {
        grid.innerHTML = '<div class="no-results">🔍 Товары не найдены. Попробуйте изменить запрос или категорию.</div>';
        return;
    }

    grid.innerHTML = '';

    if (isAdmin) {
        const adminBar = document.createElement('div');
        adminBar.style.cssText = 'grid-column:1/-1;display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;';
        adminBar.innerHTML = `
            <button class="modal-btn small ${showArchived ? 'primary' : ''}" id="toggleArchivedBtn">
                ${showArchived ? '📋 Обычные товары' : '📦 Архив'}
            </button>
            <button class="modal-btn small danger" id="resetProductsBtn">🔄 Сброс</button>
            <span style="font-size:0.75rem;color:#64748b;">${showArchived ? 'Просмотр архива' : 'Обычный режим'}</span>
        `;
        grid.appendChild(adminBar);
        document.getElementById('toggleArchivedBtn').addEventListener('click', toggleArchived);
        document.getElementById('resetProductsBtn').addEventListener('click', resetProducts);
    }

    sorted.forEach(product => {
        const img = product.image || 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
        const productAvailable = isProductAvailable(product);
        const isFullyOutOfStock = !productAvailable;
        const isArchived = product.archived === true;
        
        let priceHtml = '';
        let variantsHtml = '';
        
        if (product.variants) {
            const firstAvailable = product.variants.find(v => v.inStock !== false);
            
            variantsHtml = `
                <div class="product-variants">
                    ${product.variants.map((v, i) => {
                        const variantOutOfStock = v.inStock === false;
                        const isFirstAvailable = firstAvailable && v.label === firstAvailable.label && v.price === firstAvailable.price;
                        return `
                        <div class="variant-option ${variantOutOfStock ? 'variant-out-of-stock' : ''}">
                            <input type="radio" name="variant-${product.id}" id="var-${product.id}-${i}" ${isFirstAvailable ? 'checked' : ''} data-price="${v.price}" ${variantOutOfStock ? 'disabled' : ''}>
                            <label for="var-${product.id}-${i}" class="${variantOutOfStock ? 'out-of-stock-label' : ''}">
                                <span>${v.label}${variantOutOfStock ? ' (нет в наличии)' : ''}</span>
                                <span class="variant-price">${formatPrice(v.price)}</span>
                            </label>
                        </div>
                    `}).join('')}
                </div>
            `;
            priceHtml = `<div class="price" id="price-${product.id}">${firstAvailable ? formatPrice(firstAvailable.price) : formatPrice(product.variants[0].price)}</div>`;
        } else {
            priceHtml = `<div class="price">${formatPrice(product.price)}</div>`;
        }

        const card = document.createElement('div');
        card.className = `product-card ${isFullyOutOfStock && !isArchived ? 'out-of-stock' : ''} ${isArchived ? 'archived' : ''}`;
        card.dataset.id = product.id;
        card.innerHTML = `
            ${isFullyOutOfStock && !isArchived ? '<div class="out-of-stock-badge">Нет в наличии</div>' : ''}
            ${isArchived ? '<div class="out-of-stock-badge archived-badge">В архиве</div>' : ''}
            <div class="product-image-wrapper">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://placehold.co/400x400/e9eef3/8b9cb0?text=Error'" class="${isFullyOutOfStock && !isArchived ? 'out-of-stock-image' : ''}">
            </div>
            <h3>${escapeHtml(product.name)}</h3>
            ${priceHtml}
            ${variantsHtml}
            <div class="product-bottom">
                ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
                <span class="product-category">${escapeHtml(product.category) || 'Без категории'}</span>
                ${isAdmin ? `
                    <div class="admin-actions show">
                        <button class="modal-btn small edit-product-btn">✏️</button>
                        ${product.archived ? 
                            `<button class="modal-btn small primary restore-product-btn">↩️</button>` :
                            `<button class="modal-btn small archive-product-btn">📦</button>`
                        }
                        <button class="modal-btn small danger delete-product-btn">🗑️</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        grid.appendChild(card);
        
        if (isAdmin) {
            card.querySelector('.edit-product-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showProductModal(products.find(p => p.id === product.id));
            });
            if (!product.archived) {
                card.querySelector('.archive-product-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    archiveProduct(product.id);
                });
            } else {
                card.querySelector('.restore-product-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    restoreProduct(product.id);
                });
            }
            card.querySelector('.delete-product-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProduct(product.id);
            });
        }
    });

    if (isAdmin && !showArchived) {
        const addCard = document.createElement('div');
        addCard.className = 'product-card admin-add-card';
        addCard.innerHTML = `
            <div class="admin-add-content">
                <span style="font-size:3rem;">+</span>
                <span style="font-size:1rem;font-weight:600;">Добавить товар</span>
            </div>
        `;
        addCard.addEventListener('click', () => showProductModal(null));
        grid.appendChild(addCard);
    }

    document.querySelectorAll('.variant-option input[type="radio"]:not([disabled])').forEach(radio => {
        radio.addEventListener('change', function() {
            const productId = this.name.replace('variant-', '');
            const price = parseInt(this.dataset.price);
            const priceEl = document.getElementById(`price-${productId}`);
            if (priceEl) priceEl.textContent = formatPrice(price);
        });
    });
}
