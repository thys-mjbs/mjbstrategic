document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString();
  }

  function runDiagnostic() {

    const currentRevenue = Number(document.getElementById("currentRevenue").value);
    const currentFixedCosts = Number(document.getElementById("currentFixedCosts").value);
    const newFixedCosts = Number(document.getElementById("newFixedCosts").value);
    const grossMarginPercent = Number(document.getElementById("grossMarginPercent").value);

    if (
      !isFinite(currentRevenue) ||
      !isFinite(currentFixedCosts) ||
      !isFinite(newFixedCosts) ||
      !isFinite(grossMarginPercent)
    ) {
      showError("Enter valid numeric values in all required fields.");
      return;
    }

    if (
      currentRevenue < 0 ||
      currentFixedCosts < 0 ||
      newFixedCosts < 0
    ) {
      showError("Values cannot be negative.");
      return;
    }

    if (grossMarginPercent <= 0 || grossMarginPercent > 100) {
      showError("Enter a gross margin percent between 1 and 100.");
      return;
    }

    const grossMarginDecimal = grossMarginPercent / 100;

    const currentGrossProfit = currentRevenue * grossMarginDecimal;
    const currentOperatingProfit = currentGrossProfit - currentFixedCosts;

    const newTotalFixedCosts = currentFixedCosts + newFixedCosts;

    const breakEvenRevenueRequired = newTotalFixedCosts / grossMarginDecimal;

    const additionalRevenueRequired = breakEvenRevenueRequired - currentRevenue;

    const additionalGrossProfitRequired = newFixedCosts;

    const revenueGrowthRequiredDecimal = additionalRevenueRequired / currentRevenue;
    const revenueGrowthRequiredPercent = Math.round(revenueGrowthRequiredDecimal * 100);

    const requiredMonthlyRevenueLift = additionalRevenueRequired;

    const assumedMonthlyGrowthDecimal = 0.05;

    let monthsToBreakEven = 0;
    let projectedRevenue = currentRevenue;

    if (additionalRevenueRequired <= 0) {
      monthsToBreakEven = 0;
    } else {
      while (projectedRevenue < breakEvenRevenueRequired && monthsToBreakEven < 60) {
        projectedRevenue = projectedRevenue * (1 + assumedMonthlyGrowthDecimal);
        monthsToBreakEven = monthsToBreakEven + 1;
      }
    }

    const currentRevenueRounded = formatNumber(currentRevenue);
    const currentFixedCostsRounded = formatNumber(currentFixedCosts);
    const newFixedCostsRounded = formatNumber(newFixedCosts);
    const newTotalFixedCostsRounded = formatNumber(newTotalFixedCosts);

    const breakEvenRevenueRequiredRounded = formatNumber(breakEvenRevenueRequired);
    const additionalRevenueRequiredRounded = formatNumber(additionalRevenueRequired);
    const requiredMonthlyRevenueLiftRounded = formatNumber(requiredMonthlyRevenueLift);

    const currentGrossProfitRounded = formatNumber(currentGrossProfit);
    const currentOperatingProfitRounded = formatNumber(currentOperatingProfit);

    const additionalGrossProfitRequiredRounded = formatNumber(additionalGrossProfitRequired);

    let breakEvenTimingLine = "";
    let breakEvenTimingRisk = "";

    if (additionalRevenueRequired <= 0) {
      breakEvenTimingLine =
        "The planned fixed cost increase is already covered by current revenue throughput at the stated margin.";
      breakEvenTimingRisk =
        "This indicates the current structure has unused coverage capacity, but cash timing and execution still matter.";
    } else if (monthsToBreakEven === 0) {
      breakEvenTimingLine =
        "At the stated margin, the revenue required to support the new cost base is already met.";
      breakEvenTimingRisk =
        "This suggests the expansion is not structurally aggressive, but the operational plan still needs discipline.";
    } else if (monthsToBreakEven >= 60) {
      breakEvenTimingLine =
        "Under a modest growth assumption, the revenue required to support the new cost base may not be reached within five years.";
      breakEvenTimingRisk =
        "This is typically a signal that the expansion is structurally misaligned to realistic demand conversion capacity.";
    } else if (monthsToBreakEven <= 6) {
      breakEvenTimingLine =
        "Under a modest growth assumption, the new cost base could be supported within " + monthsToBreakEven + " months.";
      breakEvenTimingRisk =
        "This is still a short runway, which means execution slippage or discounting can quickly create pressure.";
    } else if (monthsToBreakEven <= 18) {
      breakEvenTimingLine =
        "Under a modest growth assumption, break-even on the new cost base could take about " + monthsToBreakEven + " months.";
      breakEvenTimingRisk =
        "This requires steady demand conversion and stable pricing discipline across the ramp period.";
    } else {
      breakEvenTimingLine =
        "Under a modest growth assumption, break-even on the new cost base could take around " + monthsToBreakEven + " months.";
      breakEvenTimingRisk =
        "A longer ramp increases the risk of margin compression, cash strain, and management distraction.";
    }

    let structuralRiskObservation = "";
    let operationalInterpretation = "";
    let keyMechanics = "";

    if (additionalRevenueRequired <= 0) {
      keyMechanics =
        "Your current gross profit coverage appears sufficient to absorb the planned fixed cost increase without needing additional revenue.";
      operationalInterpretation =
        "Operationally, this usually means existing capacity, order throughput, or pricing power is already carrying more overhead than currently required.";
      structuralRiskObservation =
        "The risk shifts from break-even math to execution risk, such as adding cost without improving output discipline or cash conversion timing.";
    } else if (revenueGrowthRequiredPercent <= 10) {
      keyMechanics =
        "The expansion requires a relatively small lift in monthly revenue to support the new fixed costs at the stated margin.";
      operationalInterpretation =
        "In practice, this often maps to modest improvements in order volume, utilisation, or upsell performance without major changes to pricing.";
      structuralRiskObservation =
        "Even small fixed cost additions can create cash strain if collections slow, discounts increase, or demand is uneven across months.";
    } else if (revenueGrowthRequiredPercent <= 35) {
      keyMechanics =
        "The expansion requires a meaningful revenue step-up to keep the fixed cost base covered at the stated margin.";
      operationalInterpretation =
        "This typically requires active pipeline management, capacity scheduling, and protecting pricing so the margin engine stays intact.";
      structuralRiskObservation =
        "If revenue growth is achieved through discounting or lower-quality orders, the gross margin assumption can fail and the break-even moves further out.";
    } else {
      keyMechanics =
        "The expansion requires a large increase in revenue to support the new fixed cost base at the stated margin.";
      operationalInterpretation =
        "Operationally, this usually means the business must secure new demand channels, add capacity utilisation quickly, and avoid pricing erosion during the ramp.";
      structuralRiskObservation =
        "High required revenue velocity increases the probability of cash pressure, rushed hiring, margin dilution, and reactive cost cutting later.";
    }

    const report =
      "<div class='tool-report'>" +
        "<p><strong>Diagnostic Summary</strong><br>" +
        "Current monthly revenue is " + currentRevenueRounded + " with fixed costs of " + currentFixedCostsRounded + ". " +
        "Adding " + newFixedCostsRounded + " in monthly fixed costs increases the cost base to " + newTotalFixedCostsRounded + ". " +
        "At a gross margin of " + Math.round(grossMarginDecimal * 100) + "%, break-even revenue for the new structure is " + breakEvenRevenueRequiredRounded + ".</p>" +

        "<p><strong>Key Mechanics</strong><br>" +
        keyMechanics + " " +
        "The additional revenue required to cover the new fixed costs is " + additionalRevenueRequiredRounded + " per month, " +
        "which implies approximately " + revenueGrowthRequiredPercent + "% growth from the current level.</p>" +

        "<p><strong>Operational Interpretation</strong><br>" +
        operationalInterpretation + " " +
        "Your current gross profit is " + currentGrossProfitRounded + " per month and current operating profit is " + currentOperatingProfitRounded + " before the expansion.</p>" +

        "<p><strong>Structural Risk Observation</strong><br>" +
        structuralRiskObservation + " " +
        breakEvenTimingRisk + "</p>" +

        "<p><strong>Management Questions</strong><br>" +
        "1) Which specific orders, customers, or channels will reliably deliver the extra " + requiredMonthlyRevenueLiftRounded + " monthly revenue?<br>" +
        "2) What pricing and discount rules will protect the gross margin assumption during the expansion ramp?<br>" +
        "3) What operational metrics will you review weekly to ensure fixed costs convert into throughput and cash generation?</p>" +

        "<p><strong>Selective Engagement Note</strong><br>" +
        "This calculator tests one narrow structural dimension: the revenue velocity required to justify added fixed costs. " +
        "Deeper diagnostics examine profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. " +
        "If this diagnostic framing resonates, use the Contact page to explore fit and the next level of analysis.</p>" +
      "</div>";

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