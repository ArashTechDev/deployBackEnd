// backend/src/controllers/dietaryRestrictions.controller.js
const DietaryRestriction = require('../db/models/DietaryRestriction.model');
const UserDietaryPreference = require('../db/models/UserDietaryPreference.model');

/**
 * Create new dietary restriction (Admin only)
 */
exports.createRestriction = async (req, res) => {
  try {
    const restrictionData = req.body;

    // Basic validation
    if (!restrictionData.name || !restrictionData.category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required',
      });
    }

    const restriction = new DietaryRestriction(restrictionData);
    await restriction.save();

    res.status(201).json({
      success: true,
      message: 'Dietary restriction created successfully',
      data: restriction,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Dietary restriction with this name already exists',
      });
    }

    console.error('Error creating restriction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dietary restriction',
    });
  }
};

/**
 * Get all dietary restrictions (Admin only)
 */
exports.getAllRestrictions = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isAllergen } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isAllergen !== undefined) filter.isAllergen = isAllergen === 'true';

    const restrictions = await DietaryRestriction.find(filter)
      .sort({ category: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DietaryRestriction.countDocuments(filter);

    res.json({
      success: true,
      data: restrictions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching restrictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dietary restrictions',
    });
  }
};

/**
 * Update dietary restriction (Admin only)
 */
exports.updateRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const restriction = await DietaryRestriction.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: 'Dietary restriction not found',
      });
    }

    res.json({
      success: true,
      message: 'Dietary restriction updated successfully',
      data: restriction,
    });
  } catch (error) {
    console.error('Error updating restriction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dietary restriction',
    });
  }
};

/**
 * Delete dietary restriction (Admin only)
 */
exports.deleteRestriction = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if restriction is in use
    const isInUse = await UserDietaryPreference.exists({
      restrictionId: id,
      isActive: true,
    });

    if (isInUse) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete dietary restriction that is currently in use',
      });
    }

    const restriction = await DietaryRestriction.findByIdAndDelete(id);

    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: 'Dietary restriction not found',
      });
    }

    res.json({
      success: true,
      message: 'Dietary restriction deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting restriction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dietary restriction',
    });
  }
};
