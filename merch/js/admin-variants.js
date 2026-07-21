function addVariantRow(label = '', price = '', inStock = true, image = '', description = '') {
    const container = document.getElementById('variantsList');
    const row = document.createElement('div');
    row.className = 'variant-row';
    row.innerHTML = `
        <button class="variant-up" title="Вверх">↑</button>
        <button class="variant-down" title="Вниз">↓</button>
        <input type="text" class="variant-label" placeholder="Название" value="${label}">
        <input type="number" class="variant-price" placeholder="Цена" value="${price}">
        <input type="file" class="variant-image-file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;">
        <button class="variant-image-btn" title="Загрузить фото">🖼️</button>
        <img class="variant-preview" src="${image}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;display:${image ? 'block' : 'none'};">
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
            row.querySelector('.variant-preview').src = URL.createObjectURL(file);
            row.querySelector('.variant-preview').style.display = 'block';
        }
    });
    
    container.appendChild(row);
}

function getVariantsFromForm() {
    const rows = document.querySelectorAll('.variant-row');
    const variants = [];
    rows.forEach(row => {
        const label = row.querySelector('.variant-label').value.trim();
        const price = parseInt(row.querySelector('.variant-price').value);
        const description = row.querySelector('.variant-description').value.trim();
        const inStock = row.querySelector('.variant-stock').checked;
        let image = row.querySelector('.variant-preview').src;
        const fileInput = row.querySelector('.variant-image-file');
        
        if (label && !isNaN(price)) {
            if (fileInput.files.length > 0) image = URL.createObjectURL(fileInput.files[0]);
            variants.push({ label, price, inStock, image: image || '', description });
        }
    });
    return variants.length > 0 ? variants : null;
}
