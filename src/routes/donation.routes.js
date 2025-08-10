const express = require('express');
const router = express.Router();
const {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonationStatus,
  getDonationHistory,
  deleteDonation,
  upload
} = require('../controllers/donation.controller');

// Routes
router.post('/', upload.single('productImage'), createDonation);
router.get('/', getAllDonations);
router.get('/history/:donorEmail', getDonationHistory);
router.get('/:id', getDonationById);
router.put('/:id/status', updateDonationStatus);
router.delete('/:id', deleteDonation);

module.exports = router;