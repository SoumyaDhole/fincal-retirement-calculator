const {
    futureExpense, futureExpenseWithBuckets, retirementCorpus,
    requiredSIP, requiredStepUpSIP, withdrawalSimulation,
    monteCarloSimulation, monteCarloFanChart,
    retirementTimeline, regretCalculator, sensitivityTable
} = require("../utils/financeFormulas");

function calculateRetirement(data) {
    const { currentAge, retirementAge, lifeExpectancy, monthlyExpense,
        inflationRate, preReturn, postReturn, stepUpRate = 0,
        existingCorpus = 0, lumpSumWithdrawal = 0 } = data;

    const yearsToRetirement = retirementAge - currentAge;
    const retirementYears   = lifeExpectancy - retirementAge;

    // ── Core calculations ──────────────────────────────────────────────
    const futureMonthlyExpense = futureExpense(monthlyExpense, inflationRate, yearsToRetirement);
    const expenseBuckets       = futureExpenseWithBuckets(monthlyExpense, yearsToRetirement);

    // Corpus needed purely for monthly withdrawals
    const corpusForIncome      = retirementCorpus(futureMonthlyExpense, postReturn, retirementYears, inflationRate);

    // Total corpus target = income corpus + lumpsum the user wants on day 1 of retirement
    const requiredCorpus       = corpusForIncome + lumpSumWithdrawal;

    // Existing savings compounded to retirement day
    const existingCorpusAtRetirement = existingCorpus * Math.pow(1 + preReturn, yearsToRetirement);

    // Gap SIP needs to fill
    const corpusGap            = Math.max(requiredCorpus - existingCorpusAtRetirement, 0);

    const monthlySIP           = corpusGap > 0 ? requiredSIP(corpusGap, preReturn, yearsToRetirement) : 0;
    const monthlyStepUpSIP     = stepUpRate > 0 && corpusGap > 0
        ? requiredStepUpSIP(corpusGap, preReturn, yearsToRetirement, stepUpRate) : null;

    // Withdrawal simulation & Monte Carlo use only the income portion of corpus
    // (lumpsum is taken out on day 1, remaining corpus funds monthly withdrawals)
    const yearsCorpusLasts     = withdrawalSimulation(corpusForIncome, futureMonthlyExpense * 12, postReturn, inflationRate, retirementYears);
    const monte                = monteCarloSimulation(corpusForIncome, futureMonthlyExpense * 12, postReturn, inflationRate, retirementYears);
    const monteCarloFan        = monteCarloFanChart(monthlySIP, yearsToRetirement, retirementYears, preReturn, postReturn, inflationRate, futureMonthlyExpense * 12, stepUpRate, 1000);
    const timeline             = retirementTimeline(currentAge, retirementAge, monthlySIP, preReturn, requiredCorpus, retirementYears, futureMonthlyExpense, inflationRate, postReturn, stepUpRate);
    const regret               = regretCalculator(currentAge, retirementAge, requiredCorpus, preReturn, 5);
    const sensitivity          = sensitivityTable(
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
        corpusForIncome:            Math.round(corpusForIncome),
        lumpSumWithdrawal:          Math.round(lumpSumWithdrawal),
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
