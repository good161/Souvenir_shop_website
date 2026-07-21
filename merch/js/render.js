function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getImagePath(image) {
    if (!image) return 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
    if (image.startsWith('http') || image.startsWith('blob:')) return image;
    return image;
}

function isRealImage(image) {
    return image && image !== 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
}

function renderProductCard(product) {
    const productImage = getImagePath(product.image);
    const isFullyOutOfStock = !isProductAvailable(product);
    const isArchived = product.archived === true;
    
    let mainImage = productImage;
    let mainDescription = product.description || '';
    let priceHtml = `<div class="price">${product.price ? formatPrice(product.price) : ''}</div>`;
    let variantsHtml = '';
    
    if (product.variants) {
        const firstAvailable = product.variants.find(v => v.inStock !== false);
        if (isRealImage(product.image)) {
            mainImage = productImage;
            mainDescription = firstAvailable ? (firstAvailable.description || product.description || '') : (product.description || '');
        } else if (firstAvailable) {
            mainImage = getImagePath(firstAvailable.image) || productImage;
            mainDescription = firstAvailable.description || product.description || '';
        }
        
        variantsHtml = `<div class="product-variants">${product.variants.map((v, i) => {
            const out = v.inStock === false;
            const active = firstAvailable && v.label === firstAvailable.label && v.price === firstAvailable.price;
            return `<div class="variant-option ${out ? 'variant-out-of-stock' : ''}">
                <input type="radio" name="variant-${product.id}" ${active ? 'checked' : ''} data-price="${v.price}" data-image="${getImagePath(v.image) || productImage}" data-description="${v.description || product.description || ''}" ${out ? 'disabled' : ''}>
                <label class="${out ? 'out-of-stock-label' : ''}"><span>${v.label}${out ? ' (нет в наличии)' : ''}</span></label>
            </div>`;
        }).join('')}</div>`;
        priceHtml = `<div class="price" id="price-${product.id}">${firstAvailable ? formatPrice(firstAvailable.price) : ''}</div>`;
    }
    
    const card = document.createElement('div');
    card.className = `product-card ${isFullyOutOfStock && !isArchived ? 'out-of-stock' : ''} ${isArchived ? 'archived' : ''}`;
    card.dataset.id = product.id;
    card.innerHTML = `
        ${isFullyOutOfStock && !isArchived ? '<div class="out-of-stock-badge">Нет в наличии</div>' : ''}
        ${isArchived ? '<div class="out-of-stock-badge archived-badge">В архиве</div>' : ''}
        <div class="product-image-wrapper"><img src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://placehold.co/400x400/e9eef3/8b9cb0?text=Error'"></div>
        <h3>${escapeHtml(product.name)}</h3>
        ${priceHtml}
        ${variantsHtml}
        <div class="product-bottom">
            <p class="product-description">${escapeHtml(mainDescription)}</p>
            <span class="product-category">${escapeHtml(product.category) || 'Без категории'}</span>
            ${isAdmin ? `<div class="admin-actions show">
                <button class="modal-btn small edit-product-btn">✏️</button>
                ${product.archived ? '<button class="modal-btn small primary restore-product-btn">↩️</button>' : '<button class="modal-btn small archive-product-btn">📦</button>'}
                <button class="modal-btn small danger delete-product-btn">🗑️</button>
            </div>` : ''}
        </div>`;
    
    if (isAdmin) {
        card.querySelector('.edit-product-btn').addEventListener('click', (e) => { e.stopPropagation(); showProductModal(products.find(p => p.id === product.id)); });
        if (!product.archived) card.querySelector('.archive-product-btn').addEventListener('click', (e) => { e.stopPropagation(); archiveProduct(product.id); });
        else card.querySelector('.restore-product-btn').addEventListener('click', (e) => { e.stopPropagation(); restoreProduct(product.id); });
        card.querySelector('.delete-product-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteProduct(product.id); });
    }
    
    return card;
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = getFilteredProducts(products);
    const sorted = getSortedProducts(filtered);

    grid.innerHTML = '';

    // Кнопка добавления всегда первая
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
            const description = this.dataset.description;
            const priceEl = document.getElementById(`price-${productId}`);
            const card = document.querySelector(`.product-card[data-id="${productId}"]`);
            const product = products.find(p => p.id === productId);
            
            if (priceEl) priceEl.textContent = price ? formatPrice(price) : '';
            if (card) {
                const desc = card.querySelector('.product-description');
                if (desc) desc.textContent = description || '';
            }
        });
    });
}
