const express = require('express');
const router = express.Router();
const { searchUsers } = require('../controllers/searchController');

router.get('/', searchUsers);

module.exports = router; 