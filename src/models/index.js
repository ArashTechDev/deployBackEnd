// backend/src/models/index.js

const User = require('../db/models/User');
const FoodBank = require('../db/models/FoodBank');
const StorageLocation = require('../db/models/StorageLocation');
const Inventory = require('../db/models/Inventory');
const FoodRequest = require('../db/models/FoodRequest.model');
const DietaryRestriction = require('../db/models/DietaryRestriction.model');
const UserDietaryPreference = require('../db/models/UserDietaryPreference.model');
const Cart = require('../db/models/Cart');
const Donation = require('../db/models/Donation');
const Volunteer = require('../db/models/Volunteer');
const Shift = require('../db/models/Shift');
const VolunteerShift = require('../db/models/VolunteerShift');
const Wishlist = require('../db/models/Wishlist');

module.exports = {
  User,
  FoodBank,
  StorageLocation,
  Inventory,
  FoodRequest,
  DietaryRestriction,
  UserDietaryPreference,
  Cart,
  Donation,
  Volunteer,
  Shift,
  VolunteerShift,
  Wishlist,
};
