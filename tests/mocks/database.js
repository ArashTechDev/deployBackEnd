// backend/tests/mocks/database.js
// Mock database operations

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
};

// Mock successful database responses
const mockInventoryData = [
  {
    inventory_id: 1,
    foodbank_id: 1,
    item_name: 'Canned Beans',
    category: 'Canned Goods',
    quantity: 100,
    minimum_stock_level: 20,
    expiry_date: '2024-12-31',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    inventory_id: 2,
    foodbank_id: 1,
    item_name: 'Rice',
    category: 'Grains',
    quantity: 50,
    minimum_stock_level: 10,
    expiry_date: '2025-06-30',
    created_at: new Date(),
    updated_at: new Date()
  }
];

const mockUserData = {
  user_id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: '$2a$10$test',
  full_name: 'Test User',
  role: 'Staff'
};

// Setup default mock responses
mockPool.query.mockImplementation((query) => {
  if (query.includes('SELECT') && query.includes('inventory')) {
    return Promise.resolve({ rows: mockInventoryData });
  }
  if (query.includes('INSERT') && query.includes('inventory')) {
    return Promise.resolve({ 
      rows: [{ ...mockInventoryData[0], inventory_id: Date.now() }] 
    });
  }
  if (query.includes('UPDATE') && query.includes('inventory')) {
    return Promise.resolve({ rows: [mockInventoryData[0]] });
  }
  if (query.includes('DELETE') && query.includes('inventory')) {
    return Promise.resolve({ rowCount: 1 });
  }
  if (query.includes('users')) {
    return Promise.resolve({ rows: [mockUserData] });
  }
  // Default response
  return Promise.resolve({ rows: [] });
});

module.exports = {
  mockPool,
  mockInventoryData,
  mockUserData
};