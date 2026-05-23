// Dynamic Shortcuts Manager for PWA
// Tracks user behavior and suggests dynamic shortcuts

interface ShortcutData {
  name: string;
  url: string;
  timestamp: number;
  count: number;
}

interface CategoryVisit {
  id: string;
  name: string;
  visits: number;
  lastVisit: number;
}

interface StoreVisit {
  id: string;
  name: string;
  visits: number;
  lastVisit: number;
}

const STORAGE_KEYS = {
  CATEGORIES: 'pwa_visited_categories',
  STORES: 'pwa_visited_stores',
  LAST_UPDATED: 'pwa_shortcuts_updated',
};

const MAX_TRACKED_ITEMS = 10;
const MAX_DYNAMIC_SHORTCUTS = 3;

/**
 * Track a category visit
 */
export function trackCategoryVisit(categoryId: string, categoryName: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const categories: CategoryVisit[] = stored ? JSON.parse(stored) : [];
    
    const existing = categories.find(c => c.id === categoryId);
    if (existing) {
      existing.visits += 1;
      existing.lastVisit = Date.now();
    } else {
      categories.push({
        id: categoryId,
        name: categoryName,
        visits: 1,
        lastVisit: Date.now(),
      });
    }
    
    // Sort by visits (descending) and keep only top items
    categories.sort((a, b) => b.visits - a.visits);
    const trimmed = categories.slice(0, MAX_TRACKED_ITEMS);
    
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to track category visit:', error);
  }
}

/**
 * Track a store visit
 */
export function trackStoreVisit(storeId: string, storeName: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STORES);
    const stores: StoreVisit[] = stored ? JSON.parse(stored) : [];
    
    const existing = stores.find(s => s.id === storeId);
    if (existing) {
      existing.visits += 1;
      existing.lastVisit = Date.now();
    } else {
      stores.push({
        id: storeId,
        name: storeName,
        visits: 1,
        lastVisit: Date.now(),
      });
    }
    
    // Sort by visits (descending) and keep only top items
    stores.sort((a, b) => b.visits - a.visits);
    const trimmed = stores.slice(0, MAX_TRACKED_ITEMS);
    
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to track store visit:', error);
  }
}

/**
 * Get top visited categories
 */
export function getTopCategories(limit: number = MAX_DYNAMIC_SHORTCUTS): CategoryVisit[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!stored) return [];
    
    const categories: CategoryVisit[] = JSON.parse(stored);
    return categories.slice(0, limit);
  } catch (error) {
    console.error('Failed to get top categories:', error);
    return [];
  }
}

/**
 * Get top visited stores
 */
export function getTopStores(limit: number = MAX_DYNAMIC_SHORTCUTS): StoreVisit[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STORES);
    if (!stored) return [];
    
    const stores: StoreVisit[] = JSON.parse(stored);
    return stores.slice(0, limit);
  } catch (error) {
    console.error('Failed to get top stores:', error);
    return [];
  }
}

/**
 * Generate dynamic shortcuts based on user behavior
 * Note: This returns data for display purposes. Actual PWA shortcuts
 * in manifest.json are static and cannot be updated dynamically.
 * However, this data can be used to show personalized quick links in the UI.
 */
export function getDynamicShortcuts(): ShortcutData[] {
  const shortcuts: ShortcutData[] = [];
  
  // Get top categories
  const topCategories = getTopCategories(2);
  topCategories.forEach(cat => {
    shortcuts.push({
      name: `Browse ${cat.name}`,
      url: `/search?category=${cat.id}`,
      timestamp: cat.lastVisit,
      count: cat.visits,
    });
  });
  
  // Get top stores
  const topStores = getTopStores(1);
  topStores.forEach(store => {
    shortcuts.push({
      name: store.name,
      url: `/store/${store.id}`,
      timestamp: store.lastVisit,
      count: store.visits,
    });
  });
  
  return shortcuts.slice(0, MAX_DYNAMIC_SHORTCUTS);
}

/**
 * Clear all tracked data
 */
export function clearTrackingData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
  } catch (error) {
    console.error('Failed to clear tracking data:', error);
  }
}

/**
 * Get statistics about tracked data
 */
export function getTrackingStats() {
  const categories = getTopCategories(MAX_TRACKED_ITEMS);
  const stores = getTopStores(MAX_TRACKED_ITEMS);
  
  return {
    totalCategories: categories.length,
    totalStores: stores.length,
    topCategory: categories[0]?.name || null,
    topStore: stores[0]?.name || null,
    lastUpdated: localStorage.getItem(STORAGE_KEYS.LAST_UPDATED) || null,
  };
}

/**
 * Hook to use in React components
 */
export function useShortcutTracking() {
  return {
    trackCategoryVisit,
    trackStoreVisit,
    getTopCategories,
    getTopStores,
    getDynamicShortcuts,
    clearTrackingData,
    getTrackingStats,
  };
}
