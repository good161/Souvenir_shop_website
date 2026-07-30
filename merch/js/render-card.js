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
    const allImages = (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : []);
    const productImage = allImages.length > 0 ? getImagePath(allImages[0]) : 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
    const isFullyOutOfStock = !isProductAvailable(product);
    const isArchived = product.archived === true;
    
    let mainImage = productImage;
    let mainDescription = product.description || '';
    let priceHtml = `<div class="price">${product.price !== null && product.price !== undefined && product.price !== 0 ? formatPrice(product.price) : ''}</div>`;
    let variantsHtml = '';
    let galleryHtml = '';
    
    const variantsArray = Array.isArray(product.variants) ? product.variants : [];
    
    if (variantsArray.length > 0) {
        const firstAvailable = variantsArray.find(v => v.inStock !== false);
        if (isRealImage(product.image)) {
            mainImage = getImagePath(product.image);
            mainDescription = firstAvailable ? (firstAvailable.description || product.description || '') : (product.description || '');
        } else if (firstAvailable) {
            mainImage = getImagePath(firstAvailable.image) || productImage;
            mainDescription = firstAvailable.description || product.description || '';
        }
        
        variantsHtml = `<div class="product-variants">${variantsArray.map((v, i) => {
            const out = v.inStock === false;
            const active = firstAvailable && v.label === firstAvailable.label && v.price === firstAvailable.price;
            return `<div class="variant-option ${out ? 'variant-out-of-stock' : ''}">
                <label class="${out ? 'out-of-stock-label' : ''}" style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;flex:1;">
                    <input type="radio" name="variant-${product.id}" ${active ? 'checked' : ''} data-price="${v.price}" data-image="${getImagePath(v.image) || productImage}" data-description="${v.description || product.description || ''}" ${out ? 'disabled' : ''}>
                    <span>${v.label}${out ? ' (нет в наличии)' : ''}</span>
                </label>
            </div>`;
        }).join('')}</div>`;
        priceHtml = `<div class="price" id="price-${product.id}">${firstAvailable && firstAvailable.price !== 0 ? formatPrice(firstAvailable.price) : ''}</div>`;
    }
    
    if (allImages.length > 1) {
        galleryHtml = `
            <div class="gallery-nav">
                <button class="gallery-arrow gallery-prev" data-product="${product.id}">‹</button>
                <span class="gallery-counter">1/${allImages.length}</span>
                <button class="gallery-arrow gallery-next" data-product="${product.id}">›</button>
            </div>`;
    }
    
    const card = document.createElement('div');
    card.className = `product-card ${isFullyOutOfStock && !isArchived ? 'out-of-stock' : ''} ${isArchived ? 'archived' : ''}`;
    card.dataset.id = product.id;
    card.dataset.allImages = JSON.stringify(allImages);
    card.dataset.currentIndex = '0';
    card.innerHTML = `
        ${isFullyOutOfStock && !isArchived ? '<div class="out-of-stock-badge">Нет в наличии</div>' : ''}
        ${isArchived ? '<div class="out-of-stock-badge archived-badge">В архиве</div>' : ''}
        <div class="product-image-wrapper">
            <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://placehold.co/400x400/e9eef3/8b9cb0?text=Error'">
            ${galleryHtml}
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        ${priceHtml}
        ${variantsHtml}
        <div class="product-bottom">
            <p class="product-description">${escapeHtml(mainDescription)}</p>
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
