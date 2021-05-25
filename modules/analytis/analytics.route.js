const express = require('express');
const router = express.Router();

const controller = require('./analytics.controller');

// Define Router controllers

// Request to get list of subscribers
router.get('/month/:endDate', controller.fetchMonthDataDataFromService);
module.exports = router;
