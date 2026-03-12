// Future monthly expense after inflation
function futureExpense(currentExpense, inflationRate, years) {

    return currentExpense * Math.pow(1 + inflationRate, years);
}


// Retirement corpus required
function retirementCorpus(monthlyExpense, postReturn, retirementYears, inflationRate) {

    let corpus = 0;
    let annualExpense = monthlyExpense * 12;

    for (let i = 0; i < retirementYears; i++) {

        corpus += annualExpense / Math.pow(1 + postReturn, i);

        annualExpense = annualExpense * (1 + inflationRate);
    }

    return corpus;
}


// SIP required before retirement
function requiredSIP(targetCorpus, preReturn, years) {

    const monthlyRate = preReturn / 12;

    const months = years * 12;

    const sip =
        (targetCorpus * monthlyRate) /
        (Math.pow((1 + monthlyRate), months) - 1);

    return sip;
}


// Withdrawal simulation with inflation
function withdrawalSimulation(corpus, annualExpense, postReturn, inflationRate, years) {

    let balance = corpus;

    for (let i = 0; i < years; i++) {

        balance = balance * (1 + postReturn);

        balance -= annualExpense;

        annualExpense = annualExpense * (1 + inflationRate);

        if (balance <= 0) {
            return i;
        }
    }

    return years;
}


// Monte Carlo Simulation with volatility
function monteCarloSimulation(corpus, annualExpense, postReturn, inflationRate, years) {

    const simulations = 1000;

    let success = 0;

    const volatility = 0.1;

    for (let s = 0; s < simulations; s++) {

        let balance = corpus;

        let expense = annualExpense;

        for (let y = 0; y < years; y++) {

            const randomReturn =
                postReturn + (Math.random() - 0.5) * volatility;

            balance = balance * (1 + randomReturn);

            balance -= expense;

            expense = expense * (1 + inflationRate);

            if (balance <= 0) break;
        }

        if (balance > 0) success++;
    }

    return (success / simulations) * 100;
}


// Retirement timeline
function retirementTimeline(
    currentAge,
    retirementAge,
    monthlySIP,
    preReturn,
    corpus,
    retirementYears,
    monthlyExpense,
    inflationRate,
    postReturn
) {

    const timeline = [];

    let balance = 0;

    const monthlyRate = preReturn / 12;

    const yearsToRetirement = retirementAge - currentAge;

    // Accumulation phase
    for (let year = 1; year <= yearsToRetirement; year++) {

        for (let m = 0; m < 12; m++) {

            balance = balance * (1 + monthlyRate);

            balance += monthlySIP;
        }

        timeline.push({
            age: currentAge + year,
            corpus: Math.round(balance)
        });
    }

    // Withdrawal phase
    balance = corpus;

    let annualExpense = monthlyExpense * 12;

    for (let year = 1; year <= retirementYears; year++) {

        balance = balance * (1 + postReturn);

        balance -= annualExpense;

        timeline.push({
            age: retirementAge + year,
            corpus: Math.round(balance)
        });

        annualExpense = annualExpense * (1 + inflationRate);

        if (balance <= 0) break;
    }

    return timeline;
}


module.exports = {
    futureExpense,
    retirementCorpus,
    requiredSIP,
    withdrawalSimulation,
    monteCarloSimulation,
    retirementTimeline
};