document.addEventListener("DOMContentLoaded", function () {

  const calculateButton = document.getElementById("calculateButton");
  const shareButton = document.getElementById("shareWhatsAppButton");
  const resultContainer = document.getElementById("result");

  function showError(message) {
    resultContainer.innerHTML =
      "<p style='color:#b91c1c;font-weight:600'>" + message + "</p>";
  }

  function runDiagnostic() {

    const monthlyRevenue = Number(document.getElementById("monthlyRevenue").value);
    const monthlyFixedCosts = Number(document.getElementById("monthlyFixedCosts").value);
    const variableCostPercent = Number(document.getElementById("variableCostPercent").value);

    if (!monthlyRevenue || !monthlyFixedCosts || variableCostPercent === 0 && document.getElementById("variableCostPercent").value === "") {
      showError("Enter valid numeric values in all required fields.");
      return;
    }

    if (monthlyRevenue < 0 || monthlyFixedCosts < 0 || variableCostPercent < 0) {
      showError("Values cannot be negative.");
      return;
    }

    if (variableCostPercent < 0 || variableCostPercent > 100) {
      showError("Variable cost percent must be between 0 and 100.");
      return;
    }

    const variableCostRate = variableCostPercent / 100;
    const contributionMarginRate = 1 - variableCostRate;

    if (contributionMarginRate <= 0) {
      showError("Variable costs cannot be 100% or more of revenue.");
      return;
    }

    const currentVariableCosts = monthlyRevenue * variableCostRate;
    const currentContributionMargin = monthlyRevenue - currentVariableCosts;
    const currentProfit = currentContributionMargin - monthlyFixedCosts;

    const breakEvenRevenue = monthlyFixedCosts / contributionMarginRate;
    const marginOfSafetyRate = (monthlyRevenue - breakEvenRevenue) / monthlyRevenue;

    const fixedCoverageRate = monthlyFixedCosts / currentContributionMargin;

    const decline10Revenue = monthlyRevenue * 0.9;
    const decline20Revenue = monthlyRevenue * 0.8;
    const decline30Revenue = monthlyRevenue * 0.7;

    const profit10 = (decline10Revenue * contributionMarginRate) - monthlyFixedCosts;
    const profit20 = (decline20Revenue * contributionMarginRate) - monthlyFixedCosts;
    const profit30 = (decline30Revenue * contributionMarginRate) - monthlyFixedCosts;

    const isCurrentlyProfitable = currentProfit >= 0;
    const profitTurnsNegativeAt10 = profit10 < 0;
    const profitTurnsNegativeAt20 = profit20 < 0;
    const profitTurnsNegativeAt30 = profit30 < 0;

    let fragilityLabel = "more flexible";
    let fragilityDetail = "Your margin of safety suggests you can absorb a revenue dip before fixed costs dominate contribution margin.";

    if (marginOfSafetyRate < 0.10) {
      fragilityLabel = "fragile";
      fragilityDetail = "Your margin of safety is thin, so a small revenue drop pushes the business into losses quickly.";
    } else if (marginOfSafetyRate < 0.25) {
      fragilityLabel = "moderately exposed";
      fragilityDetail = "Your margin of safety is limited, so fixed costs will start constraining pricing and capacity decisions under pressure.";
    }

    let collapseNarrative = "Profitability pressure increases as revenue falls, but losses do not appear within the simulated range.";
    if (!isCurrentlyProfitable) {
      collapseNarrative = "You are already below break-even at current revenue, so any further decline deepens losses immediately.";
    } else if (profitTurnsNegativeAt10) {
      collapseNarrative = "A 10% revenue decline pushes profit below zero, which signals high operating leverage risk.";
    } else if (profitTurnsNegativeAt20) {
      collapseNarrative = "A 20% revenue decline pushes profit below zero, which signals meaningful downside exposure.";
    } else if (profitTurnsNegativeAt30) {
      collapseNarrative = "A 30% revenue decline pushes profit below zero, which signals moderate downside exposure.";
    }

    const breakEvenRounded = Math.round(breakEvenRevenue);
    const currentProfitRounded = Math.round(currentProfit);
    const currentContributionRounded = Math.round(currentContributionMargin);

    const marginOfSafetyPct = Math.round(marginOfSafetyRate * 100);
    const contributionMarginPct = Math.round(contributionMarginRate * 100);
    const fixedCoveragePct = Math.round(fixedCoverageRate * 100);

    const profit10Rounded = Math.round(profit10);
    const profit20Rounded = Math.round(profit20);
    const profit30Rounded = Math.round(profit30);

    let summaryLine = "Your break-even revenue is " + breakEvenRounded + " per month with a " + contributionMarginPct + "% contribution margin rate.";
    if (!isCurrentlyProfitable) {
      summaryLine = "You are currently below break-even based on the provided fixed costs and variable cost rate.";
    }

    const report =
      "<div class='tool-result'>" +
        "<p><strong>Diagnostic Summary</strong><br />" +
          summaryLine + " Margin of safety is " + marginOfSafetyPct + "%.</p>" +

        "<p><strong>Key Mechanics</strong><br />" +
          "Monthly contribution margin is " + currentContributionRounded + " and fixed costs consume " + fixedCoveragePct + "% of it. " +
          "Break-even is reached when contribution margin equals fixed costs, not when orders feel busy.</p>" +

        "<p><strong>Operational Interpretation</strong><br />" +
          collapseNarrative + " Current monthly profit is " + currentProfitRounded + " based on the inputs provided.</p>" +

        "<p><strong>Structural Risk Observation</strong><br />" +
          "Your cost structure reads as " + fragilityLabel + ". " + fragilityDetail + "</p>" +

        "<p><strong>Management Questions</strong><br />" +
          "1) Which fixed costs can be converted to usage-based or performance-linked terms without damaging capacity?<br />" +
          "2) If pricing or order volume softens, what immediate cost controls protect contribution margin first?<br />" +
          "3) Where should capital be deployed to reduce variable cost percent and lift the contribution margin rate?</p>" +

        "<p><strong>Selective Engagement Note</strong><br />" +
          "This calculator evaluates one narrow dimension of business structure: fixed cost exposure under revenue decline scenarios. " +
          "Deeper diagnostics examine profit drivers, cost structure, capital deployment, cash flow timing, revenue concentration, supplier dynamics, and forward operating scenarios. " +
          "If this style of diagnostic thinking resonates, use the Contact page to discuss fit.</p>" +

        "<p style='margin-top:12px'><strong>Scenario Outputs</strong><br />" +
          "10% revenue decline profit: " + profit10Rounded + "<br />" +
          "20% revenue decline profit: " + profit20Rounded + "<br />" +
          "30% revenue decline profit: " + profit30Rounded + "</p>" +
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