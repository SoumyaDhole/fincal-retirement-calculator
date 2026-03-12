const express = require('express');

const router = express.Router();

const {
    getRetirementPlan
} = require('../controllers/retirementController');


router.post('/calculate', getRetirementPlan);


module.exports = router;