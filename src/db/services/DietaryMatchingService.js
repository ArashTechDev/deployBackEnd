// backend/src/services/DietaryMatchingService.js
const UserDietaryPreference = require('../models/UserDietaryPreference.model');
const DietaryRestriction = require('../models/DietaryRestriction.model');

class DietaryMatchingService {
  constructor() {
    this.mismatchLog = []; // Store mismatches for review
  }

  /**
   * Main function: Match inventory items with user's dietary needs
   * @param {String} userId - User's MongoDB ObjectId
   * @param {Array} inventoryItems - Array of inventory items
   * @returns {Object} Matching results with compatible/incompatible items
   */
  async matchUserDietaryNeeds(userId, inventoryItems) {
    try {
      const startTime = Date.now();

      // Get user's dietary preferences
      const userPreferences = await this.getUserDietaryPreferences(userId);

      // If user has no dietary restrictions, all items are compatible
      if (!userPreferences || userPreferences.length === 0) {
        return {
          compatibleItems: inventoryItems,
          incompatibleItems: [],
          warnings: [],
          matchingTime: Date.now() - startTime,
          totalProcessed: inventoryItems.length,
        };
      }

      const results = {
        compatibleItems: [],
        incompatibleItems: [],
        warnings: [],
        matchingTime: 0,
        totalProcessed: inventoryItems.length,
        strictExclusions: 0,
        mildExclusions: 0,
      };

      // Process each inventory item
      for (const item of inventoryItems) {
        const matchResult = await this.checkItemCompatibility(item, userPreferences);

        if (matchResult.isCompatible) {
          results.compatibleItems.push({
            ...item,
            matchConfidence: matchResult.confidence,
            warnings: matchResult.warnings,
          });
        } else {
          results.incompatibleItems.push({
            ...item,
            exclusionReason: matchResult.reason,
            severity: matchResult.severity,
            conflictingRestrictions: matchResult.conflictingRestrictions,
          });

          // Track exclusion statistics
          if (matchResult.severity === 'strict') {
            results.strictExclusions++;
          } else {
            results.mildExclusions++;
          }

          // Log mismatch for admin review
          this.logMismatch(userId, item, matchResult);
        }

        // Add any warnings to the results
        if (matchResult.warnings.length > 0) {
          results.warnings.push(...matchResult.warnings);
        }
      }

      results.matchingTime = Date.now() - startTime;
      return results;
    } catch (error) {
      console.error('Error in dietary matching:', error);
      throw new Error('Failed to process dietary matching');
    }
  }

  /**
   * Get user's dietary preferences with populated restriction details
   * @param {String} userId - User's MongoDB ObjectId
   * @returns {Array} Array of user's dietary preferences
   */
  async getUserDietaryPreferences(userId) {
    return await UserDietaryPreference.find({
      userId,
      isActive: true,
    })
      .populate({
        path: 'restrictionId',
        select: 'name category isAllergen severityLevels',
        match: { isActive: true },
      })
      .lean();
  }

  /**
   * Check if an inventory item is compatible with user's dietary restrictions
   * @param {Object} item - Inventory item
   * @param {Array} userPreferences - User's dietary preferences
   * @returns {Object} Compatibility result
   */
  async checkItemCompatibility(item, userPreferences) {
    const result = {
      isCompatible: true,
      confidence: 1.0,
      warnings: [],
      reason: null,
      severity: null,
      conflictingRestrictions: [],
    };

    // For now, we'll do basic matching based on item category and name
    // In a real system, you'd have detailed ingredient/allergen data

    // Check each user preference against the item
    for (const userPref of userPreferences) {
      if (!userPref.restrictionId) continue;

      const restriction = userPref.restrictionId;
      const userSeverity = userPref.severity;

      // Basic matching logic - this is simplified for now
      const hasConflict = this.checkForConflict(item, restriction);

      if (hasConflict) {
        // For allergens, always exclude regardless of severity
        if (restriction.isAllergen) {
          result.isCompatible = false;
          result.reason = `Contains allergen: ${restriction.name}`;
          result.severity = userSeverity;
          result.conflictingRestrictions.push({
            name: restriction.name,
            severity: userSeverity,
            type: 'allergen',
          });

          // For strict allergen restrictions, immediately return
          if (userSeverity === 'strict') {
            return result;
          }
        } else {
          // For non-allergen restrictions, behavior depends on severity
          if (userSeverity === 'strict') {
            result.isCompatible = false;
            result.reason = `Violates ${restriction.category} restriction: ${restriction.name}`;
            result.severity = userSeverity;
            result.conflictingRestrictions.push({
              name: restriction.name,
              severity: userSeverity,
              type: restriction.category,
            });
          } else {
            // For mild restrictions, add warning but don't exclude
            result.warnings.push(`May not align with ${restriction.name} preference`);
            result.confidence = Math.min(result.confidence, 0.7);
          }
        }
      }
    }

    return result;
  }

  /**
   * Improved conflict detection with better keyword logic
   * @param {Object} item - Inventory item
   * @param {Object} restriction - Dietary restriction
   * @returns {Boolean} Whether there's a conflict
   */
  checkForConflict(item, restriction) {
    const itemName = item.item_name?.toLowerCase() || '';
    const itemCategory = item.category?.toLowerCase() || '';
    const restrictionName = restriction.name.toLowerCase();

    // Enhanced keyword matching with positive/negative indicators
    const conflictPatterns = {
      'gluten-free': {
        // More specific gluten-containing items
        conflicts: [
          'wheat bread',
          'white bread',
          'whole wheat',
          'flour',
          'wheat cereal',
          'regular pasta',
          'cookies',
          'cake',
          'crackers',
        ],
        safe: ['gluten-free', 'gluten free', 'gf-', 'rice', 'corn'],
      },
      'dairy-free': {
        conflicts: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'dairy'],
        safe: ['dairy-free', 'dairy free', 'non-dairy', 'plant-based', 'almond milk', 'soy milk'],
      },
      'nut-free': {
        conflicts: [
          'peanut',
          'almond',
          'walnut',
          'cashew',
          'pistachio',
          'hazelnut',
          'pecan',
          'tree nut',
        ],
        safe: ['nut-free', 'nut free'],
      },
      vegan: {
        conflicts: ['meat', 'chicken', 'beef', 'pork', 'fish', 'dairy', 'egg', 'honey', 'gelatin'],
        safe: ['vegan', 'plant-based', 'vegetable', 'fruit'],
      },
      vegetarian: {
        conflicts: ['meat', 'chicken', 'beef', 'pork', 'fish'],
        safe: ['vegetarian', 'veggie', 'plant-based'],
      },
      kosher: {
        conflicts: ['pork', 'shellfish', 'non-kosher'],
        safe: ['kosher', 'kosher-certified'],
      },
      halal: {
        conflicts: ['pork', 'alcohol', 'non-halal'],
        safe: ['halal', 'halal-certified'],
      },
    };

    const pattern = conflictPatterns[restrictionName];
    if (!pattern) {
      // For restrictions we don't have patterns for, assume no conflict
      return false;
    }

    /**
     * Check if text contains a keyword with word boundaries
     */
    const containsKeyword = (text, keyword) => {
      // For multi-word keywords, use simple includes
      if (keyword.includes(' ')) {
        return text.includes(keyword);
      }

      // For single words, use word boundary to avoid partial matches
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    };

    // Then in the conflict checking:
    const isSafe = pattern.safe.some(
      safeKeyword =>
        containsKeyword(itemName, safeKeyword) || containsKeyword(itemCategory, safeKeyword)
    );

    const hasConflict = pattern.conflicts.some(
      conflictKeyword =>
        containsKeyword(itemName, conflictKeyword) || containsKeyword(itemCategory, conflictKeyword)
    );

    return hasConflict;
  }

  /**
   * Log dietary mismatches for admin review
   * @param {String} userId - User ID
   * @param {Object} item - Inventory item
   * @param {Object} matchResult - Match result with conflict details
   */
  logMismatch(userId, item, matchResult) {
    const mismatchEntry = {
      timestamp: new Date(),
      userId,
      itemId: item._id,
      itemName: item.item_name,
      reason: matchResult.reason,
      severity: matchResult.severity,
      conflictingRestrictions: matchResult.conflictingRestrictions,
    };

    this.mismatchLog.push(mismatchEntry);

    // Keep only last 1000 entries to prevent memory issues
    if (this.mismatchLog.length > 1000) {
      this.mismatchLog = this.mismatchLog.slice(-1000);
    }

    // Log to console for now - in production you'd save to database
    console.log('Dietary mismatch logged:', mismatchEntry);
  }

  /**
   * Get mismatch logs for admin review
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered mismatch logs
   */
  getMismatchLogs(filters = {}) {
    let logs = [...this.mismatchLog];

    if (filters.userId) {
      logs = logs.filter(log => log.userId.toString() === filters.userId.toString());
    }

    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Export a singleton instance
module.exports = new DietaryMatchingService();
