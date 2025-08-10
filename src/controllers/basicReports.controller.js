/* eslint-disable indent */
// backend/src/controllers/reports.controller.js
const Inventory = require('../db/models/Inventory');
const FoodRequest = require('../db/models/FoodRequest.model');
const Donation = require('../db/models/Donation');
const User = require('../db/models/User');
const mongoose = require('mongoose');

class ReportsController {
  // Get inventory status report
  async getInventoryReport(req, res) {
    try {
      const { startDate, endDate, foodbank_id } = req.query;

      // Build match condition
      const matchCondition = {};
      if (foodbank_id) {
        matchCondition.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }
      if (startDate || endDate) {
        matchCondition.date_added = {};
        if (startDate) matchCondition.date_added.$gte = new Date(startDate);
        if (endDate) matchCondition.date_added.$lte = new Date(endDate);
      }

      // Current inventory summary
      const inventorySummary = await Inventory.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ['$quantity', '$minimum_stock_level'] }, 1, 0],
              },
            },
            expiringSoon: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$expiration_date', null] },
                      {
                        $lte: ['$expiration_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      // Category breakdown
      const categoryBreakdown = await Inventory.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$category',
            itemCount: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ['$quantity', '$minimum_stock_level'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { totalQuantity: -1 } },
      ]);

      // Low stock items
      const lowStockItems = await Inventory.find({
        ...matchCondition,
        $expr: { $lte: ['$quantity', '$minimum_stock_level'] },
      })
        .populate('foodbank_id', 'name location')
        .sort({ quantity: 1 })
        .limit(10);

      // Expiring items
      const expiringItems = await Inventory.find({
        ...matchCondition,
        expiration_date: {
          $ne: null,
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
        .populate('foodbank_id', 'name location')
        .sort({ expiration_date: 1 })
        .limit(10);

      res.json({
        success: true,
        data: {
          summary: inventorySummary[0] || {
            totalItems: 0,
            totalQuantity: 0,
            lowStockItems: 0,
            expiringSoon: 0,
          },
          categoryBreakdown,
          lowStockItems,
          expiringItems,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error generating inventory report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate inventory report',
        error: error.message,
      });
    }
  }

  // Get request analytics report
  async getRequestReport(req, res) {
    try {
      const { startDate, endDate, foodbank_id } = req.query;

      // Build match condition
      const matchCondition = {};
      if (foodbank_id) {
        matchCondition.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }
      if (startDate || endDate) {
        matchCondition.created_at = {};
        if (startDate) matchCondition.created_at.$gte = new Date(startDate);
        if (endDate) matchCondition.created_at.$lte = new Date(endDate);
      }

      // Request summary by status
      const statusSummary = await FoodRequest.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalItems: { $sum: { $size: '$items' } },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Request trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const requestTrends = await FoodRequest.aggregate([
        {
          $match: {
            ...matchCondition,
            created_at: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$created_at',
              },
            },
            requestCount: { $sum: 1 },
            itemCount: { $sum: { $size: '$items' } },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Popular items requested
      const popularItems = await FoodRequest.aggregate([
        { $match: matchCondition },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.item_name',
            requestCount: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity_requested' },
            avgQuantity: { $avg: '$items.quantity_requested' },
          },
        },
        { $sort: { requestCount: -1 } },
        { $limit: 10 },
      ]);

      // Request fulfillment rate
      const fulfillmentStats = await FoodRequest.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            fulfilledRequests: {
              $sum: {
                $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0],
              },
            },
            approvedRequests: {
              $sum: {
                $cond: [{ $in: ['$status', ['approved', 'ready', 'fulfilled']] }, 1, 0],
              },
            },
          },
        },
      ]);

      const fulfillmentData = fulfillmentStats[0] || {
        totalRequests: 0,
        fulfilledRequests: 0,
        approvedRequests: 0,
      };

      fulfillmentData.fulfillmentRate =
        fulfillmentData.totalRequests > 0
          ? ((fulfillmentData.fulfilledRequests / fulfillmentData.totalRequests) * 100).toFixed(2)
          : 0;

      fulfillmentData.approvalRate =
        fulfillmentData.totalRequests > 0
          ? ((fulfillmentData.approvedRequests / fulfillmentData.totalRequests) * 100).toFixed(2)
          : 0;

      res.json({
        success: true,
        data: {
          statusSummary,
          requestTrends,
          popularItems,
          fulfillmentStats: fulfillmentData,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error generating request report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate request report',
        error: error.message,
      });
    }
  }

  // Get donation analytics report
  async getDonationReport(req, res) {
    try {
      const { startDate, endDate, foodbank_id } = req.query;

      // Build match condition
      const matchCondition = {};
      if (foodbank_id) {
        matchCondition.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }
      if (startDate || endDate) {
        matchCondition.donation_date = {};
        if (startDate) matchCondition.donation_date.$gte = new Date(startDate);
        if (endDate) matchCondition.donation_date.$lte = new Date(endDate);
      }

      // Donation summary
      const donationSummary = await Donation.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            completedDonations: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
              },
            },
            pendingDonations: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Donation trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const donationTrends = await Donation.aggregate([
        {
          $match: {
            ...matchCondition,
            donation_date: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$donation_date',
              },
            },
            donationCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Top donors
      const topDonors = await Donation.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$donor_id',
            donationCount: { $sum: 1 },
            lastDonation: { $max: '$donation_date' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'donor',
          },
        },
        { $unwind: '$donor' },
        {
          $project: {
            donorName: '$donor.full_name',
            donorEmail: '$donor.email',
            donationCount: 1,
            lastDonation: 1,
          },
        },
        { $sort: { donationCount: -1 } },
        { $limit: 10 },
      ]);

      res.json({
        success: true,
        data: {
          summary: donationSummary[0] || {
            totalDonations: 0,
            completedDonations: 0,
            pendingDonations: 0,
          },
          donationTrends,
          topDonors,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error generating donation report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate donation report',
        error: error.message,
      });
    }
  }

  // Get user analytics report
  async getUserReport(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build match condition for user registration
      const matchCondition = {};
      if (startDate || endDate) {
        matchCondition.created_at = {};
        if (startDate) matchCondition.created_at.$gte = new Date(startDate);
        if (endDate) matchCondition.created_at.$lte = new Date(endDate);
      }

      // User summary by role
      const userSummary = await User.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ['$active', true] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // User registration trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const registrationTrends = await User.aggregate([
        {
          $match: {
            created_at: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$created_at',
              },
            },
            registrations: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Active recipients (those who made requests recently)
      const activeRecipients = await FoodRequest.aggregate([
        {
          $match: {
            created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: '$recipient_id',
            requestCount: { $sum: 1 },
            lastRequest: { $max: '$created_at' },
          },
        },
        { $count: 'activeRecipients' },
      ]);

      res.json({
        success: true,
        data: {
          userSummary,
          registrationTrends,
          activeRecipients: activeRecipients[0]?.activeRecipients || 0,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error generating user report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate user report',
        error: error.message,
      });
    }
  }

  // Get comprehensive dashboard data
  async getDashboardData(req, res) {
    try {
      const { foodbank_id } = req.query;

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const matchCondition = {};
      if (foodbank_id) {
        matchCondition.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }

      // Quick stats
      const [totalInventoryItems, lowStockCount, todayRequests, pendingRequests, todayDonations] =
        await Promise.all([
          Inventory.countDocuments(matchCondition),
          Inventory.countDocuments({
            ...matchCondition,
            $expr: { $lte: ['$quantity', '$minimum_stock_level'] },
          }),
          FoodRequest.countDocuments({
            ...matchCondition,
            created_at: { $gte: today, $lt: tomorrow },
          }),
          FoodRequest.countDocuments({
            ...matchCondition,
            status: 'pending',
          }),
          Donation.countDocuments({
            ...matchCondition,
            donation_date: { $gte: today, $lt: tomorrow },
          }),
        ]);

      // Recent activity
      const recentRequests = await FoodRequest.find(matchCondition)
        .populate('recipient_id', 'full_name email')
        .sort({ created_at: -1 })
        .limit(5);

      const recentDonations = await Donation.find(matchCondition)
        .populate('donor_id', 'full_name email')
        .sort({ donation_date: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          quickStats: {
            totalInventoryItems,
            lowStockCount,
            todayRequests,
            pendingRequests,
            todayDonations,
          },
          recentActivity: {
            requests: recentRequests,
            donations: recentDonations,
          },
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate dashboard data',
        error: error.message,
      });
    }
  }

  // Export report to CSV
  async exportReport(req, res) {
    try {
      const { reportType, startDate, endDate, foodbank_id } = req.query;

      let data = [];
      let headers = [];
      let filename = '';

      switch (reportType) {
        case 'inventory': {
          const matchCondition = {};
          if (foodbank_id) {
            matchCondition.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
          }

          const inventoryData = await Inventory.find(matchCondition)
            .populate('foodbank_id', 'name location')
            .sort({ item_name: 1 });

          headers = [
            'Item Name',
            'Category',
            'Quantity',
            'Minimum Stock Level',
            'Expiration Date',
            'Dietary Category',
            'Food Bank',
            'Storage Location',
            'Date Added',
          ];

          data = inventoryData.map(item => [
            item.item_name,
            item.category,
            item.quantity,
            item.minimum_stock_level,
            item.expiration_date ? item.expiration_date.toISOString().split('T')[0] : '',
            item.dietary_category || '',
            item.foodbank_id?.name || '',
            item.storage_location || '',
            item.date_added.toISOString().split('T')[0],
          ]);

          filename = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }

        case 'requests': {
          const requestMatchCondition = {};
          if (foodbank_id) {
            requestMatchCondition.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
          }
          if (startDate || endDate) {
            requestMatchCondition.created_at = {};
            if (startDate) requestMatchCondition.created_at.$gte = new Date(startDate);
            if (endDate) requestMatchCondition.created_at.$lte = new Date(endDate);
          }

          const requestData = await FoodRequest.find(requestMatchCondition)
            .populate('recipient_id', 'full_name email')
            .populate('foodbank_id', 'name location')
            .sort({ created_at: -1 });

          headers = [
            'Request ID',
            'Recipient Name',
            'Recipient Email',
            'Food Bank',
            'Status',
            'Items Count',
            'Created Date',
            'Preferred Pickup Date',
            'Special Instructions',
          ];

          data = requestData.map(request => [
            request._id.toString(),
            request.recipient_id?.full_name || '',
            request.recipient_id?.email || '',
            request.foodbank_id?.name || '',
            request.status,
            request.items.length,
            request.created_at.toISOString().split('T')[0],
            request.preferred_pickup_date
              ? request.preferred_pickup_date.toISOString().split('T')[0]
              : '',
            request.special_instructions || '',
          ]);

          filename = `requests_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type',
          });
      }

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(field => `"${field}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message,
      });
    }
  }
}

module.exports = new ReportsController();
