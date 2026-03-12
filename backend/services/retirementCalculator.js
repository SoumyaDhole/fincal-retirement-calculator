const {
    futureExpense,
    retirementCorpus,
    requiredSIP,
    withdrawalSimulation,
    monteCarloSimulation,
    retirementTimeline
} = require("../utils/financeFormulas");


function calculateRetirement(data) {

    const {
        currentAge,
        retirementAge,
        lifeExpectancy,
        monthlyExpense,
        inflationRate,
        preReturn,
        postReturn
    } = data;


    const yearsToRetirement = retirementAge - currentAge;

    const retirementYears = lifeExpectancy - retirementAge;


    // Step 1 Future expense
    const futureMonthlyExpense =
        futureExpense(monthlyExpense, inflationRate, yearsToRetirement);


    // Step 2 Required corpus
    const requiredCorpus =
        retirementCorpus(
            futureMonthlyExpense,
            postReturn,
            retirementYears,
            inflationRate
        );


    // Step 3 SIP required
    const monthlySIP =
        requiredSIP(requiredCorpus, preReturn, yearsToRetirement);


    // Step 4 Withdrawal simulation
    const yearsCorpusLasts =
        withdrawalSimulation(
            requiredCorpus,
            futureMonthlyExpense * 12,
            postReturn,
            inflationRate,
            retirementYears
        );


    // Step 5 Monte Carlo success probability
    const successProbability =
        monteCarloSimulation(
            requiredCorpus,
            futureMonthlyExpense * 12,
            postReturn,
            inflationRate,
            retirementYears
        );


    // Step 6 Timeline for chart
    const timeline =
        retirementTimeline(
            currentAge,
            retirementAge,
            monthlySIP,
            preReturn,
            requiredCorpus,
            retirementYears,
            futureMonthlyExpense,
            inflationRate,
            postReturn
        );


    return {
        futureMonthlyExpense,
        requiredCorpus,
        monthlySIP,
        yearsCorpusLasts,
        successProbability,
        timeline
    };
}


module.exports = {
    calculateRetirement
};