const { calculateRetirement } =
    require('../services/retirementCalculator');


function getRetirementPlan(req, res) {

    try {

        const result = calculateRetirement(req.body);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

module.exports = {
    getRetirementPlan
};