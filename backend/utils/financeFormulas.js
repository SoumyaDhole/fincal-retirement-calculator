// ─── Box-Muller Gaussian sampler ─────────────────────────────────
function gaussian(mean, sd) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ─── Future monthly expense after inflation ───────────────────────
function futureExpense(currentExpense, inflationRate, years) {
    return currentExpense * Math.pow(1 + inflationRate, years);
}

// ─── Inflation buckets ────────────────────────────────────────────
function futureExpenseWithBuckets(monthlyExpense, years) {
    const generalPortion   = monthlyExpense * 0.60;
    const medicalPortion   = monthlyExpense * 0.25;
    const lifestylePortion = monthlyExpense * 0.15;

    const generalInflation   = 0.06;
    const medicalInflation   = 0.08;
    const lifestyleInflation = 0.04;

    const futureGeneral   = generalPortion   * Math.pow(1 + generalInflation,   years);
    const futureMedical   = medicalPortion   * Math.pow(1 + medicalInflation,   years);
    const futureLifestyle = lifestylePortion * Math.pow(1 + lifestyleInflation, years);

    return {
        total:     futureGeneral + futureMedical + futureLifestyle,
        general:   Math.round(futureGeneral),
        medical:   Math.round(futureMedical),
        lifestyle: Math.round(futureLifestyle)
    };
}

// ─── Retirement corpus required ───────────────────────────────────
function retirementCorpus(monthlyExpense, postReturn, retirementYears, inflationRate) {
    let corpus = 0;
    let annualExpense = monthlyExpense * 12;
    for (let i = 0; i < retirementYears; i++) {
        corpus += annualExpense / Math.pow(1 + postReturn, i);
        annualExpense *= (1 + inflationRate);
    }
    return corpus;
}

// ─── SIP required before retirement ──────────────────────────────
function requiredSIP(targetCorpus, preReturn, years) {
    const monthlyRate = preReturn / 12;
    const months      = years * 12;
    return (targetCorpus * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
}

// ─── Step-up SIP ──────────────────────────────────────────────────
function stepUpSIPValue(initialSIP, annualReturn, stepUpRate, years) {
    const monthlyRate = annualReturn / 12;
    let totalFV = 0;
    let currentSIP = initialSIP;
    for (let year = 0; year < years; year++) {
        const monthsRemaining = (years - year) * 12;
        totalFV += currentSIP *
            ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate) *
            (1 + monthlyRate);
        currentSIP *= (1 + stepUpRate);
    }
    return totalFV;
}

// ─── Required initial SIP with step-up ───────────────────────────
function requiredStepUpSIP(targetCorpus, preReturn, years, stepUpRate) {
    let low = 0, high = targetCorpus;
    for (let i = 0; i < 100; i++) {
        const mid = (low + high) / 2;
        const fv  = stepUpSIPValue(mid, preReturn, stepUpRate, years);
        if (Math.abs(fv - targetCorpus) < 1) break;
        if (fv < targetCorpus) low = mid; else high = mid;
    }
    return (low + high) / 2;
}

// ─── Withdrawal simulation with inflation ─────────────────────────
function withdrawalSimulation(corpus, annualExpense, postReturn, inflationRate, years) {
    let balance = corpus;
    for (let i = 0; i < years; i++) {
        balance = balance * (1 + postReturn) - annualExpense;
        annualExpense *= (1 + inflationRate);
        if (balance <= 0) return i + 1;
    }
    return years;
}

// ─── Monte Carlo — final balance only (for success probability) ───
function monteCarloSimulation(corpus, annualExpense, postReturn, inflationRate, years) {
    const simulations = 1000;
    const volatility  = postReturn * 0.5; // Gaussian SD = 50% of mean
    let success = 0;
    const allFinalBalances = [];

    for (let s = 0; s < simulations; s++) {
        let balance = corpus;
        let expense = annualExpense;
        for (let y = 0; y < years; y++) {
            const r = gaussian(postReturn, volatility);
            balance = balance * (1 + r) - expense;
            expense *= (1 + inflationRate);
            if (balance <= 0) { balance = 0; break; }
        }
        allFinalBalances.push(balance);
        if (balance > 0) success++;
    }

    allFinalBalances.sort((a, b) => a - b);
    const n = allFinalBalances.length;

    return {
        successProbability: (success / simulations) * 100,
        p10: Math.round(allFinalBalances[Math.floor(n * 0.10)]),
        p50: Math.round(allFinalBalances[Math.floor(n * 0.50)]),
        p90: Math.round(allFinalBalances[Math.floor(n * 0.90)])
    };
}

// ─── Monte Carlo — full fan chart (year-by-year percentile bands) ─
// Returns data for BOTH accumulation and depletion phases
function monteCarloFanChart(
    monthlySIP,
    yearsToRetirement,
    retirementYears,
    preReturn,
    postReturn,
    inflationRate,
    annualExpense,
    stepUpRate = 0,
    simulations = 1000
) {
    const preVolatility  = preReturn  * 0.5;
    const postVolatility = postReturn * 0.5;
    const totalYears     = yearsToRetirement + retirementYears;

    const allPaths = [];

    for (let s = 0; s < simulations; s++) {
        const path = new Array(totalYears);

        // Accumulation phase
        let corpus     = 0;
        let currentSIP = monthlySIP;

        for (let y = 0; y < yearsToRetirement; y++) {
            const annualR  = Math.max(-0.3, gaussian(preReturn, preVolatility));
            const monthlyR = annualR / 12;
            for (let m = 0; m < 12; m++) {
                corpus += currentSIP;
                corpus *= (1 + monthlyR);
            }
            if (stepUpRate > 0) currentSIP *= (1 + stepUpRate);
            path[y] = Math.max(0, corpus);
        }

        // Depletion phase — start from this sim's corpus at retirement
        let balance  = corpus;
        let expense  = annualExpense / 12; // monthly

        for (let y = 0; y < retirementYears; y++) {
            const annualR  = Math.max(-0.3, gaussian(postReturn, postVolatility));
            const monthlyR = annualR / 12;
            for (let m = 0; m < 12; m++) {
                balance -= expense;
                balance  = Math.max(0, balance) * (1 + monthlyR);
                expense *= Math.pow(1 + inflationRate, 1 / 12);
            }
            path[yearsToRetirement + y] = Math.max(0, balance);
        }

        allPaths.push(path);
    }

    // Build percentile bands year by year
    const result = [];
    for (let y = 0; y < totalYears; y++) {
        const vals = allPaths.map(p => p[y]).sort((a, b) => a - b);
        const n    = vals.length;
        result.push({
            year:  y + 1,
            phase: y < yearsToRetirement ? "accumulation" : "withdrawal",
            p5:    Math.round(vals[Math.floor(n * 0.05)]),
            p10:   Math.round(vals[Math.floor(n * 0.10)]),
            p25:   Math.round(vals[Math.floor(n * 0.25)]),
            p50:   Math.round(vals[Math.floor(n * 0.50)]),
            p75:   Math.round(vals[Math.floor(n * 0.75)]),
            p90:   Math.round(vals[Math.floor(n * 0.90)]),
            p95:   Math.round(vals[Math.floor(n * 0.95)])
        });
    }

    return result;
}

// ─── Retirement timeline ──────────────────────────────────────────
function retirementTimeline(
    currentAge, retirementAge, monthlySIP, preReturn,
    corpus, retirementYears, monthlyExpense, inflationRate,
    postReturn, stepUpRate = 0
) {
    const timeline = [];
    let balance    = 0;
    const monthlyRate       = preReturn / 12;
    const yearsToRetirement = retirementAge - currentAge;
    let currentSIP = monthlySIP;

    for (let year = 1; year <= yearsToRetirement; year++) {
        for (let m = 0; m < 12; m++) {
            balance  = balance * (1 + monthlyRate);
            balance += currentSIP;
        }
        if (stepUpRate > 0) currentSIP *= (1 + stepUpRate);
        timeline.push({ age: currentAge + year, corpus: Math.round(balance), phase: "accumulation" });
    }

    balance = corpus;
    let annualExpense = monthlyExpense * 12;

    for (let year = 1; year <= retirementYears; year++) {
        balance = balance * (1 + postReturn) - annualExpense;
        timeline.push({ age: retirementAge + year, corpus: Math.round(Math.max(balance, 0)), phase: "withdrawal" });
        annualExpense *= (1 + inflationRate);
        if (balance <= 0) break;
    }

    return timeline;
}

// ─── Regret calculator ────────────────────────────────────────────
function regretCalculator(currentAge, retirementAge, targetCorpus, preReturn, delayYears = 5) {
    const yearsNormal  = retirementAge - currentAge;
    const yearsDelayed = Math.max(yearsNormal - delayYears, 1);
    const sipNormal    = requiredSIP(targetCorpus, preReturn, yearsNormal);
    const sipDelayed   = requiredSIP(targetCorpus, preReturn, yearsDelayed);
    return {
        sipIfStartNow:   Math.round(sipNormal),
        sipIfDelayed:    Math.round(sipDelayed),
        extraMonthlySIP: Math.round(sipDelayed - sipNormal),
        extraTotalPaid:  Math.round((sipDelayed * yearsDelayed - sipNormal * yearsNormal) * 12),
        delayYears
    };
}

// ─── Sensitivity table ────────────────────────────────────────────
function sensitivityTable(targetCorpus, yearsToRetirement, baseReturn, baseInflation) {
    const returnOffsets    = [-0.02, 0, 0.02];
    const inflationOffsets = [-0.01, 0, 0.01];
    const table = returnOffsets.map(ro =>
        inflationOffsets.map(() => Math.round(requiredSIP(targetCorpus, baseReturn + ro, yearsToRetirement)))
    );
    return {
        table,
        returnLabels:    returnOffsets.map(o => ((baseReturn + o) * 100).toFixed(0) + "%"),
        inflationLabels: inflationOffsets.map(o => ((baseInflation + o) * 100).toFixed(0) + "%")
    };
}

module.exports = {
    futureExpense,
    futureExpenseWithBuckets,
    retirementCorpus,
    requiredSIP,
    stepUpSIPValue,
    requiredStepUpSIP,
    withdrawalSimulation,
    monteCarloSimulation,
    monteCarloFanChart,
    retirementTimeline,
    regretCalculator,
    sensitivityTable
};