// backend/src/controllers/cart.controller.js
const Cart = require('../db/models/Cart');
const Wishlist = require('../db/models/Wishlist');
const Inventory = require('../db/models/Inventory');
const { validationResult } = require('express-validator');

class CartController {
  // Get user's cart
  async getCart(req, res) {
    try {
      let cart = await Cart.findOne({ user_id: req.user.id }).populate(
        'items.inventory_id',
        'item_name category quantity expiration_date'
      );

      if (!cart) {
        cart = new Cart({ user_id: req.user.id, items: [] });
        await cart.save();
      }

      // Validate cart items against current inventory
      const validatedItems = [];
      for (const item of cart.items) {
        if (item.inventory_id && item.inventory_id.quantity >= item.quantity) {
          validatedItems.push(item);
        }
      }

      if (validatedItems.length !== cart.items.length) {
        cart.items = validatedItems;
        await cart.save();
      }

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cart',
        error: error.message,
      });
    }
  }

  // Add item to cart
  async addToCart(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { inventory_id, quantity } = req.body;

      // Verify inventory item exists and has sufficient quantity
      const inventoryItem = await Inventory.findById(inventory_id);
      if (!inventoryItem) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found',
        });
      }

      if (inventoryItem.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity. Available: ${inventoryItem.quantity}`,
        });
      }

      let cart = await Cart.findOne({ user_id: req.user.id });
      if (!cart) {
        cart = new Cart({ user_id: req.user.id, items: [] });
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.inventory_id.toString() === inventory_id
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (newQuantity > inventoryItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot add ${quantity} more. Maximum available: ${
              inventoryItem.quantity - cart.items[existingItemIndex].quantity
            }`,
          });
        }
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item to cart
        cart.items.push({
          inventory_id,
          item_name: inventoryItem.item_name,
          quantity,
          dietary_category: inventoryItem.dietary_category,
        });
      }

      await cart.save();
      await cart.populate('items.inventory_id', 'item_name category quantity expiration_date');

      res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: cart,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message,
      });
    }
  }

  // Update cart item quantity
  async updateCartItem(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0',
        });
      }

      const cart = await Cart.findOne({ user_id: req.user.id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
      }

      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart',
        });
      }

      // Verify inventory availability
      const inventoryItem = await Inventory.findById(cart.items[itemIndex].inventory_id);
      if (!inventoryItem || inventoryItem.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity. Available: ${inventoryItem?.quantity || 0}`,
        });
      }

      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      await cart.populate('items.inventory_id', 'item_name category quantity expiration_date');

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: cart,
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: error.message,
      });
    }
  }

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const { itemId } = req.params;

      const cart = await Cart.findOne({ user_id: req.user.id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
      }

      cart.items = cart.items.filter(item => item._id.toString() !== itemId);
      await cart.save();
      await cart.populate('items.inventory_id', 'item_name category quantity expiration_date');

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: cart,
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
        error: error.message,
      });
    }
  }

  // Clear cart
  async clearCart(req, res) {
    try {
      const cart = await Cart.findOne({ user_id: req.user.id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
      }

      cart.items = [];
      await cart.save();

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: cart,
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: error.message,
      });
    }
  }

  // Save cart as wishlist
  async saveAsWishlist(req, res) {
    try {
      const { name, description } = req.body;

      const cart = await Cart.findOne({ user_id: req.user.id });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty',
        });
      }

      const wishlist = new Wishlist({
        user_id: req.user.id,
        name: name || 'My Wishlist',
        description: description || '',
        items: cart.items,
      });

      await wishlist.save();
      await wishlist.populate('items.inventory_id', 'item_name category quantity expiration_date');

      res.json({
        success: true,
        message: 'Cart saved as wishlist successfully',
        data: wishlist,
      });
    } catch (error) {
      console.error('Error saving cart as wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save cart as wishlist',
        error: error.message,
      });
    }
  }
}

module.exports = new CartController();
