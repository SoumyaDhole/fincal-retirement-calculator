const {
    futureExpense, futureExpenseWithBuckets, retirementCorpus,
    requiredSIP, requiredStepUpSIP, withdrawalSimulation,
    monteCarloSimulation, monteCarloFanChart,
    retirementTimeline, regretCalculator, sensitivityTable
} = require("../utils/financeFormulas");

function calculateRetirement(data) {
    const { currentAge, retirementAge, lifeExpectancy, monthlyExpense,
        inflationRate, preReturn, postReturn, stepUpRate = 0, existingCorpus = 0 } = data;

    const yearsToRetirement = retirementAge - currentAge;
    const retirementYears   = lifeExpectancy - retirementAge;

    const futureMonthlyExpense = futureExpense(monthlyExpense, inflationRate, yearsToRetirement);
    const expenseBuckets       = futureExpenseWithBuckets(monthlyExpense, yearsToRetirement);
    const requiredCorpus       = retirementCorpus(futureMonthlyExpense, postReturn, retirementYears, inflationRate);
    const existingCorpusAtRetirement = existingCorpus * Math.pow(1 + preReturn, yearsToRetirement);
    const corpusGap            = Math.max(requiredCorpus - existingCorpusAtRetirement, 0);
    const monthlySIP           = corpusGap > 0 ? requiredSIP(corpusGap, preReturn, yearsToRetirement) : 0;
    const monthlyStepUpSIP     = stepUpRate > 0 && corpusGap > 0
        ? requiredStepUpSIP(corpusGap, preReturn, yearsToRetirement, stepUpRate) : null;
    const yearsCorpusLasts     = withdrawalSimulation(requiredCorpus, futureMonthlyExpense * 12, postReturn, inflationRate, retirementYears);
    const monte                = monteCarloSimulation(requiredCorpus, futureMonthlyExpense * 12, postReturn, inflationRate, retirementYears);
    const monteCarloFan        = monteCarloFanChart(monthlySIP, yearsToRetirement, retirementYears, preReturn, postReturn, inflationRate, futureMonthlyExpense * 12, stepUpRate, 1000);
    const timeline             = retirementTimeline(currentAge, retirementAge, monthlySIP, preReturn, requiredCorpus, retirementYears, futureMonthlyExpense, inflationRate, postReturn, stepUpRate);
    const regret               = regretCalculator(currentAge, retirementAge, requiredCorpus, preReturn, 5);

    // ── FIXED: pass monthlyExpense (not requiredCorpus) + retirementYears + postReturn
    //    so sensitivity can recompute corpus from scratch for each scenario
    const sensitivity = sensitivityTable(
        monthlyExpense,
        yearsToRetirement,
        retirementYears,
        preReturn,
        inflationRate,
        postReturn
    );

    return {
        futureMonthlyExpense:       Math.round(futureMonthlyExpense),
        expenseBuckets,
        requiredCorpus:             Math.round(requiredCorpus),
        existingCorpusAtRetirement: Math.round(existingCorpusAtRetirement),
        corpusGap:                  Math.round(corpusGap),
        monthlySIP:                 Math.round(monthlySIP),
        monthlyStepUpSIP:           monthlyStepUpSIP ? Math.round(monthlyStepUpSIP) : null,
        yearsCorpusLasts,
        successProbability:         monte.successProbability,
        monteCarloP10:              monte.p10,
        monteCarloP50:              monte.p50,
        monteCarloP90:              monte.p90,
        monteCarloFan,
        timeline,
        regret,
        sensitivity,
        monthlyRetirementIncome:    Math.round(futureMonthlyExpense),
        monthlyIncomeInTodaysMoney: Math.round(monthlyExpense),
        yearsToRetirement,
        retirementYears
    };
}

module.exports = { calculateRetirement };
