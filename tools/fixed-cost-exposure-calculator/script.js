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

  function parseNum(str) {
    return Number(String(str).replace(/,/g, ""));
  }

  function attachNumFormat(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.type = "text";
    el.inputMode = "numeric";
    el.addEventListener("blur", function () {
      var raw = this.value.replace(/[^0-9.-]/g, "");
      if (raw === "" || raw === "-") return;
      var parts = raw.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      this.value = parts.join(".");
    });
    el.addEventListener("focus", function () {
      this.value = this.value.replace(/,/g, "");
    });
  }

  ["monthlyRevenue","monthlyFixedCosts","monthlyDebtService","cashReserves"].forEach(attachNumFormat);

  function runDiagnostic() {
    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */
    const monthlyRevenue = parseNum(document.getElementById("monthlyRevenue").value);
    const monthlyFixedCosts = parseNum(document.getElementById("monthlyFixedCosts").value);
    const variableCostPercent = Number(document.getElementById("variableCostPercent").value);
    const monthlyDebtService = parseNum(document.getElementById("monthlyDebtService").value);
    const cashReserves = parseNum(document.getElementById("cashReserves").value);

    const revenueDeclinePercentInput = document.getElementById("revenueDeclinePercent").value;
    const fixedCostReductionPercentInput = document.getElementById("fixedCostReductionPercent").value;
    const variableCostChangePointsInput = document.getElementById("variableCostChangePoints").value;

    const revenueDeclinePercent =
      revenueDeclinePercentInput === "" ? 20 : Number(revenueDeclinePercentInput);

    const fixedCostReductionPercent =
      fixedCostReductionPercentInput === "" ? 0 : Number(fixedCostReductionPercentInput);

    const variableCostChangePoints =
      variableCostChangePointsInput === "" ? 0 : Number(variableCostChangePointsInput);

    /* VALIDATION */
    const requiredValues = [
      monthlyRevenue,
      monthlyFixedCosts,
      variableCostPercent,
      monthlyDebtService,
      cashReserves
    ];

    for (let i = 0; i < requiredValues.length; i++) {
      if (!Number.isFinite(requiredValues[i])) {
        showError("Enter valid numeric values in all required fields.");
        return;
      }
    }

    if (
      monthlyRevenue <= 0 ||
      monthlyFixedCosts < 0 ||
      monthlyDebtService < 0 ||
      cashReserves < 0
    ) {
      showError("Enter valid non-negative values. Monthly revenue must be greater than zero.");
      return;
    }

    if (!Number.isFinite(revenueDeclinePercent) || revenueDeclinePercent < 0 || revenueDeclinePercent > 60) {
      showError("Scenario revenue decline must be between 0 and 60.");
      return;
    }

    if (!Number.isFinite(fixedCostReductionPercent) || fixedCostReductionPercent < 0 || fixedCostReductionPercent > 40) {
      showError("Fixed cost reduction must be between 0 and 40.");
      return;
    }

    if (!Number.isFinite(variableCostPercent) || variableCostPercent < 0 || variableCostPercent > 95) {
      showError("Variable cost percent must be between 0 and 95.");
      return;
    }

    if (!Number.isFinite(variableCostChangePoints) || variableCostChangePoints < -20 || variableCostChangePoints > 20) {
      showError("Variable cost change points must be between -20 and 20.");
      return;
    }

    const baselineVariableCostRate = variableCostPercent / 100;
    const baselineContributionMarginRate = 1 - baselineVariableCostRate;

    if (baselineContributionMarginRate <= 0) {
      showError("Variable costs are too high to compute a valid contribution margin.");
      return;
    }

    /* BASELINE CALCULATION */
    const baselineContribution = monthlyRevenue * baselineContributionMarginRate;
    const baselineTotalFixedLoad = monthlyFixedCosts + monthlyDebtService;
    const baselineOperatingProfit = baselineContribution - baselineTotalFixedLoad;

    const baselineBreakEvenRevenue = baselineTotalFixedLoad / baselineContributionMarginRate;
    const baselineCoveragePercent = (baselineContribution / baselineTotalFixedLoad) * 100;

    const baselineBurn = baselineOperatingProfit < 0 ? Math.abs(baselineOperatingProfit) : 0;
    const baselineRunwayMonths =
      baselineBurn > 0 ? cashReserves / baselineBurn : 0;

    /* SCENARIO CALCULATION */
    const scenarioRevenue = monthlyRevenue * (1 - (revenueDeclinePercent / 100));
    const scenarioFixedCosts = monthlyFixedCosts * (1 - (fixedCostReductionPercent / 100));

    const scenarioVariableCostPercent = variableCostPercent + variableCostChangePoints;
    if (scenarioVariableCostPercent < 0 || scenarioVariableCostPercent > 95) {
      showError("Scenario variable cost percent must remain between 0 and 95.");
      return;
    }

    const scenarioVariableCostRate = scenarioVariableCostPercent / 100;
    const scenarioContributionMarginRate = 1 - scenarioVariableCostRate;

    if (scenarioContributionMarginRate <= 0) {
      showError("Scenario contribution margin is not viable under the provided assumptions.");
      return;
    }

    const scenarioContribution = scenarioRevenue * scenarioContributionMarginRate;
    const scenarioTotalFixedLoad = scenarioFixedCosts + monthlyDebtService;
    const scenarioOperatingProfit = scenarioContribution - scenarioTotalFixedLoad;

    const scenarioBreakEvenRevenue = scenarioTotalFixedLoad / scenarioContributionMarginRate;
    const scenarioCoveragePercent = (scenarioContribution / scenarioTotalFixedLoad) * 100;

    const scenarioBurn = scenarioOperatingProfit < 0 ? Math.abs(scenarioOperatingProfit) : 0;
    const scenarioRunwayMonths =
      scenarioBurn > 0 ? cashReserves / scenarioBurn : 0;

    const operatingProfitDelta = scenarioOperatingProfit - baselineOperatingProfit;

    const baselineOperatingProfitForPct = Math.abs(baselineOperatingProfit) < 1 ? 1 : Math.abs(baselineOperatingProfit);
    const operatingProfitDeltaPercent = (operatingProfitDelta / baselineOperatingProfitForPct) * 100;

    /* SENSITIVITY CALCULATION */
    const revenueOnePercent = monthlyRevenue * 0.01;
    const sensitivityProfitShift = revenueOnePercent * baselineContributionMarginRate;

    /* REPORT TEXT VARIABLES */
    const baselineRevenueFormatted = formatNumber(monthlyRevenue);
    const baselineFixedFormatted = formatNumber(monthlyFixedCosts);
    const baselineDebtFormatted = formatNumber(monthlyDebtService);
    const baselineTotalFixedLoadFormatted = formatNumber(baselineTotalFixedLoad);
    const cashReservesFormatted = formatNumber(cashReserves);

    const baselineContributionFormatted = formatNumber(baselineContribution);
    const baselineOperatingProfitFormatted = formatNumber(baselineOperatingProfit);
    const baselineBreakEvenRevenueFormatted = formatNumber(baselineBreakEvenRevenue);
    const baselineCoveragePercentFormatted = Math.round(baselineCoveragePercent);
    const baselineContributionMarginPercentFormatted = Math.round(baselineContributionMarginRate * 100);

    const scenarioRevenueFormatted = formatNumber(scenarioRevenue);
    const scenarioFixedFormatted = formatNumber(scenarioFixedCosts);
    const scenarioContributionFormatted = formatNumber(scenarioContribution);
    const scenarioOperatingProfitFormatted = formatNumber(scenarioOperatingProfit);
    const scenarioBreakEvenRevenueFormatted = formatNumber(scenarioBreakEvenRevenue);
    const scenarioCoveragePercentFormatted = Math.round(scenarioCoveragePercent);
    const scenarioContributionMarginPercentFormatted = Math.round(scenarioContributionMarginRate * 100);

    const operatingProfitDeltaFormatted = formatNumber(operatingProfitDelta);
    const operatingProfitDeltaPercentFormatted = Math.round(operatingProfitDeltaPercent);

    const sensitivityProfitShiftFormatted = formatNumber(sensitivityProfitShift);

    const baselineBurnFormatted = formatNumber(baselineBurn);
    const scenarioBurnFormatted = formatNumber(scenarioBurn);

    const baselineRunwayMonthsRounded = Math.round(baselineRunwayMonths);
    const scenarioRunwayMonthsRounded = Math.round(scenarioRunwayMonths);

    const scenarioDeclinePctRounded = Math.round(revenueDeclinePercent);
    const scenarioFixedReductionPctRounded = Math.round(fixedCostReductionPercent);
    const scenarioVariableCostPercentRounded = Math.round(scenarioVariableCostPercent);

    const fixedFlexLabel =
      scenarioFixedReductionPctRounded > 0
        ? "Assuming you can reduce fixed costs by " + scenarioFixedReductionPctRounded + "% within 60 days, "
        : "Assuming fixed costs cannot be reduced quickly, ";

    const baselineProfitState =
      baselineOperatingProfit >= 0 ? "positive" : "negative";

    const scenarioProfitState =
      scenarioOperatingProfit >= 0 ? "positive" : "negative";

    const baselineRunwayLine =
      baselineBurn > 0
        ? "At the current loss rate of " + baselineBurnFormatted + " per month, cash reserves fund about " + baselineRunwayMonthsRounded + " months."
        : "With positive operating profit, cash reserves are not the limiting constraint in baseline conditions.";

    const scenarioRunwayLine =
      scenarioBurn > 0
        ? "Under the scenario loss rate of " + scenarioBurnFormatted + " per month, cash reserves fund about " + scenarioRunwayMonthsRounded + " months."
        : "Under the scenario assumptions, operating profit remains positive and cash burn is not the immediate constraint.";

    const downsideTableRows = (function () {
      const declines = [10, 20, 30];
      let rows = "";

      for (let i = 0; i < declines.length; i++) {
        const d = declines[i];
        const dRevenue = monthlyRevenue * (1 - (d / 100));
        const dContribution = dRevenue * baselineContributionMarginRate;
        const dProfit = dContribution - baselineTotalFixedLoad;
        const dCoverage = (dContribution / baselineTotalFixedLoad) * 100;

        const dRevenueFormatted = formatNumber(dRevenue);
        const dProfitFormatted = formatNumber(dProfit);
        const dCoverageFormatted = Math.round(dCoverage);

        rows +=
          "<tr>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb'>" + d + "%</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + dRevenueFormatted + "</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + dProfitFormatted + "</td>" +
          "<td style='padding:8px 10px;border-top:1px solid #e5e7eb;text-align:right'>" + dCoverageFormatted + "%</td>" +
          "</tr>";
      }

      return rows;
    })();

    /* REPORT RENDER */
    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Baseline revenue is " + baselineRevenueFormatted + " with variable costs at " + baselineContributionMarginPercentFormatted + "% contribution margin. Fixed load (fixed costs plus debt service) totals " + baselineTotalFixedLoadFormatted + ", producing " + baselineProfitState + " operating profit of " + baselineOperatingProfitFormatted + " and a break-even revenue level of " + baselineBreakEvenRevenueFormatted + ".</p>" +
      "<p>Scenario assumes a " + scenarioDeclinePctRounded + "% revenue decline to " + scenarioRevenueFormatted + ", " + scenarioVariableCostPercentRounded + "% variable cost rate, and fixed costs of " + scenarioFixedFormatted + ". Under this state, operating profit is " + scenarioProfitState + " at " + scenarioOperatingProfitFormatted + " with break-even revenue of " + scenarioBreakEvenRevenueFormatted + ".</p>" +
      "<p>The operating profit movement between baseline and scenario is " + operatingProfitDeltaFormatted + " (" + operatingProfitDeltaPercentFormatted + "% versus baseline magnitude), which is the practical measure of fixed cost exposure.</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<p>Break-even revenue is the fixed load divided by contribution margin. In baseline, contribution is " + baselineContributionFormatted + " and coverage is " + baselineCoveragePercentFormatted + "% of fixed load. In scenario, contribution is " + scenarioContributionFormatted + " and coverage is " + scenarioCoveragePercentFormatted + "% of fixed load, reflecting how quickly fixed absorption deteriorates when invoices slow.</p>" +
      "<p>" + fixedFlexLabel + "this scenario embeds the cost flexibility assumption directly into the break-even level of " + scenarioBreakEvenRevenueFormatted + ".</p>" +
      "<p>Sensitivity: a 1% revenue decline shifts operating profit by about " + sensitivityProfitShiftFormatted + " per month at the current margin.</p>" +
      "<table style='width:100%;border-collapse:collapse;margin-top:10px'>" +
      "<thead>" +
      "<tr>" +
      "<th style='text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Revenue decline</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Revenue</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Operating profit</th>" +
      "<th style='text-align:right;padding:8px 10px;border-bottom:1px solid #e5e7eb'>Coverage</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      downsideTableRows +
      "</tbody>" +
      "</table>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>This cost structure behaves like a leverage system: the fixed load of " + baselineTotalFixedLoadFormatted + " must be covered before any profit is retained. With a contribution margin of " + baselineContributionMarginPercentFormatted + "%, each 1% drop in revenue removes about " + sensitivityProfitShiftFormatted + " from monthly profit capacity, which is why profitability can flip quickly as order volume softens.</p>" +
      "<p>In scenario conditions the business runs at " + scenarioCoveragePercentFormatted + "% fixed cost coverage and profit of " + scenarioOperatingProfitFormatted + ", which indicates whether costs can be absorbed without immediate pricing pressure, headcount actions, or supplier renegotiation.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Fixed cost exposure is most dangerous when the break-even revenue level sits close to current revenue. Here baseline break-even is " + baselineBreakEvenRevenueFormatted + " against revenue of " + baselineRevenueFormatted + ", and scenario break-even is " + scenarioBreakEvenRevenueFormatted + " against scenario revenue of " + scenarioRevenueFormatted + ".</p>" +
      "<p>Cash reserves of " + cashReservesFormatted + " determine how long losses can be funded while decisions are implemented. " + baselineRunwayLine + " " + scenarioRunwayLine + "</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>1) Which fixed cost lines inside " + baselineFixedFormatted + " can be reduced within 30–60 days without breaking capacity?</p>" +
      "<p>2) Which pricing, discounting, or supplier term moves protect the " + baselineContributionMarginPercentFormatted + "% contribution margin under volume stress?</p>" +
      "<p>3) If revenue fell to " + scenarioRevenueFormatted + " for two months, what specific actions prevent losses exceeding " + scenarioBurnFormatted + " per month?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: fixed cost exposure under revenue change. Deeper diagnostic work examines how profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios interact as a system. Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding and clean management data. If this diagnostic framing matches how you think about operating risk, use the Contact page to discuss fit.</p>";

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