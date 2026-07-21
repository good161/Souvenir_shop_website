function showProductModal(product) {
    editingProductId = product ? product.id : null;
    document.getElementById('productModalTitle').textContent = product ? 'Редактировать товар' : 'Добавить товар';
    document.getElementById('productId').value = product ? product.id : '';
    document.getElementById('productName').value = product ? product.name : '';
    document.getElementById('productCategoryInput').value = product ? (product.category || '') : '';
    document.getElementById('productPrice').value = product && product.price ? product.price : '';
    document.getElementById('productDescription').value = product ? (product.description || '') : '';
    document.getElementById('productInStock').checked = product ? (product.inStock !== false) : true;
    document.getElementById('imageError').textContent = '';
    document.getElementById('imagePreview').src = product && product.image ? product.image : 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
    document.getElementById('productImage').value = product ? (product.image || '') : '';
    document.getElementById('productImageFile').value = '';
    
    document.getElementById('variantsList').innerHTML = '';
    if (product && product.variants) {
        product.variants.forEach(v => addVariantRow(v.label, v.price, v.inStock !== false, v.image || '', v.description || ''));
    }
    
    document.getElementById('productModal').classList.add('show');
}

function hideProductModal() {
    document.getElementById('productModal').classList.remove('show');
    editingProductId = null;
}

function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategoryInput').value.trim() || 'Без категории';
    const description = document.getElementById('productDescription').value.trim();
    const inStock = document.getElementById('productInStock').checked;
    const variants = getVariantsFromForm();
    let price = parseInt(document.getElementById('productPrice').value);
    let image = document.getElementById('productImage').value.trim();
    
    if (!name) return alert('Введите название товара');
    if (!variants && isNaN(price)) return alert('Введите цену или добавьте варианты');
    
    if (variants) price = null;
    if (!price && !variants) price = 0;
    
    const imageInput = document.getElementById('productImageFile');
    if (imageInput.files.length > 0) {
        image = URL.createObjectURL(imageInput.files[0]);
    }
    if (!image) image = 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
    
    const productData = { id: id || name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-') + '-' + Date.now(), name, category, image, description, inStock, price, variants };
    
    if (id) {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) products[index] = productData;
    } else {
        products.push(productData);
    }
    
    saveProducts();
    hideProductModal();
    updateCategoryButtons();
    renderProducts(products);
}

function deleteProduct(id) {
    if (confirm('Удалить товар навсегда?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        updateCategoryButtons();
        renderProducts(products);
    }
}

function archiveProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) { product.archived = true; product.inStock = false; saveProducts(); renderProducts(products); }
}

function restoreProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) { product.archived = false; saveProducts(); renderProducts(products); }
}

function toggleArchived() {
    showArchived = !showArchived;
    renderProducts(products);
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

function initAdminProducts() {
    document.getElementById('productSave').addEventListener('click', saveProduct);
    document.getElementById('productCancel').addEventListener('click', hideProductModal);
    document.getElementById('addVariant').addEventListener('click', () => addVariantRow());
    
    document.getElementById('productImageFile').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
                document.getElementById('imageError').textContent = 'Допустимые форматы: JPG, PNG, WEBP, GIF';
                this.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                document.getElementById('imageError').textContent = 'Максимальный размер файла: 5 МБ';
                this.value = '';
                return;
            }
            document.getElementById('imageError').textContent = '';
            document.getElementById('imagePreview').src = URL.createObjectURL(file);
        }
    });
}
