// this is the backend area for the gp routes
const express = require('express');
const GP = require('../models/GP');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const gps = await GP.find().sort({ name: 1 });
    res.json(gps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
