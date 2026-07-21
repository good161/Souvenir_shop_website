let currentSortMode = 'default';
let currentCategory = 'all';
let searchQuery = '';

function getFilteredProducts(products) {
    let filtered = [...products];
    
    if (!isAdmin) {
        filtered = filtered.filter(p => !p.archived);
    }
    
    if (isAdmin && !showArchived) {
        filtered = filtered.filter(p => !p.archived);
    }
    
    if (isAdmin && showArchived) {
        filtered = filtered.filter(p => p.archived === true);
    }
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        
        filtered = filtered.filter(product => {
            const searchText = [
                product.name || '',
                product.description || '',
                product.category || ''
            ].join(' ').toLowerCase();
            
            return queryWords.every(word => searchText.includes(word));
        });
    }
    
    return filtered;
}

function getSortedProducts(filteredProducts) {
    let sorted = [...filteredProducts];
    
    sorted.sort((a, b) => {
        const aAvailable = isProductAvailable(a) ? 0 : 1;
        const bAvailable = isProductAvailable(b) ? 0 : 1;
        return aAvailable - bAvailable;
    });
    
    if (currentSortMode === 'asc') {
        sorted.sort((a, b) => {
            const aAvailable = isProductAvailable(a) ? 0 : 1;
            const bAvailable = isProductAvailable(b) ? 0 : 1;
            
            if (aAvailable !== bAvailable) {
                return aAvailable - bAvailable;
            }
            
            const priceA = a.variants ? Math.min(...a.variants.map(v => v.price)) : (a.price || 0);
            const priceB = b.variants ? Math.min(...b.variants.map(v => v.price)) : (b.price || 0);
            return priceA - priceB;
        });
    } else if (currentSortMode === 'desc') {
        sorted.sort((a, b) => {
            const aAvailable = isProductAvailable(a) ? 0 : 1;
            const bAvailable = isProductAvailable(b) ? 0 : 1;
            
            if (aAvailable !== bAvailable) {
                return aAvailable - bAvailable;
            }
            
            const priceA = a.variants ? Math.max(...a.variants.map(v => v.price)) : (a.price || 0);
            const priceB = b.variants ? Math.max(...b.variants.map(v => v.price)) : (b.price || 0);
            return priceB - priceA;
        });
    }
    
    return sorted;
}
