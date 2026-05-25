const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Favorite = require('../models/Favorite');

const router = express.Router();

// Get user's favorite companies
router.get('/', verifyToken, async (req, res) => {
  try {
    const favorites = await Favorite.getUserFavorites(req.user.id);
    res.json({ favorites: favorites.map(f => f.toJSON()) });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if company is favorited by user
router.get('/:companyId', verifyToken, async (req, res) => {
  try {
    const isFavorited = await Favorite.isFavorited(req.user.id, req.params.companyId);
    res.json({ isFavorited });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add company to favorites
router.post('/:companyId', verifyToken, async (req, res) => {
  try {
    const success = await Favorite.add(req.user.id, req.params.companyId);
    if (success) {
      res.json({ message: 'Company added to favorites' });
    } else {
      res.status(400).json({ message: 'Failed to add to favorites' });
    }
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove company from favorites
router.delete('/:companyId', verifyToken, async (req, res) => {
  try {
    const success = await Favorite.remove(req.user.id, req.params.companyId);
    if (success) {
      res.json({ message: 'Company removed from favorites' });
    } else {
      res.status(404).json({ message: 'Company not found in favorites' });
    }
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
