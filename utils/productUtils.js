// utils/productUtils.js
// Utility functions for product-related operations

/**
 * Calculate selling price from price tiers or fallback to purchase price
 * @param {Object} product - Product object that may contain priceTiers and purchasePrice
 * @returns {number} Selling price
 */
export function calculateSellingPrice(product) {
  // Use first price tier as sellingPrice if available
  if (product.priceTiers && product.priceTiers.length > 0) {
    return product.priceTiers[0].price || 0;
  }
  
  // Fallback to purchasePrice if no tiers
  return product.purchasePrice || 0;
}

/**
 * Transform product array to include calculated sellingPrice
 * @param {Array} products - Array of product objects
 * @returns {Array} Transformed products with sellingPrice
 */
export function transformProductsForDisplay(products) {
  return (products || []).map(product => ({
    ...product,
    sellingPrice: calculateSellingPrice(product)
  }));
}