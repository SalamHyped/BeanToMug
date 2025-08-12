/**
 * VAT Utility Functions
 * Handles VAT rate fetching and calculations using current database values
 */

const { dbSingleton } = require('../dbSingleton');

/**
 * Get current VAT rate from database
 * @param {Object} connection - Database connection (optional, will get new one if not provided)
 * @returns {Promise<number>} Current VAT rate as percentage
 */
async function getCurrentVATRate(connection = null) {
  let shouldGetNewConnection = !connection;
  
  try {
    if (shouldGetNewConnection) {
      connection = await dbSingleton.getConnection();
    }
    
    const [vatConfig] = await connection.execute(
      "SELECT vat_rate FROM vat_config ORDER BY id DESC LIMIT 1"
    );
    
    if (vatConfig.length === 0) {
      console.warn('No VAT rate found in database, using default 15%');
      return 15.00;
    }
    
    const vatRate = parseFloat(vatConfig[0].vat_rate);
    if (isNaN(vatRate) || vatRate < 0) {
      console.warn('Invalid VAT rate in database, using default 15%');
      return 15.00;
    }
    
    return vatRate;
  } catch (error) {
    console.error('Error fetching VAT rate from database:', error);
    console.warn('Using default VAT rate 15% due to database error');
    return 15.00; // Default fallback
  }
  // Note: We don't release the connection as it's managed by the caller
}

/**
 * Calculate VAT amount for a given subtotal
 * @param {number} subtotal - Price before VAT
 * @param {number} vatRate - VAT rate as percentage
 * @returns {number} VAT amount
 */
function calculateVATAmount(subtotal, vatRate) {
  return (subtotal * vatRate) / 100;
}

/**
 * Calculate VAT-inclusive total price
 * @param {number} subtotal - Price before VAT
 * @param {number} vatRate - VAT rate as percentage
 * @returns {number} Total price including VAT
 */
function calculateTotalWithVAT(subtotal, vatRate) {
  const vatAmount = calculateVATAmount(subtotal, vatRate);
  return subtotal + vatAmount;
}

module.exports = {
  getCurrentVATRate,
  calculateVATAmount,
  calculateTotalWithVAT
};
