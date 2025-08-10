/* eslint-disable no-unused-vars */
// backend/src/api/routes/inventory.js
const express = require('express');
const router = express.Router();
const Inventory = require('../../db/models/Inventory');
const { authenticate, authorize } = require('../../middleware/auth');
const { authMiddleware, requireRole } = require('../../middleware/authMiddleware'); // Use existing middleware
const { catchAsync } = require('../../utils/errors');

// Apply authentication to all inventory routes
router.use(authMiddleware);

// GET /api/inventory - Get all inventory items with filtering and pagination
router.get(
  '/',
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      foodbank_id,
      low_stock,
      dietary_category,
      sort = '-date_added',
    } = req.query;

    // Build query
    let query = {};

    // Filter by foodbank for non-admin users
    if (req.user.role !== 'admin' && req.user.foodbank_id) {
      query.foodbank_id = req.user.foodbank_id;
    } else if (foodbank_id) {
      query.foodbank_id = foodbank_id;
    }

    if (search) {
      query.$or = [
        { item_name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (low_stock === 'true') query.low_stock = true;
    if (dietary_category) query.dietary_category = dietary_category;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const total = await Inventory.countDocuments(query);

    const items = await Inventory.find(query)
      .populate('foodbank_id', 'name location')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  })
);

// POST /api/inventory - Create new inventory item
router.post(
  '/',
  requireRole('admin', 'staff'),
  catchAsync(async (req, res) => {
    const itemData = {
      ...req.body,
      foodbank_id: req.user.foodbank_id || req.body.foodbank_id,
      created_by: req.user.id,
    };

    const item = await Inventory.create(itemData);
    await item.populate('foodbank_id', 'name location');

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: item,
    });
  })
);

// GET /api/inventory/:id - Get single inventory item
router.get(
  '/:id',
  catchAsync(async (req, res) => {
    const item = await Inventory.findById(req.params.id).populate('foodbank_id', 'name location');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  })
);

// PUT /api/inventory/:id - Update inventory item
router.put(
  '/:id',
  requireRole('admin', 'staff'),
  catchAsync(async (req, res) => {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_by: req.user.id },
      { new: true, runValidators: true }
    ).populate('foodbank_id', 'name location');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item,
    });
  })
);

// DELETE /api/inventory/:id - Delete inventory item
router.delete(
  '/:id',
  requireRole('admin', 'staff'),
  catchAsync(async (req, res) => {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  })
);

// PATCH /api/inventory/:id/quantity - Quick quantity update
router.patch(
  '/:id/quantity',
  requireRole('admin', 'staff'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { quantity, adjustment, updated_by } = req.body;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found',
      });
    }

    let updatedItem;
    if (quantity !== undefined) {
      updatedItem = await item.updateQuantity(parseInt(quantity), req.user.id);
    } else if (adjustment !== undefined) {
      updatedItem = await item.adjustQuantity(parseInt(adjustment), req.user.id);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either quantity or adjustment must be provided',
      });
    }

    await updatedItem.populate('foodbank_id', 'name');

    res.json({
      success: true,
      message: 'Quantity updated successfully',
      data: updatedItem,
    });
  })
);

// GET /api/inventory/meta/categories - Get available categories
router.get(
  '/meta/categories',
  catchAsync(async (req, res) => {
    try {
      // Get distinct categories from existing inventory items
      const categories = await Inventory.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { category: 1 },
        },
      ]);

      res.json({
        success: true,
        data: categories.map(cat => cat.category), // Return just the category names
        categories: categories, // Also return with counts for compatibility
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
      });
    }
  })
);

// GET /api/inventory/meta/dietary-categories - Get dietary categories enum
router.get(
  '/meta/dietary-categories',
  catchAsync(async (req, res) => {
    try {
      // Get the dietary categories from the Inventory model schema
      const Inventory = require('../../db/models/Inventory');
      const dietaryCategories = Inventory.schema.paths.dietary_category.enumValues;

      res.json({
        success: true,
        data: dietaryCategories,
        dietary_categories: dietaryCategories, // For compatibility
      });
    } catch (error) {
      console.error('Error fetching dietary categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dietary categories',
      });
    }
  })
);

// GET /api/inventory/stats - Get inventory statistics
router.get(
  '/stats',
  catchAsync(async (req, res) => {
    try {
      const totalItems = await Inventory.countDocuments();
      const lowStockItems = await Inventory.countDocuments({ low_stock: true });
      const expiringItems = await Inventory.countDocuments({
        expiration_date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      const categoryStats = await Inventory.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
          },
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            totalQuantity: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          totalItems,
          lowStockItems,
          expiringItems,
          categoryStats,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
      });
    }
  })
);

// GET /api/inventory/alerts/low-stock - Get low stock alerts
router.get(
  '/alerts/low-stock',
  catchAsync(async (req, res) => {
    try {
      const lowStockItems = await Inventory.find({ low_stock: true })
        .populate('foodbank_id', 'name location')
        .sort({ quantity: 1 });

      res.json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
      });
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock alerts',
      });
    }
  })
);

// GET /api/inventory/alerts/expiring - Get expiring items
router.get(
  '/alerts/expiring',
  catchAsync(async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const daysAhead = parseInt(days);

      const expiringItems = await Inventory.find({
        expiration_date: {
          $gte: new Date(),
          $lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
        },
      })
        .populate('foodbank_id', 'name location')
        .sort({ expiration_date: 1 });

      // Add days_until_expiration field
      const itemsWithDays = expiringItems.map(item => ({
        ...item.toObject(),
        days_until_expiration: Math.ceil(
          (item.expiration_date - new Date()) / (1000 * 60 * 60 * 24)
        ),
      }));

      res.json({
        success: true,
        data: itemsWithDays,
        items: itemsWithDays, // For compatibility
        count: itemsWithDays.length,
      });
    } catch (error) {
      console.error('Error fetching expiring items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expiring items',
      });
    }
  })
);

module.exports = router;
