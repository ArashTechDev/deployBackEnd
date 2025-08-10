const Donation = require('../db/models/Donation');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/donations');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'donation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create a new donation
const createDonation = async (req, res) => {
  try {
    const {
      donorName,
      donorEmail,
      donorPhone,
      productName,
      quantity,
      unit,
      category,
      expirationDate,
      scheduledPickupDate,
      scheduledPickupTime,
      notes
    } = req.body;

    // Validate required fields
    if (!donorName || !donorEmail || !productName || !quantity || !scheduledPickupDate || !scheduledPickupTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Handle file upload
    let productImage = null;
    if (req.file) {
      productImage = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    // Create donation
    const donation = new Donation({
      donorName,
      donorEmail,
      donorPhone,
      productName,
      quantity: parseInt(quantity),
      unit: unit || 'pieces',
      category: category || 'other',
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      scheduledPickupDate: new Date(scheduledPickupDate),
      scheduledPickupTime,
      notes,
      productImage
    });

    const savedDonation = await donation.save();

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: savedDonation
    });

  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all donations
const getAllDonations = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const donations = await Donation.find(filter)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Donation.countDocuments(filter);

    res.json({
      success: true,
      data: donations,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get donation by ID
const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      data: donation
    });

  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update donation status
const updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'picked-up', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const donation = await Donation.findByIdAndUpdate(
      id,
      { 
        status, 
        notes: notes || undefined,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      message: 'Donation status updated successfully',
      data: donation
    });

  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get donation history for a donor
const getDonationHistory = async (req, res) => {
  try {
    const { donorEmail } = req.params;
    
    const donations = await Donation.find({ donorEmail })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: donations,
      total: donations.length
    });

  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete donation
const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const donation = await Donation.findByIdAndDelete(id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      message: 'Donation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonationStatus,
  getDonationHistory,
  deleteDonation,
  upload
};