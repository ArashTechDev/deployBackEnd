// backend/src/controllers/dietaryPreferences.controller.js
const UserDietaryPreference = require('../db/models/UserDietaryPreference.model');
const DietaryRestriction = require('../db/models/DietaryRestriction.model');
const DietaryMatchingService = require('../db/services/DietaryMatchingService');

/**
 * Get user's dietary preferences
 */
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await UserDietaryPreference.find({
      userId,
      isActive: true,
    })
      .populate({
        path: 'restrictionId',
        select: 'name category description isAllergen severityLevels',
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dietary preferences',
    });
  }
};

/**
 * Update user's dietary preferences
 */
exports.updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    // Validate input
    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        message: 'Preferences must be an array',
      });
    }

    // Deactivate all existing preferences for this user
    await UserDietaryPreference.updateMany({ userId }, { isActive: false });

    // Create new preferences
    const newPreferences = [];
    for (const pref of preferences) {
      // Validate each preference
      if (!pref.restrictionId || !pref.severity) {
        continue; // Skip invalid preferences
      }

      newPreferences.push({
        userId,
        restrictionId: pref.restrictionId,
        severity: pref.severity,
        notes: pref.notes || '',
        isActive: true,
      });
    }

    // Insert new preferences
    if (newPreferences.length > 0) {
      await UserDietaryPreference.insertMany(newPreferences);
    }

    // Update user's dietary preferences timestamp
    const User = require('../db/models/User');
    await User.findByIdAndUpdate(userId, {
      'dietaryPreferences.lastUpdated': new Date(),
    });

    // Fetch updated preferences to return
    const updatedPreferences = await UserDietaryPreference.find({
      userId,
      isActive: true,
    }).populate('restrictionId');

    res.json({
      success: true,
      message: 'Dietary preferences updated successfully',
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dietary preferences',
    });
  }
};

/**
 * Get available dietary restrictions
 */
exports.getAvailableRestrictions = async (req, res) => {
  try {
    const { category, isAllergen } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (isAllergen !== undefined) filter.isAllergen = isAllergen === 'true';

    const restrictions = await DietaryRestriction.find(filter).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      data: restrictions,
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
 * Test dietary matching with sample inventory
 */
exports.testDietaryMatching = async (req, res) => {
  try {
    const userId = req.user.id;
    const { inventoryItems } = req.body;

    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory items provided',
      });
    }

    const matchingResults = await DietaryMatchingService.matchUserDietaryNeeds(
      userId,
      inventoryItems
    );

    res.json({
      success: true,
      data: matchingResults,
    });
  } catch (error) {
    console.error('Error in dietary matching test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test dietary matching',
    });
  }
};
