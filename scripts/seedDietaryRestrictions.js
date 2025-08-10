// backend/scripts/seedDietaryRestrictions.js
require('dotenv').config();
const mongoose = require('mongoose');
const DietaryRestriction = require('../src/db/models/DietaryRestriction.model');

const dietaryRestrictionsData = [
  // ALLERGENS (strict exclusion always required)
  {
    name: 'Gluten-Free',
    category: 'allergen',
    description: 'Cannot consume gluten-containing products like wheat, barley, rye',
    isAllergen: true,
    severityLevels: ['mild', 'strict'],
    icon: 'gluten-free',
  },
  {
    name: 'Dairy-Free',
    category: 'allergen',
    description: 'Cannot consume dairy products including milk, cheese, butter',
    isAllergen: true,
    severityLevels: ['mild', 'strict'],
    icon: 'no-dairy',
  },
  {
    name: 'Nut-Free',
    category: 'allergen',
    description: 'Cannot consume nuts or nut products - severe allergy risk',
    isAllergen: true,
    severityLevels: ['strict'], // Only strict for safety
    icon: 'no-nuts',
  },
  {
    name: 'Egg-Free',
    category: 'allergen',
    description: 'Cannot consume eggs or egg-containing products',
    isAllergen: true,
    severityLevels: ['mild', 'strict'],
    icon: 'no-eggs',
  },
  {
    name: 'Soy-Free',
    category: 'allergen',
    description: 'Cannot consume soy products or soy derivatives',
    isAllergen: true,
    severityLevels: ['mild', 'strict'],
    icon: 'no-soy',
  },
  {
    name: 'Shellfish-Free',
    category: 'allergen',
    description: 'Cannot consume shellfish - severe allergy risk',
    isAllergen: true,
    severityLevels: ['strict'],
    icon: 'no-shellfish',
  },

  // LIFESTYLE CHOICES (can be mild or strict)
  {
    name: 'Vegan',
    category: 'lifestyle',
    description: 'Plant-based diet, no animal products including dairy, eggs, honey',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'vegan',
  },
  {
    name: 'Vegetarian',
    category: 'lifestyle',
    description: 'No meat, but may include dairy and eggs',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'vegetarian',
  },
  {
    name: 'Pescatarian',
    category: 'lifestyle',
    description: 'Vegetarian diet that includes fish and seafood',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'fish',
  },
  {
    name: 'Keto-Friendly',
    category: 'lifestyle',
    description: 'Very low carb, high fat diet',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'keto',
  },

  // RELIGIOUS RESTRICTIONS (usually strict)
  {
    name: 'Kosher',
    category: 'religious',
    description: 'Follows Jewish dietary laws',
    isAllergen: false,
    severityLevels: ['strict'],
    icon: 'kosher',
  },
  {
    name: 'Halal',
    category: 'religious',
    description: 'Follows Islamic dietary laws',
    isAllergen: false,
    severityLevels: ['strict'],
    icon: 'halal',
  },

  // MEDICAL REQUIREMENTS
  {
    name: 'Low-Sodium',
    category: 'medical',
    description: 'Requires low sodium intake for health reasons',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'low-sodium',
  },
  {
    name: 'Diabetic-Friendly',
    category: 'medical',
    description: 'Low sugar, suitable for diabetics',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'diabetic',
  },
  {
    name: 'Heart-Healthy',
    category: 'medical',
    description: 'Low cholesterol, low saturated fat diet',
    isAllergen: false,
    severityLevels: ['mild', 'strict'],
    icon: 'heart',
  },
];

const seedDietaryRestrictions = async () => {
  try {
    console.log('🌱 Starting dietary restrictions seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing dietary restrictions (optional - comment out if you want to keep existing ones)
    console.log('🧹 Clearing existing dietary restrictions...');
    await DietaryRestriction.deleteMany({});

    // Insert new dietary restrictions
    console.log('📝 Creating dietary restrictions...');
    const createdRestrictions = await DietaryRestriction.insertMany(dietaryRestrictionsData);

    console.log(`✅ Successfully created ${createdRestrictions.length} dietary restrictions:`);

    // Group by category for nice display
    const byCategory = createdRestrictions.reduce((acc, restriction) => {
      if (!acc[restriction.category]) acc[restriction.category] = [];
      acc[restriction.category].push(restriction.name);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, names]) => {
      console.log(`  📂 ${category.toUpperCase()}: ${names.join(', ')}`);
    });

    console.log('\n🎉 Dietary restrictions seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding dietary restrictions:', error);

    if (error.code === 11000) {
      console.error(
        '💡 Some restrictions already exist. Consider running with --force to overwrite.'
      );
    }

    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
};

// Run if called directly
if (require.main === module) {
  seedDietaryRestrictions();
}

module.exports = seedDietaryRestrictions;
