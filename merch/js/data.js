function formatPrice(value) {
    if (!value) return 'По запросу';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(value);
}

function isProductAvailable(product) {
    if (product.variants && product.variants.length > 0) {
        return product.variants.some(v => v.inStock !== false);
    }
    return product.inStock !== false;
}
