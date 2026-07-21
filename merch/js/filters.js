let currentSortMode = 'name';
let currentCategory = 'all';
let searchQuery = '';

function getFilteredProducts(products) {
    let filtered = [...products];
    
    if (!isAdmin) filtered = filtered.filter(p => !p.archived);
    if (isAdmin && !showArchived) filtered = filtered.filter(p => !p.archived);
    if (isAdmin && showArchived) filtered = filtered.filter(p => p.archived === true);
    if (currentCategory !== 'all') filtered = filtered.filter(p => p.category === currentCategory);
    
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    
    return filtered;
}

function getSortedProducts(filtered) {
    let sorted = [...filtered];
    sorted.sort((a, b) => (isProductAvailable(a) ? 0 : 1) - (isProductAvailable(b) ? 0 : 1));
    
    if (currentSortMode === 'name') {
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'));
    } else if (currentSortMode === 'asc') {
        sorted.sort((a, b) => {
            const pA = a.variants ? Math.min(...a.variants.map(v => v.price)) : (a.price || 0);
            const pB = b.variants ? Math.min(...b.variants.map(v => v.price)) : (b.price || 0);
            return pA - pB;
        });
    } else if (currentSortMode === 'desc') {
        sorted.sort((a, b) => {
            const pA = a.variants ? Math.max(...a.variants.map(v => v.price)) : (a.price || 0);
            const pB = b.variants ? Math.max(...b.variants.map(v => v.price)) : (b.price || 0);
            return pB - pA;
        });
    }
    
    return sorted;
}
