// example usage file (e.g., in a script or controller)
const {
  fetchAllItems,
  fetchItemById,
  createItem,
} = require('./services/donationItemsService');

async function demo() {
  const items = await fetchAllItems();
  console.log('All items:', items);

  const newItem = await createItem({
    donation_id: '666aefde8cdd8ae5d73fc101',
    item_name: 'Canned Beans',
    quantity: 10,
    category: 'Canned',
  });
  console.log('Created:', newItem);
}

demo();