// backend/src/utils/validators.js
const validateInventoryItem = (data) => {
  const errors = [];
  
  if (!data.item_name || data.item_name.trim().length === 0) {
    errors.push('Item name is required');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (!data.foodbank_id || isNaN(parseInt(data.foodbank_id))) {
    errors.push('Valid foodbank ID is required');
  }
  
  if (data.quantity === undefined || data.quantity === null || data.quantity < 0) {
    errors.push('Valid quantity is required');
  }
  
  if (data.minimum_stock_level !== undefined && data.minimum_stock_level < 0) {
    errors.push('Minimum stock level must be non-negative');
  }
  
  if (data.expiration_date && !isValidDate(data.expiration_date)) {
    errors.push('Invalid expiration date format');
  }
  
  return errors;
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const validateSearchFilters = (filters) => {
  const validSortColumns = ['item_name', 'category', 'quantity', 'expiration_date', 'date_added'];
  const validSortOrders = ['ASC', 'DESC'];
  
  if (filters.sort_by && !validSortColumns.includes(filters.sort_by)) {
    filters.sort_by = 'date_added';
  }
  
  if (filters.sort_order && !validSortOrders.includes(filters.sort_order.toUpperCase())) {
    filters.sort_order = 'DESC';
  }
  
  if (filters.page && (isNaN(parseInt(filters.page)) || parseInt(filters.page) < 1)) {
    filters.page = 1;
  }
  
  if (filters.limit && (isNaN(parseInt(filters.limit)) || parseInt(filters.limit) < 1 || parseInt(filters.limit) > 100)) {
    filters.limit = 20;
  }
  
  return filters;
};

module.exports = {
  validateInventoryItem,
  validateSearchFilters,
  isValidDate
};