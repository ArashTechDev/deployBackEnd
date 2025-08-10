// backend/src/controllers/wishlist.controller.js
const Wishlist = require('../db/models/Wishlist');
const Cart = require('../db/models/Cart');
const { validationResult } = require('express-validator');

class WishlistController {
  // Get user's wishlists
  async getWishlists(req, res) {
    try {
      const wishlists = await Wishlist.find({ user_id: req.user.id })
        .populate('items.inventory_id', 'item_name category quantity expiration_date')
        .sort({ created_at: -1 });

      res.json({
        success: true,
        data: wishlists,
      });
    } catch (error) {
      console.error('Error fetching wishlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wishlists',
        error: error.message,
      });
    }
  }

  // Create new wishlist
  async createWishlist(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, description, items } = req.body;

      const wishlist = new Wishlist({
        user_id: req.user.id,
        name,
        description: description || '',
        items: items || [],
      });

      await wishlist.save();
      await wishlist.populate('items.inventory_id', 'item_name category quantity expiration_date');

      res.status(201).json({
        success: true,
        message: 'Wishlist created successfully',
        data: wishlist,
      });
    } catch (error) {
      console.error('Error creating wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create wishlist',
        error: error.message,
      });
    }
  }

  // Load wishlist to cart
  async loadToCart(req, res) {
    try {
      const { wishlistId } = req.params;

      const wishlist = await Wishlist.findOne({
        _id: wishlistId,
        user_id: req.user.id,
      }).populate('items.inventory_id');

      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found',
        });
      }

      let cart = await Cart.findOne({ user_id: req.user.id });
      if (!cart) {
        cart = new Cart({ user_id: req.user.id, items: [] });
      }

      // Validate wishlist items against current inventory and add to cart
      const validItems = [];
      const invalidItems = [];

      for (const item of wishlist.items) {
        const inventoryItem = item.inventory_id;
        if (inventoryItem && inventoryItem.quantity >= item.quantity) {
          // Check if item already exists in cart
          const existingItemIndex = cart.items.findIndex(
            cartItem => cartItem.inventory_id.toString() === item.inventory_id._id.toString()
          );

          if (existingItemIndex > -1) {
            const newQuantity = cart.items[existingItemIndex].quantity + item.quantity;
            if (newQuantity <= inventoryItem.quantity) {
              cart.items[existingItemIndex].quantity = newQuantity;
              validItems.push(item);
            } else {
              invalidItems.push({
                ...item.toObject(),
                reason: 'Insufficient quantity after combining with existing cart item',
              });
            }
          } else {
            cart.items.push({
              inventory_id: item.inventory_id._id,
              item_name: item.item_name,
              quantity: item.quantity,
              dietary_category: item.dietary_category,
            });
            validItems.push(item);
          }
        } else {
          invalidItems.push({
            ...item.toObject(),
            reason: 'Item unavailable or insufficient quantity',
          });
        }
      }

      await cart.save();
      await cart.populate('items.inventory_id', 'item_name category quantity expiration_date');

      res.json({
        success: true,
        message: 'Wishlist loaded to cart',
        data: {
          cart,
          validItems: validItems.length,
          invalidItems: invalidItems.length,
          unavailableItems: invalidItems,
        },
      });
    } catch (error) {
      console.error('Error loading wishlist to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load wishlist to cart',
        error: error.message,
      });
    }
  }

  // Delete wishlist
  async deleteWishlist(req, res) {
    try {
      const { wishlistId } = req.params;

      const wishlist = await Wishlist.findOneAndDelete({
        _id: wishlistId,
        user_id: req.user.id,
      });

      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found',
        });
      }

      res.json({
        success: true,
        message: 'Wishlist deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete wishlist',
        error: error.message,
      });
    }
  }
}

module.exports = new WishlistController();
