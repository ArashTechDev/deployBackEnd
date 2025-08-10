const express = require('express');
const router = express.Router();
const StorageLocation = require('../db/models/StorageLocation');

// Get storage locations (optionally filtered by foodBankId)
router.get('/', async (req, res) => {
  try {
    const { foodBankId } = req.query;
    const filter = foodBankId ? { foodBank: foodBankId } : {}; 

    const locations = await StorageLocation.find(filter);
    res.json(locations);
  } catch (error) {
    console.error('Failed to fetch storage locations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new storage location
router.post('/', async (req, res) => {
  try {
    const { name, foodBank } = req.body; 

    if (!name || !foodBank) {
      return res.status(400).json({ error: 'Missing name or foodBank' });
    }

    const location = new StorageLocation({ name, foodBank });
    const savedLocation = await location.save();

    res.status(201).json(savedLocation);
  } catch (error) {
    console.error('Failed to create storage location:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a storage location
router.put('/:id', async (req, res) => {
  try {
    const location = await StorageLocation.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Not found' });

    Object.assign(location, req.body);
    const savedLocation = await location.save();

    res.json(savedLocation);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update storage location' });
  }
});

// Delete a storage location
router.delete('/:id', async (req, res) => {
  try {
    const location = await StorageLocation.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Not found' });

    await StorageLocation.deleteOne({ _id: req.params.id });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete storage location:', error);
    res.status(400).json({ error: 'Failed to delete storage location' });
  }
});


module.exports = router;
