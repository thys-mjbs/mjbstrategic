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
    const annualFixedCosts = Number(document.getElementById("annualFixedCosts").value);
    const availableCash = Number(document.getElementById("availableCash").value);
    const annualDebtService = Number(document.getElementById("annualDebtService").value) || 0;
    const fixedCostReductionPct = Number(document.getElementById("fixedCostReductionPct").value) || 0;
    const wcReleaseRevenuePct = Number(document.getElementById("wcReleaseRevenuePct").value) || 0;

    /* VALIDATION */

    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (!grossMarginPct || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!annualFixedCosts || annualFixedCosts <= 0) {
      showError("Enter a valid annual fixed costs figure.");
      return;
    }
    if (isNaN(availableCash) || availableCash < 0) {
      showError("Enter a valid available cash and facility figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossProfit = annualRevenue * (grossMarginPct / 100);
    const operatingProfit = grossProfit - annualFixedCosts;
    const operatingMarginPct = (operatingProfit / annualRevenue) * 100;
    const monthlyFixedCosts = annualFixedCosts / 12;
    const monthlyDebtService = annualDebtService / 12;
    const monthlyCashBurn = operatingProfit >= 0 ? 0 : Math.abs(operatingProfit) / 12 + monthlyDebtService;

    /* Break-even revenue */
    const breakEvenRevenue = annualFixedCosts / (grossMarginPct / 100);
    const breakEvenDeclinePct = ((annualRevenue - breakEvenRevenue) / annualRevenue) * 100;

    /* MITIGATION */
    const fixedCostSaving = annualFixedCosts * (fixedCostReductionPct / 100);
    const mitigatedFixedCosts = annualFixedCosts - fixedCostSaving;
    const wcCashRelease = annualRevenue * (wcReleaseRevenuePct / 100);
    const totalMitigationCash = wcCashRelease;
    const effectiveCash = availableCash + totalMitigationCash;

    /* SCENARIO FUNCTION */

    function calcScenario(declinePct) {
      const scenarioRevenue = annualRevenue * (1 - declinePct / 100);
      const scenarioGrossProfit = scenarioRevenue * (grossMarginPct / 100);
      const scenarioGrossMarginPct = grossMarginPct; /* margin rate unchanged */
      const scenarioOperatingProfit = scenarioGrossProfit - mitigatedFixedCosts;
      const scenarioOperatingMarginPct = (scenarioOperatingProfit / scenarioRevenue) * 100;
      const monthlyNetPosition = (scenarioOperatingProfit - annualDebtService) / 12;
      let runwayMonths;
      if (monthlyNetPosition >= 0) {
        runwayMonths = null; /* cash positive */
      } else {
        runwayMonths = effectiveCash / Math.abs(monthlyNetPosition);
      }
      return {
        declinePct: declinePct,
        scenarioRevenue: scenarioRevenue,
        scenarioGrossProfit: scenarioGrossProfit,
        scenarioOperatingProfit: scenarioOperatingProfit,
        scenarioOperatingMarginPct: scenarioOperatingMarginPct,
        monthlyNetPosition: monthlyNetPosition,
        runwayMonths: runwayMonths
      };
    }

    const s10 = calcScenario(10);
    const s20 = calcScenario(20);
    const s30 = calcScenario(30);

    /* SURVIVAL ASSESSMENT */

    function runwayLabel(s) {
      if (s.runwayMonths === null) return "cash positive";
      if (s.runwayMonths >= 24) return Math.round(s.runwayMonths) + " months";
      if (s.runwayMonths >= 1) return Math.round(s.runwayMonths * 10) / 10 + " months";
      return "less than 1 month";
    }

    function statusLabel(s) {
      if (s.runwayMonths === null) return "viable";
      if (s.runwayMonths >= 18) return "manageable";
      if (s.runwayMonths >= 9) return "under pressure";
      if (s.runwayMonths >= 3) return "at risk";
      return "critical";
    }

    /* CRITICAL THRESHOLD IDENTIFICATION */

    let criticalDecline = null;
    if (breakEvenDeclinePct <= 10) criticalDecline = 10;
    else if (breakEvenDeclinePct <= 20) criticalDecline = 20;
    else if (breakEvenDeclinePct <= 30) criticalDecline = 30;

    const hasMitigation = fixedCostReductionPct > 0 || wcReleaseRevenuePct > 0;

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>At current revenue of " + formatNumber(annualRevenue) + ", the business generates operating profit of " + formatNumber(operatingProfit) + " (" + Math.round(operatingMarginPct * 10) / 10 + "% margin). Break-even occurs at " + formatNumber(Math.round(breakEvenRevenue)) + " in annual revenue, which represents a " + Math.round(breakEvenDeclinePct * 10) / 10 + "% decline from current levels. " +
      (criticalDecline !== null ? "The operating loss threshold is breached within the 10–30% stress range tested." : "The operating loss threshold is not reached at a 30% revenue decline under current fixed cost assumptions.") +
      (hasMitigation ? " Applied mitigation includes " + (fixedCostReductionPct > 0 ? fixedCostReductionPct + "% fixed cost reduction (" + formatNumber(fixedCostSaving) + " annually)" : "") + (fixedCostReductionPct > 0 && wcReleaseRevenuePct > 0 ? " and " : "") + (wcReleaseRevenuePct > 0 ? wcReleaseRevenuePct + "% working capital release (" + formatNumber(wcCashRelease) + ")" : "") + ", extending effective cash resources to " + formatNumber(effectiveCash) + "." : "") +
      "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Scenario</th><th>Revenue</th><th>Gross profit</th><th>Operating profit</th><th>Monthly net</th><th>Runway</th><th>Status</th></tr></thead><tbody>" +
      "<tr><td>Baseline</td><td>" + formatNumber(annualRevenue) + "</td><td>" + formatNumber(grossProfit) + "</td><td>" + formatNumber(operatingProfit) + "</td><td>" + formatNumber((operatingProfit - annualDebtService) / 12) + "</td><td>—</td><td>current</td></tr>" +
      "<tr><td>−10% revenue</td><td>" + formatNumber(s10.scenarioRevenue) + "</td><td>" + formatNumber(s10.scenarioGrossProfit) + "</td><td>" + formatNumber(s10.scenarioOperatingProfit) + "</td><td>" + formatNumber(s10.monthlyNetPosition) + "</td><td>" + runwayLabel(s10) + "</td><td>" + statusLabel(s10) + "</td></tr>" +
      "<tr><td>−20% revenue</td><td>" + formatNumber(s20.scenarioRevenue) + "</td><td>" + formatNumber(s20.scenarioGrossProfit) + "</td><td>" + formatNumber(s20.scenarioOperatingProfit) + "</td><td>" + formatNumber(s20.monthlyNetPosition) + "</td><td>" + runwayLabel(s20) + "</td><td>" + statusLabel(s20) + "</td></tr>" +
      "<tr><td>−30% revenue</td><td>" + formatNumber(s30.scenarioRevenue) + "</td><td>" + formatNumber(s30.scenarioGrossProfit) + "</td><td>" + formatNumber(s30.scenarioOperatingProfit) + "</td><td>" + formatNumber(s30.monthlyNetPosition) + "</td><td>" + runwayLabel(s30) + "</td><td>" + statusLabel(s30) + "</td></tr>" +
      "</tbody></table>" +
      "<p>Effective resources available to absorb losses: " + formatNumber(effectiveCash) + " (" + formatNumber(availableCash) + " cash and facility" + (wcCashRelease > 0 ? " plus " + formatNumber(wcCashRelease) + " working capital release" : "") + "). Break-even revenue: " + formatNumber(Math.round(breakEvenRevenue)) + " (requires " + Math.round(breakEvenDeclinePct * 10) / 10 + "% revenue decline to breach).</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>The stress-test reveals that a " + (criticalDecline !== null ? criticalDecline + "% revenue decline is sufficient to move the business to an operating loss position" : "30% revenue decline does not eliminate operating profit at the current gross margin and fixed cost structure") + ". The critical dynamic is operating leverage: fixed costs of " + formatNumber(annualFixedCosts) + " are spread over a declining revenue base, meaning the fixed cost as a percentage of revenue rises with each unit of revenue lost. At the gross margin of " + grossMarginPct + "%, every " + formatNumber(Math.round(annualFixedCosts / grossMarginPct * 10)) + " of revenue lost eliminates " + formatNumber(Math.round(annualFixedCosts / grossMarginPct * 10 * grossMarginPct / 100)) + " from gross profit. This is the mechanical relationship that makes fixed cost-heavy businesses disproportionately sensitive to revenue decline.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Revenue downturns rarely arrive with warning or follow a predictable pattern. The value of a pre-defined stress-test is that it converts the general risk of a downturn into a specific number — the runway available before intervention becomes mandatory. A runway of fewer than 6 months in a 20% scenario means the window between a downturn emerging and cash exhaustion is too short for most structural responses. Staff reductions, sourcing renegotiations, and capital raising all take longer than 6 months to execute at the scale needed to be meaningful. Businesses with short survival windows should hold larger cash buffers or maintain more available facility than they currently consider necessary.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>At which specific revenue decline level has the board pre-committed to specific cost reduction actions, and are those actions sufficiently detailed to execute within 30 days of the trigger being reached?</p>" +
      "<p>What is the realistic pace at which fixed costs can actually be reduced — distinguishing between costs that can be cut in 30 days and those locked in through lease or contract commitments of 12 months or more?</p>" +
      "<p>Is the available cash and facility figure a genuine, drawable resource, or does it include theoretical headroom that creditors would withdraw in a downturn precisely when it is needed most?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator models the financial mechanics of revenue decline under static gross margin and defined cost reduction assumptions. Deeper diagnostic work examines how quickly costs can actually be reduced given the specific contractual and operational structure, which revenue streams are most likely to decline and in what sequence, how the working capital position changes as receivables and inventory levels shift under downturn conditions, and what actions would most effectively extend survival runway per unit of management effort. MJB Strategic works with a limited number of businesses at any time because downturn resilience planning requires understanding the specific constraints that determine how quickly the business can respond. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
