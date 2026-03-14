const {
    futureExpense,
    futureExpenseWithBuckets,
    retirementCorpus,
    requiredSIP,
    requiredStepUpSIP,
    withdrawalSimulation,
    monteCarloSimulation,
    monteCarloFanChart,
    retirementTimeline,
    regretCalculator,
    sensitivityTable
} = require("../utils/financeFormulas");


function calculateRetirement(data) {

    const {
        currentAge,
        retirementAge,
        lifeExpectancy,
        monthlyExpense,
        inflationRate,
        preReturn,
        postReturn,
        stepUpRate     = 0,
        existingCorpus = 0
    } = data;

    const yearsToRetirement = retirementAge - currentAge;
    const retirementYears   = lifeExpectancy - retirementAge;

    // Step 1 — Future expense (simple)
    const futureMonthlyExpense =
        futureExpense(monthlyExpense, inflationRate, yearsToRetirement);

    // Step 2 — Inflation buckets
    const expenseBuckets =
        futureExpenseWithBuckets(monthlyExpense, yearsToRetirement);

    // Step 3 — Required corpus
    const requiredCorpus =
        retirementCorpus(futureMonthlyExpense, postReturn, retirementYears, inflationRate);

    // Step 4 — Existing corpus compounded
    const existingCorpusAtRetirement =
        existingCorpus * Math.pow(1 + preReturn, yearsToRetirement);

    const corpusGap = Math.max(requiredCorpus - existingCorpusAtRetirement, 0);

    // Step 5 — SIP (flat)
    const monthlySIP =
        corpusGap > 0 ? requiredSIP(corpusGap, preReturn, yearsToRetirement) : 0;

    // Step 6 — Step-up SIP
    const monthlyStepUpSIP =
        stepUpRate > 0 && corpusGap > 0
            ? requiredStepUpSIP(corpusGap, preReturn, yearsToRetirement, stepUpRate)
            : null;

    // Step 7 — Withdrawal simulation
    const yearsCorpusLasts =
        withdrawalSimulation(
            requiredCorpus,
            futureMonthlyExpense * 12,
            postReturn,
            inflationRate,
            retirementYears
        );

    // Step 8 — Monte Carlo (success probability)
    const monte = monteCarloSimulation(
        requiredCorpus,
        futureMonthlyExpense * 12,
        postReturn,
        inflationRate,
        retirementYears
    );

    // Step 9 — Monte Carlo fan chart (year-by-year bands)
    const monteCarloFan = monteCarloFanChart(
        monthlySIP,
        yearsToRetirement,
        retirementYears,
        preReturn,
        postReturn,
        inflationRate,
        futureMonthlyExpense * 12,
        stepUpRate,
        1000
    );

    // Step 10 — Timeline
    const timeline = retirementTimeline(
        currentAge, retirementAge, monthlySIP, preReturn,
        requiredCorpus, retirementYears, futureMonthlyExpense,
        inflationRate, postReturn, stepUpRate
    );

    // Step 11 — Regret calculator
    const regret = regretCalculator(currentAge, retirementAge, requiredCorpus, preReturn, 5);

    // Step 12 — Sensitivity table
    const sensitivity = sensitivityTable(requiredCorpus, yearsToRetirement, preReturn, inflationRate);

    return {
        futureMonthlyExpense:        Math.round(futureMonthlyExpense),
        expenseBuckets,
        requiredCorpus:              Math.round(requiredCorpus),
        existingCorpusAtRetirement:  Math.round(existingCorpusAtRetirement),
        corpusGap:                   Math.round(corpusGap),
        monthlySIP:                  Math.round(monthlySIP),
        monthlyStepUpSIP:            monthlyStepUpSIP ? Math.round(monthlyStepUpSIP) : null,
        yearsCorpusLasts,
        successProbability:          monte.successProbability,
        monteCarloP10:               monte.p10,
        monteCarloP50:               monte.p50,
        monteCarloP90:               monte.p90,
        monteCarloFan,
        timeline,
        regret,
        sensitivity,
        monthlyRetirementIncome:     Math.round(futureMonthlyExpense),
        monthlyIncomeInTodaysMoney:  Math.round(monthlyExpense),
        yearsToRetirement,
        retirementYears
    };
}

module.exports = { calculateRetirement };