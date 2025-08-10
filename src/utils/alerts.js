// backend/src/utils/alerts.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bytebasket',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

class AlertSystem {
  static async checkLowStockItems() {
    try {
      const query = `
        UPDATE inventory 
        SET low_stock = (quantity <= minimum_stock_level)
        WHERE low_stock != (quantity <= minimum_stock_level)
      `;
      await pool.query(query);
      
      const alertQuery = `
        SELECT i.*, f.name as foodbank_name 
        FROM inventory i 
        LEFT JOIN foodbanks f ON i.foodbank_id = f.foodbank_id 
        WHERE i.low_stock = true
      `;
      const result = await pool.query(alertQuery);
      return result.rows;
    } catch (error) {
      console.error('Error checking low stock items:', error);
      return [];
    }
  }

  static async checkExpiringItems(days = 7) {
    try {
      const query = `
        SELECT i.*, f.name as foodbank_name 
        FROM inventory i 
        LEFT JOIN foodbanks f ON i.foodbank_id = f.foodbank_id 
        WHERE i.expiration_date <= CURRENT_DATE + INTERVAL '${days} days' 
        AND i.expiration_date >= CURRENT_DATE
        ORDER BY i.expiration_date ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error checking expiring items:', error);
      return [];
    }
  }

  static async getAllAlerts() {
    const [lowStock, expiring] = await Promise.all([
      this.checkLowStockItems(),
      this.checkExpiringItems()
    ]);
    
    return {
      lowStock,
      expiring,
      totalAlerts: lowStock.length + expiring.length
    };
  }
}

module.exports = AlertSystem;