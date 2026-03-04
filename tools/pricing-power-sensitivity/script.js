document.addEventListener("DOMContentLoaded", function () {
  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatNumber(value) {
    const rounded = Math.round(value);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function runDiagnostic() {
    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */
    const annualRevenue = Number(document.getElementById("annualRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const demandChangePer1Pct = Number(document.getElementById("demandChangePer1Pct").value);

    const priceIncrease2 = Number(document.getElementById("priceIncrease2").value);
    const priceIncrease3 = Number(document.getElementById("priceIncrease3").value);
    const priceIncrease5 = Number(document.getElementById("priceIncrease5").value);

    const priceRealisationPctInput = document.getElementById("priceRealisationPct").value;
    const variableCostPctInput = document.getElementById("variableCostPctOfRevenue").value;
    const orderCountInput = document.getElementById("orderCount").value;

    const priceRealisationPct = priceRealisationPctInput === "" ? null : Number(priceRealisationPctInput);
    const variableCostPctOfRevenue = variableCostPctInput === "" ? null : Number(variableCostPctInput);
    const orderCount = orderCountInput === "" ? null : Number(orderCountInput);

    /* VALIDATION */
    const requiredValues = [
      annualRevenue,
      grossMarginPct,
      demandChangePer1Pct,
      priceIncrease2,
      priceIncrease3,
      priceIncrease5
    ];

    const requiredAreValid = requiredValues.every(function (v) {
      return Number.isFinite(v);
    });

    if (!requiredAreValid) {
      showError("Enter valid numeric values in all required fields.");
      return;
    }

    if (annualRevenue <= 0) {
      showError("Annual revenue must be greater than zero.");
      return;
    }

    if (grossMarginPct < 0 || grossMarginPct > 100) {
      showError("Gross margin must be between 0 and 100.");
      return;
    }

    if (priceIncrease2 < 0 || priceIncrease3 < 0 || priceIncrease5 < 0) {
      showError("Price increase values cannot be negative.");
      return;
    }

    if (priceIncrease2 > 25 || priceIncrease3 > 25 || priceIncrease5 > 25) {
      showError("Price increase values must be 25% or lower.");
      return;
    }

    if (priceRealisationPct !== null) {
      if (!Number.isFinite(priceRealisationPct)) {
        showError("Enter a valid numeric value for price realisation rate.");
        return;
      }
      if (priceRealisationPct < 0 || priceRealisationPct > 100) {
        showError("Price realisation rate must be between 0 and 100.");
        return;
      }
    }

    if (variableCostPctOfRevenue !== null) {
      if (!Number.isFinite(variableCostPctOfRevenue)) {
        showError("Enter a valid numeric value for variable cost percent.");
        return;
      }
      if (variableCostPctOfRevenue < 0 || variableCostPctOfRevenue > 100) {
        showError("Variable cost percent must be between 0 and 100.");
        return;
      }
    }

    if (orderCount !== null) {
      if (!Number.isFinite(orderCount)) {
        showError("Enter a valid numeric value for annual order count.");
        return;
      }
      if (orderCount <= 0) {
        showError("Annual order count must be greater than zero.");
        return;
      }
    }

    /* BASELINE CALCULATION */
    const grossMarginDecimal = grossMarginPct / 100;
    const baselineRevenue = annualRevenue;
    const baselineGrossProfit = baselineRevenue * grossMarginDecimal;

    const baselineVariableCost = baselineRevenue - baselineGrossProfit;
    const baselineVariableCostPctCalculated = baselineRevenue === 0 ? 0 : baselineVariableCost / baselineRevenue;

    const baselineAverageOrderValue = orderCount === null ? null : baselineRevenue / orderCount;
    const baselineGrossProfitPerOrder = orderCount === null ? null : baselineGrossProfit / orderCount;

    /* SCENARIO CALCULATION */
    const effectiveRealisationDecimal = priceRealisationPct === null ? 1 : priceRealisationPct / 100;
    const demandChangePer1Decimal = demandChangePer1Pct / 100;

    const scenarioIncrements = [
      { label: "Scenario A", priceIncreasePct: priceIncrease2 },
      { label: "Scenario B", priceIncreasePct: priceIncrease3 },
      { label: "Scenario C", priceIncreasePct: priceIncrease5 }
    ];

    const scenarioResults = scenarioIncrements.map(function (s) {
      const priceIncreaseDecimal = s.priceIncreasePct / 100;
      const realisedPriceIncreaseDecimal = priceIncreaseDecimal * effectiveRealisationDecimal;

      const demandChangeDecimal = s.priceIncreasePct * demandChangePer1Decimal;
      const demandMultiplier = 1 + demandChangeDecimal;

      const scenarioRevenue =
        baselineRevenue * (1 + realisedPriceIncreaseDecimal) * demandMultiplier;

      const scenarioGrossProfit = scenarioRevenue * grossMarginDecimal;

      const scenarioVariableCostAssumption =
        variableCostPctOfRevenue === null
          ? scenarioRevenue * baselineVariableCostPctCalculated
          : scenarioRevenue * (variableCostPctOfRevenue / 100);

      const scenarioContribution = scenarioRevenue - scenarioVariableCostAssumption;

      return {
        label: s.label,
        priceIncreasePct: s.priceIncreasePct,
        realisedPriceIncreasePct: s.priceIncreasePct * effectiveRealisationDecimal,
        demandChangePct: s.priceIncreasePct * demandChangePer1Pct,
        scenarioRevenue: scenarioRevenue,
        scenarioGrossProfit: scenarioGrossProfit,
        scenarioContribution: scenarioContribution
      };
    });

    const scenarioResultsSorted = scenarioResults.slice().sort(function (a, b) {
      return b.scenarioGrossProfit - a.scenarioGrossProfit;
    });

    const bestScenario = scenarioResultsSorted[0];

    const scenarioGrossProfitBest = bestScenario.scenarioGrossProfit;
    const scenarioRevenueBest = bestScenario.scenarioRevenue;

    const grossProfitDelta = scenarioGrossProfitBest - baselineGrossProfit;
    const grossProfitDeltaPct = baselineGrossProfit === 0 ? 0 : grossProfitDelta / baselineGrossProfit;

    const revenueDelta = scenarioRevenueBest - baselineRevenue;
    const revenueDeltaPct = baselineRevenue === 0 ? 0 : revenueDelta / baselineRevenue;

    const derivedEffectivePriceMovePct = bestScenario.realisedPriceIncreasePct;
    const derivedDemandMovePct = bestScenario.demandChangePct;

    /* SENSITIVITY CALCULATION */
    const onePctPriceIncreaseDecimal = 0.01 * effectiveRealisationDecimal;
    const onePctDemandChangeDecimal = 1 * demandChangePer1Decimal;

    const sensitivityRevenue =
      baselineRevenue * (1 + onePctPriceIncreaseDecimal) * (1 + onePctDemandChangeDecimal);

    const sensitivityGrossProfit = sensitivityRevenue * grossMarginDecimal;
    const sensitivityGrossProfitDelta = sensitivityGrossProfit - baselineGrossProfit;

    /* REPORT TEXT VARIABLES */
    const baselineRevenueDisplay = formatNumber(baselineRevenue);
    const baselineGrossProfitDisplay = formatNumber(baselineGrossProfit);

    const scenarioRevenueDisplay = formatNumber(scenarioRevenueBest);
    const scenarioGrossProfitDisplay = formatNumber(scenarioGrossProfitBest);

    const grossProfitDeltaDisplay = formatNumber(grossProfitDelta);
    const grossProfitDeltaPctDisplay = Math.round(grossProfitDeltaPct * 100);

    const revenueDeltaDisplay = formatNumber(revenueDelta);
    const revenueDeltaPctDisplay = Math.round(revenueDeltaPct * 100);

    const effectivePriceMovePctDisplay = Math.round(derivedEffectivePriceMovePct);
    const demandMovePctDisplay = Math.round(derivedDemandMovePct);

    const sensitivityGrossProfitDeltaDisplay = formatNumber(sensitivityGrossProfitDelta);

    const baselineAverageOrderValueDisplay =
      baselineAverageOrderValue === null ? "Not provided" : formatNumber(baselineAverageOrderValue);

    const baselineGrossProfitPerOrderDisplay =
      baselineGrossProfitPerOrder === null ? "Not provided" : formatNumber(baselineGrossProfitPerOrder);

    const priceRealisationDisplay =
      priceRealisationPct === null ? "100" : String(Math.round(priceRealisationPct));

    const variableCostPctDisplay =
      variableCostPctOfRevenue === null
        ? String(Math.round(baselineVariableCostPctCalculated * 100))
        : String(Math.round(variableCostPctOfRevenue));

    const completedCount = scenarioResults.length;

    const scenariosTableRows = scenarioResults.map(function (s) {
      const scenarioRevenueCell = formatNumber(s.scenarioRevenue);
      const scenarioGrossProfitCell = formatNumber(s.scenarioGrossProfit);

      const profitDelta = s.scenarioGrossProfit - baselineGrossProfit;
      const profitDeltaPct = baselineGrossProfit === 0 ? 0 : profitDelta / baselineGrossProfit;

      const profitDeltaCell = formatNumber(profitDelta);
      const profitDeltaPctCell = Math.round(profitDeltaPct * 100);

      const realisedPricePctCell = Math.round(s.realisedPriceIncreasePct);
      const demandPctCell = Math.round(s.demandChangePct);

      return (
        "<tr>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb'>" + s.label + "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + realisedPricePctCell + "%</td>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + demandPctCell + "%</td>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + scenarioRevenueCell + "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + scenarioGrossProfitCell + "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + profitDeltaCell + "</td>" +
        "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + profitDeltaPctCell + "%</td>" +
        "</tr>"
      );
    }).join("");

    const bestScenarioLabel = bestScenario.label;
    const bestScenarioPriceIncreasePct = Math.round(bestScenario.priceIncreasePct);

    /* REPORT RENDER */
    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Baseline revenue is " + baselineRevenueDisplay + " with gross profit of " + baselineGrossProfitDisplay + " at a " + Math.round(grossMarginPct) + "% gross margin. Under the strongest tested price move (" + bestScenarioLabel + "), revenue shifts to " + scenarioRevenueDisplay + " and gross profit shifts to " + scenarioGrossProfitDisplay + ", a change of " + grossProfitDeltaDisplay + " (" + grossProfitDeltaPctDisplay + "%).</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<p>The scenario assumes " + priceRealisationDisplay + "% price realisation and variable costs at " + variableCostPctDisplay + "% of revenue. In the best case tested, the realised price move is " + effectivePriceMovePctDisplay + "% and the modelled demand change is " + demandMovePctDisplay + "%, producing a revenue change of " + revenueDeltaDisplay + " (" + revenueDeltaPctDisplay + "%).</p>" +
      "<table style='width:100%;border-collapse:collapse;margin-top:10px'>" +
      "<thead>" +
      "<tr>" +
      "<th style='text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Scenario</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Realised price</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Demand change</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Revenue</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Gross profit</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Profit delta</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Profit delta %</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      scenariosTableRows +
      "</tbody>" +
      "</table>" +
      "<p style='margin-top:10px'>Sensitivity: a 1% price increase (at the assumed realisation and demand response) shifts gross profit by " + sensitivityGrossProfitDeltaDisplay + ".</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>If gross profit rises while revenue is flat or down, the business has pricing power that is not dependent on extra capacity or more orders. In this model the best tested move is " + bestScenarioPriceIncreasePct + "%, delivering a gross profit change of " + grossProfitDeltaDisplay + " while demand shifts by " + demandMovePctDisplay + "%, which is typically managed through quoting discipline, renewal execution, and discount control.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>This output is only as stable as the demand response assumption and realised price discipline. If price leakage widens by 5 points from the assumed " + priceRealisationDisplay + "%, or if customers react more aggressively than " + demandChangePer1Pct + "% per 1%, the expected profit delta of " + grossProfitDeltaDisplay + " can compress quickly.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>1) Where is price currently set by policy versus by sales discretion, and how does that affect the " + priceRealisationDisplay + "% realisation assumption?</p>" +
      "<p>2) Which customer segments would absorb a " + bestScenarioPriceIncreasePct + "% move with the smallest order loss, and what would that do to gross profit over the next 60 days?</p>" +
      "<p>3) Which discount behaviours or rebate structures could be tightened to protect the modelled " + grossProfitDeltaDisplay + " uplift?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: profit sensitivity to small price movement under an assumed demand response. Deeper diagnostic work examines interactions between profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding. If this diagnostic thinking resonates, use the Contact page to discuss fit.</p>";

    resultContainer.innerHTML = report;
  }

  calculateButton.addEventListener("click", runDiagnostic);

  shareButton.addEventListener("click", function () {
    const url = window.location.href;

    const shareLink =
      "https://api.whatsapp.com/send?text=" +
      encodeURIComponent("Useful diagnostic tool: " + url);

    window.open(shareLink, "_blank");
  });
});