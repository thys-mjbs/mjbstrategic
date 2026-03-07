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

  ["currentMonthlyRevenue","currentFixedCosts","newFixedCosts"].forEach(attachNumFormat);

  function runDiagnostic() {

    resultContainer.innerHTML = "";

    /* INPUT COLLECTION */

    const currentMonthlyRevenue = parseNum(document.getElementById("currentMonthlyRevenue").value);
    const grossMarginPercent = Number(document.getElementById("grossMarginPercent").value);
    const currentFixedCosts = parseNum(document.getElementById("currentFixedCosts").value);
    const newFixedCosts = parseNum(document.getElementById("newFixedCosts").value);
    const currentMonthlyGrowthPercent = Number(document.getElementById("currentMonthlyGrowthPercent").value);
    const targetMonths = Number(document.getElementById("targetMonths").value);

    const expectedMarginChangePercent = Number(document.getElementById("expectedMarginChangePercent").value);
    const expectedGrowthChangePercent = Number(document.getElementById("expectedGrowthChangePercent").value);
    const fixedCostOverrunPercent = Number(document.getElementById("fixedCostOverrunPercent").value);
    const rampDelayMonths = Number(document.getElementById("rampDelayMonths").value);

    const marginChangeInput = Number.isFinite(expectedMarginChangePercent) ? expectedMarginChangePercent : 0;
    const growthChangeInput = Number.isFinite(expectedGrowthChangePercent) ? expectedGrowthChangePercent : 0;
    const fixedOverrunInput = Number.isFinite(fixedCostOverrunPercent) ? fixedCostOverrunPercent : 0;
    const rampDelayInput = Number.isFinite(rampDelayMonths) ? rampDelayMonths : 0;

    const completedCount = 1;

    /* VALIDATION */

    if (
      !Number.isFinite(currentMonthlyRevenue) ||
      !Number.isFinite(grossMarginPercent) ||
      !Number.isFinite(currentFixedCosts) ||
      !Number.isFinite(newFixedCosts) ||
      !Number.isFinite(currentMonthlyGrowthPercent) ||
      !Number.isFinite(targetMonths)
    ) {
      showError("Enter valid numeric values in all required fields.");
      return;
    }

    if (
      currentMonthlyRevenue <= 0 ||
      grossMarginPercent <= 0 ||
      currentFixedCosts < 0 ||
      newFixedCosts < 0 ||
      targetMonths <= 0
    ) {
      showError("Enter valid positive values in all required fields.");
      return;
    }

    if (grossMarginPercent > 100) {
      showError("Gross margin percent must be between 0 and 100.");
      return;
    }

    if (currentMonthlyGrowthPercent < -100 || currentMonthlyGrowthPercent > 200) {
      showError("Monthly revenue growth percent must be between -100 and 200.");
      return;
    }

    if (Number.isFinite(marginChangeInput)) {
      if (marginChangeInput < -50 || marginChangeInput > 50) {
        showError("Expected gross margin change must be between -50 and 50.");
        return;
      }
    }

    if (Number.isFinite(growthChangeInput)) {
      if (growthChangeInput < -100 || growthChangeInput > 200) {
        showError("Expected growth change must be between -100 and 200.");
        return;
      }
    }

    if (Number.isFinite(fixedOverrunInput)) {
      if (fixedOverrunInput < 0 || fixedOverrunInput > 100) {
        showError("Fixed cost overrun allowance must be between 0 and 100.");
        return;
      }
    }

    if (Number.isFinite(rampDelayInput)) {
      if (rampDelayInput < 0 || rampDelayInput > 24) {
        showError("Ramp delay must be between 0 and 24 months.");
        return;
      }
    }

    /* BASELINE CALCULATION */

    const baselineMarginDecimal = grossMarginPercent / 100;
    const baselineMonthlyGrossProfit = currentMonthlyRevenue * baselineMarginDecimal;
    const baselineMonthlySurplus = baselineMonthlyGrossProfit - currentFixedCosts;

    const baselineBreakEvenRevenue = currentFixedCosts / baselineMarginDecimal;
    const baselineBreakEvenGap = baselineBreakEvenRevenue - currentMonthlyRevenue;

    /* SCENARIO CALCULATION */

    const scenarioFixedCostsBase = currentFixedCosts + newFixedCosts;
    const scenarioFixedCosts = scenarioFixedCostsBase * (1 + fixedOverrunInput / 100);

    const scenarioGrossMarginPercent = grossMarginPercent + marginChangeInput;
    if (scenarioGrossMarginPercent <= 0 || scenarioGrossMarginPercent > 100) {
      showError("Scenario gross margin percent must be between 1 and 100.");
      return;
    }

    const scenarioMarginDecimal = scenarioGrossMarginPercent / 100;

    const scenarioBreakEvenRevenue = scenarioFixedCosts / scenarioMarginDecimal;
    const additionalRevenueRequired = scenarioBreakEvenRevenue - currentMonthlyRevenue;

    const percentIncreaseDecimal = additionalRevenueRequired / currentMonthlyRevenue;

    const scenarioMonthlyGrossProfitAtCurrentRevenue = currentMonthlyRevenue * scenarioMarginDecimal;
    const scenarioMonthlySurplusAtCurrentRevenue = scenarioMonthlyGrossProfitAtCurrentRevenue - scenarioFixedCosts;

    const scenarioMonthlyGrowthPercent = currentMonthlyGrowthPercent + growthChangeInput;
    const scenarioGrowthDecimal = scenarioMonthlyGrowthPercent / 100;

    let monthsToScenarioBreakEven = null;

    if (scenarioBreakEvenRevenue <= currentMonthlyRevenue) {
      monthsToScenarioBreakEven = 0;
    } else if (scenarioGrowthDecimal > 0) {
      const ratio = scenarioBreakEvenRevenue / currentMonthlyRevenue;
      const rawMonths = Math.log(ratio) / Math.log(1 + scenarioGrowthDecimal);
      const roundedMonths = Math.ceil(rawMonths);
      monthsToScenarioBreakEven = roundedMonths + Math.round(rampDelayInput);
    }

    const effectiveMonthsForTarget = Math.max(1, Math.round(targetMonths) - Math.round(rampDelayInput));
    const requiredGrowthDecimal = Math.pow(scenarioBreakEvenRevenue / currentMonthlyRevenue, 1 / effectiveMonthsForTarget) - 1;

    /* SENSITIVITY CALCULATION */

    const scenarioMarginUpPercent = scenarioGrossMarginPercent + 1;
    const scenarioMarginUpDecimal = scenarioMarginUpPercent / 100;

    const scenarioBreakEvenRevenueMarginUp = scenarioFixedCosts / scenarioMarginUpDecimal;
    const breakEvenReductionFromMarginUp = scenarioBreakEvenRevenue - scenarioBreakEvenRevenueMarginUp;

    /* REPORT TEXT VARIABLES */

    const currentRevenueFormatted = formatNumber(currentMonthlyRevenue);
    const currentFixedCostsFormatted = formatNumber(currentFixedCosts);
    const newFixedCostsFormatted = formatNumber(newFixedCosts);

    const baselineGrossProfitFormatted = formatNumber(baselineMonthlyGrossProfit);
    const baselineSurplusFormatted = formatNumber(baselineMonthlySurplus);
    const baselineBreakEvenRevenueFormatted = formatNumber(baselineBreakEvenRevenue);
    const baselineBreakEvenGapFormatted = formatNumber(baselineBreakEvenGap);

    const scenarioFixedCostsFormatted = formatNumber(scenarioFixedCosts);
    const scenarioBreakEvenRevenueFormatted = formatNumber(scenarioBreakEvenRevenue);
    const additionalRevenueRequiredFormatted = formatNumber(additionalRevenueRequired);

    const percentIncreaseDisplay = Math.round(percentIncreaseDecimal * 100);

    const scenarioGrossMarginDisplay = Math.round(scenarioGrossMarginPercent);
    const scenarioMonthlySurplusAtCurrentRevenueFormatted = formatNumber(scenarioMonthlySurplusAtCurrentRevenue);

    const scenarioMonthlyGrowthDisplay = Math.round(scenarioMonthlyGrowthPercent);
    const requiredGrowthDisplay = Math.round(requiredGrowthDecimal * 100);

    const rampDelayDisplay = Math.round(rampDelayInput);
    const targetMonthsDisplay = Math.round(targetMonths);

    const breakEvenReductionFromMarginUpFormatted = formatNumber(breakEvenReductionFromMarginUp);

    let monthsToScenarioBreakEvenText = "";
    if (monthsToScenarioBreakEven === null) {
      monthsToScenarioBreakEvenText = "Not reachable under a non-positive growth assumption.";
    } else if (monthsToScenarioBreakEven === 0) {
      monthsToScenarioBreakEvenText = "Already covered at current revenue.";
    } else {
      monthsToScenarioBreakEvenText = formatNumber(monthsToScenarioBreakEven) + " months.";
    }

    const overrunDisplay = Math.round(fixedOverrunInput);
    const currentMonthlyGrowthDisplay = Math.round(currentMonthlyGrowthPercent);

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>At current revenue of " + currentRevenueFormatted + " per month and gross margin of " + Math.round(baselineMarginDecimal * 100) + "%, the existing fixed cost base of " + currentFixedCostsFormatted + " implies a baseline break-even revenue of " + baselineBreakEvenRevenueFormatted + " per month. The proposed fixed cost increase of " + newFixedCostsFormatted + " lifts the scenario fixed cost base to " + scenarioFixedCostsFormatted + ", pushing scenario break-even revenue to " + scenarioBreakEvenRevenueFormatted + ".</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<p>Baseline monthly gross profit is " + baselineGrossProfitFormatted + " and baseline monthly surplus is " + baselineSurplusFormatted + ", which frames how much buffer exists before expansion. Under the scenario, break-even requires an additional " + additionalRevenueRequiredFormatted + " of monthly revenue, which is a " + percentIncreaseDisplay + "% increase versus the current run-rate.</p>" +
      "<p>With scenario gross margin at " + scenarioGrossMarginDisplay + "% and monthly growth at " + scenarioMonthlyGrowthDisplay + "% after a " + rampDelayDisplay + " month ramp delay, time to reach scenario break-even is: " + monthsToScenarioBreakEvenText + "</p>" +
      "<p>A 1% margin improvement reduces scenario break-even revenue by " + breakEvenReductionFromMarginUpFormatted + ".</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>If revenue remained flat at " + currentRevenueFormatted + ", the scenario monthly surplus would be " + scenarioMonthlySurplusAtCurrentRevenueFormatted + ", which is the immediate operational pressure created by the higher cost base. This is why expansion requires coordination across pricing discipline, order intake cadence, and the ability to fulfill volume without margin leakage.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>The baseline break-even gap versus current revenue is " + baselineBreakEvenGapFormatted + ", so the business either already carries buffer or is already operating close to the line. In the scenario the business must sustain a " + requiredGrowthDisplay + "% monthly growth rate for " + formatNumber(effectiveMonthsForTarget) + " effective months to hit the " + targetMonthsDisplay + "-month target, which is sensitive to discounting, supplier terms, and overhead control.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>Which pricing or supplier term changes would protect the scenario gross margin at " + scenarioGrossMarginDisplay + "% while volume scales?</p>" +
      "<p>If growth stays at " + currentMonthlyGrowthDisplay + "% instead of " + scenarioMonthlyGrowthDisplay + "%, what operational cuts prevent a prolonged deficit?</p>" +
      "<p>Which capacity constraints could slow order throughput and delay the " + targetMonthsDisplay + "-month break-even plan?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the revenue velocity required to carry a higher fixed cost base. Deeper diagnostic work examines how profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios interact under real operational constraints. Only a limited number of businesses are worked with at any given time because the analysis requires detailed operational understanding of orders, pricing, fulfillment capacity, and cash conversion. If this diagnostic style matches how you want to run the business, use the Contact page to explore fit.</p>";

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