const express = require('express');
const router = express.Router();
const { createReport, getReports, adminAction } = require('../controllers/reportController');

router.post('/', createReport);
router.get('/', getReports); 
router.patch('/:id/action', adminAction); 

module.exports = router; 