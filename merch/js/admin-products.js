let isSaving = false;
let currentImages = [];

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
    document.getElementById('productImageFile').value = '';
    
    currentImages = [];
    const imagesPreview = document.getElementById('imagesPreview');
    imagesPreview.innerHTML = '';
    
    if (product) {
        const images = product.images || (product.image ? [product.image] : []);
        currentImages = images.filter(img => img && img !== 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image');
        renderImagePreviews();
    }
    
    const removeBtn = document.getElementById('removeMainImage');
    if (removeBtn) removeBtn.style.display = currentImages.length > 0 ? 'inline-block' : 'none';
    
    document.getElementById('variantsList').innerHTML = '';
    if (product && product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(v => addVariantRow(v.label, v.price, v.inStock !== false, v.image || '', v.description || ''));
    }
    
    document.getElementById('productModal').classList.add('show');
}

function renderImagePreviews() {
    const container = document.getElementById('imagesPreview');
    container.innerHTML = currentImages.map((img, i) => `
        <div style="position:relative;display:inline-block;">
            <img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">
            <button class="remove-image-btn" data-index="${i}" style="position:absolute;top:-5px;right:-5px;background:#ef4444;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:0.6rem;">✕</button>
            <div style="display:flex;justify-content:center;gap:2px;margin-top:2px;">
                <button class="move-left-btn" data-index="${i}" ${i === 0 ? 'disabled' : ''} style="background:#64748b;color:white;border:none;border-radius:3px;cursor:pointer;font-size:0.5rem;padding:1px 4px;">◀</button>
                <button class="move-right-btn" data-index="${i}" ${i === currentImages.length - 1 ? 'disabled' : ''} style="background:#64748b;color:white;border:none;border-radius:3px;cursor:pointer;font-size:0.5rem;padding:1px 4px;">▶</button>
            </div>
        </div>
    `).join('');
    
    if (currentImages.length < 5) {
        const label = document.createElement('label');
        label.style.cssText = 'width:80px;height:80px;border:2px dashed #e31e24;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#e31e24;font-size:1.5rem;';
        label.innerHTML = '+<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" multiple>';
        label.querySelector('input').addEventListener('change', function() {
            addMoreImages(this);
        });
        container.appendChild(label);
    }
    
    container.querySelectorAll('.remove-image-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Удалить это фото?')) {
                removeImage(parseInt(this.dataset.index));
            }
        });
    });
    
    container.querySelectorAll('.move-left-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (index > 0) {
                [currentImages[index], currentImages[index - 1]] = [currentImages[index - 1], currentImages[index]];
                renderImagePreviews();
            }
        });
    });

    container.querySelectorAll('.move-right-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (index < currentImages.length - 1) {
                [currentImages[index], currentImages[index + 1]] = [currentImages[index + 1], currentImages[index]];
                renderImagePreviews();
            }
        });
    });
    
    document.getElementById('removeMainImage').style.display = currentImages.length > 0 ? 'inline-block' : 'none';
}

function removeImage(index) {
    currentImages.splice(index, 1);
    renderImagePreviews();
}

function addMoreImages(input) {
    const files = input.files;
    for (const file of files) {
        if (currentImages.length >= 5) break;
        currentImages.push(URL.createObjectURL(file));
    }
    renderImagePreviews();
    input.value = '';
}

function hideProductModal() {
    document.getElementById('productModal').classList.remove('show');
    editingProductId = null;
}

async function saveProduct() {
    if (isSaving) return;
    isSaving = true;
    
    const saveBtn = document.getElementById('productSave');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Сохранение...';
    
    try {
        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategoryInput').value.trim() || 'Без категории';
        const description = document.getElementById('productDescription').value.trim();
        const inStock = document.getElementById('productInStock').checked;
        const variants = await getVariantsFromForm();
        let price = parseInt(document.getElementById('productPrice').value);
        
        if (!name) { alert('Введите название товара'); return; }
        if (!variants && isNaN(price)) { alert('Введите цену или добавьте варианты'); return; }
        
        if (isNaN(price) || price < 0) price = 0;
        if (variants && variants.length > 0) price = null;
        if (!price && (!variants || variants.length === 0)) price = 0;
        
        for (let i = 0; i < currentImages.length; i++) {
            if (currentImages[i].startsWith('blob:')) {
                const response = await fetch(currentImages[i]);
                const blob = await response.blob();
                const file = new File([blob], 'image.jpg', { type: blob.type });
                const uploadedUrl = await uploadToCloudinary(file);
                if (uploadedUrl) currentImages[i] = uploadedUrl;
            }
        }
        
        const imageInput = document.getElementById('productImageFile');
        if (imageInput.files.length > 0) {
            for (const file of imageInput.files) {
                const uploadedUrl = await uploadToCloudinary(file);
                if (uploadedUrl) currentImages.push(uploadedUrl);
            }
        }
        
        const cleanImages = currentImages.filter(img => img && !img.startsWith('blob:'));
        const images = cleanImages.length > 0 ? cleanImages : [];
        const mainImage = images.length > 0 ? images[0] : 'https://placehold.co/400x400/e9eef3/8b9cb0?text=No+Image';
        
        const productData = { id: id || name.toLowerCase().replace(/[^a-zа-я0-9]/g, '-') + '-' + Date.now(), name, category, image: mainImage, images, description, inStock, price, variants };
        
        await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        await loadProductsFromDB();
        hideProductModal();
        updateCategoryButtons();
        renderProducts(products);
    } finally {
        isSaving = false;
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить';
    }
}

async function deleteProduct(id) {
    if (confirm('Удалить товар навсегда?')) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        await loadProductsFromDB();
        updateCategoryButtons();
        renderProducts(products);
    }
}

async function archiveProduct(id) {
    await fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true, inStock: false }) });
    await loadProductsFromDB();
    renderProducts(products);
}

async function restoreProduct(id) {
    await fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: false }) });
    await loadProductsFromDB();
    renderProducts(products);
}

function toggleArchived() {
    showArchived = !showArchived;
    renderProducts(products);
}

function initAdminProducts() {
    document.getElementById('productSave').addEventListener('click', saveProduct);
    document.getElementById('productCancel').addEventListener('click', hideProductModal);
    document.getElementById('addVariant').addEventListener('click', () => addVariantRow());
    
    document.getElementById('productImageFile').addEventListener('change', function() {
        const files = this.files;
        if (files.length > 0) {
            document.getElementById('imageError').textContent = '';
            for (const file of files) {
                if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
                    document.getElementById('imageError').textContent = 'Допустимые форматы: JPG, PNG, WEBP, GIF';
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    document.getElementById('imageError').textContent = 'Максимальный размер файла: 10 МБ';
                    return;
                }
                currentImages.push(URL.createObjectURL(file));
            }
            renderImagePreviews();
            this.value = '';
        }
    });
    
    document.getElementById('removeMainImage').addEventListener('click', async function() {
        if (confirm('Удалить ВСЕ фото?')) {
            for (const img of currentImages) {
                if (img && !img.startsWith('blob:')) {
                    await fetch('/api/delete-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrl: img })
                    });
                }
            }
            currentImages = [];
            renderImagePreviews();
        }
    });
}
