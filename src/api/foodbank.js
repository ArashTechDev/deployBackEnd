const express = require('express');
const router = express.Router();
const FoodBank = require('../db/models/FoodBank');
const StorageLocation = require('../db/models/StorageLocation');
const geocodeAddress = require('../utils/geocodeAddress');
const { validateCreateFoodBank, validateUpdateFoodBank } = require('../middleware/validateFoodBank');

// GET all food banks
router.get('/', async (req, res) => {
  try {
    const foodBanks = await FoodBank.find();
    res.json(foodBanks);
  } catch (err) {
    console.error('Error fetching food banks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single food bank with its storage locations
router.get('/:id', async (req, res) => {
  try {
    const foodBank = await FoodBank.findById(req.params.id);
    if (!foodBank) return res.status(404).json({ error: 'Not found' });

    const storageLocations = await StorageLocation.find({ foodBank: foodBank._id });

    res.json({
      ...foodBank.toObject(),
      storageLocations
    });
  } catch (err) {
    console.error('Error fetching food bank with storage locations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE new food bank
router.post('/', validateCreateFoodBank, async (req, res) => {
  try {
    const {
      name, address, city, province, postalCode,
      contactEmail, contactPhone, operatingHours
    } = req.body;

    const fullAddress = `${address}, ${city}, ${province}, ${postalCode}`;
    const { latitude, longitude } = await geocodeAddress(fullAddress);

    const newFB = new FoodBank({
      name,
      address,
      city,
      province,
      postalCode,
      contactEmail,
      contactPhone,
      operatingHours,
      latitude,
      longitude
    });

    const savedFB = await newFB.save();
    res.status(201).json(savedFB);
  } catch (err) {
    console.error('Error creating food bank:', err);
    res.status(400).json({ error: 'Failed to create food bank', details: err.message });
  }
});

// UPDATE a food bank
router.put('/:id', validateUpdateFoodBank, async (req, res) => {
  try {
    const foodBank = await FoodBank.findById(req.params.id);
    if (!foodBank) return res.status(404).json({ error: 'Not found' });

    const updatedFields = { ...req.body };
    const needsGeocode = updatedFields.address || updatedFields.city || updatedFields.province || updatedFields.postalCode;

    if (needsGeocode) {
      const fullAddress = `${updatedFields.address || foodBank.address}, ${updatedFields.city || foodBank.city}, ${updatedFields.province || foodBank.province}, ${updatedFields.postalCode || foodBank.postalCode}`;
      const { latitude, longitude } = await geocodeAddress(fullAddress);
      updatedFields.latitude = latitude;
      updatedFields.longitude = longitude;
    }

    Object.assign(foodBank, updatedFields);
    const savedFB = await foodBank.save();

    res.json(savedFB);
  } catch (err) {
    console.error('Error updating food bank:', err);
    res.status(400).json({ error: 'Failed to update food bank', details: err.message });
  }
});

// DELETE /api/storage/:id
router.delete('/:id', async (req, res) => {
  try {
    const foodBank = await FoodBank.findById(req.params.id);
    if (!foodBank) return res.status(404).json({ error: 'Not found' });

    await FoodBank.deleteOne({ _id: req.params.id });

    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete food bank:', err);
    res.status(400).json({ error: 'Failed to delete food bank' });
  }
});

module.exports = router;
