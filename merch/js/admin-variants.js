function addVariantRow(label = '', price = '', inStock = true, image = '', description = '') {
    const container = document.getElementById('variantsList');
    const hasValidImage = image && image.startsWith('http') && !image.includes('vercel.app');
    const row = document.createElement('div');
    row.className = 'variant-row';
    row.innerHTML = `
        <button class="variant-up" title="Вверх">↑</button>
        <button class="variant-down" title="Вниз">↓</button>
        <input type="text" class="variant-label" placeholder="Название" value="${label}">
        <input type="number" class="variant-price" placeholder="Цена" value="${price}">
        <input type="file" class="variant-image-file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;">
        <button class="variant-image-btn" title="Загрузить фото">🖼️</button>
        <img class="variant-preview" src="${hasValidImage ? image : ''}" data-saved-url="${hasValidImage ? image : ''}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;display:${hasValidImage ? 'block' : 'none'};" onerror="this.style.display='none'">
        <input type="text" class="variant-description" placeholder="Описание" value="${description}">
        <label class="variant-stock-label"><input type="checkbox" class="variant-stock" ${inStock ? 'checked' : ''}></label>
        <button class="remove-variant">✕</button>
    `;
    
    row.querySelector('.remove-variant').addEventListener('click', () => row.remove());
    row.querySelector('.variant-up').addEventListener('click', () => {
        const prev = row.previousElementSibling;
        if (prev && prev.classList.contains('variant-row')) container.insertBefore(row, prev);
    });
    row.querySelector('.variant-down').addEventListener('click', () => {
        const next = row.nextElementSibling;
        if (next && next.classList.contains('variant-row')) container.insertBefore(next, row);
    });
    row.querySelector('.variant-image-btn').addEventListener('click', () => row.querySelector('.variant-image-file').click());
    row.querySelector('.variant-image-file').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const preview = row.querySelector('.variant-preview');
            preview.src = url;
            preview.style.display = 'block';
            preview.setAttribute('data-saved-url', '');
        }
    });
    
    container.appendChild(row);
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'chsu_merch');
    const res = await fetch('https://api.cloudinary.com/v1_1/sd0mazc2/image/upload', { method: 'POST', body: formData });
    if (res.ok) {
        const data = await res.json();
        return data.secure_url;
    }
    return null;
}

async function getVariantsFromForm() {
    const rows = document.querySelectorAll('.variant-row');
    const variants = [];
    for (const row of rows) {
        const label = row.querySelector('.variant-label').value.trim();
        const price = parseInt(row.querySelector('.variant-price').value);
        const description = row.querySelector('.variant-description').value.trim();
        const inStock = row.querySelector('.variant-stock').checked;
        const previewImg = row.querySelector('.variant-preview');
        let imageUrl = previewImg.getAttribute('data-saved-url') || '';
        const fileInput = row.querySelector('.variant-image-file');
        
        if (label && !isNaN(price)) {
            if (fileInput.files.length > 0) {
                const uploadedUrl = await uploadToCloudinary(fileInput.files[0]);
                if (uploadedUrl) imageUrl = uploadedUrl;
            }
            if (imageUrl && imageUrl.startsWith('blob:')) imageUrl = '';
            if (imageUrl && imageUrl.includes('vercel.app')) imageUrl = '';
            variants.push({ label, price, inStock, image: imageUrl || '', description });
        }
    }
    return variants.length > 0 ? variants : null;
}
