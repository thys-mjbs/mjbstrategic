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
    const operatingMarginPct = Number(document.getElementById("operatingMarginPct").value);
    const topCustomerRevenuePct = Number(document.getElementById("topCustomerRevenuePct").value);
    const monthlyFixedCosts = Number(document.getElementById("monthlyFixedCosts").value);
    const currentCash = Number(document.getElementById("currentCash").value);
    const topCustomerMarginPct = Number(document.getElementById("topCustomerMarginPct").value) || grossMarginPct;
    const replacementMonths = Number(document.getElementById("replacementMonths").value) || 0;
    const costReductionPct = Number(document.getElementById("costReductionPct").value) || 0;

    /* VALIDATION */

    if (!annualRevenue || annualRevenue <= 0) {
      showError("Enter a valid annual revenue figure.");
      return;
    }
    if (isNaN(grossMarginPct) || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (isNaN(operatingMarginPct) || operatingMarginPct <= 0) {
      showError("Enter a valid operating margin percentage.");
      return;
    }
    if (!topCustomerRevenuePct || topCustomerRevenuePct <= 0 || topCustomerRevenuePct > 100) {
      showError("Enter the top revenue source percentage between 1 and 100.");
      return;
    }
    if (!monthlyFixedCosts || monthlyFixedCosts <= 0) {
      showError("Enter a valid monthly fixed costs figure.");
      return;
    }
    if (isNaN(currentCash) || currentCash < 0) {
      showError("Enter a valid current cash figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossMarginDecimal = grossMarginPct / 100;
    const operatingMarginDecimal = operatingMarginPct / 100;
    const topMarginDecimal = topCustomerMarginPct / 100;

    const totalGrossProfit = annualRevenue * grossMarginDecimal;
    const totalOperatingProfit = annualRevenue * operatingMarginDecimal;
    const annualFixedCosts = monthlyFixedCosts * 12;
    const overheadRatio = annualFixedCosts / annualRevenue;

    const topCustomerRevenue = annualRevenue * (topCustomerRevenuePct / 100);
    const topCustomerGrossProfit = topCustomerRevenue * topMarginDecimal;
    const topCustomerOverheadAllocation = topCustomerRevenue * overheadRatio;
    const topCustomerNetContribution = topCustomerGrossProfit - topCustomerOverheadAllocation;

    /* SCENARIO CALCULATION */

    const remainingRevenue = annualRevenue - topCustomerRevenue;
    const remainingGrossProfit = remainingRevenue * grossMarginDecimal;
    const reducedFixedCosts = annualFixedCosts * (1 - costReductionPct / 100);
    const postShockOperatingProfit = remainingGrossProfit - reducedFixedCosts;

    const profitDelta = postShockOperatingProfit - totalOperatingProfit;
    const profitDeltaPct = (profitDelta / totalOperatingProfit) * 100;

    const monthlyBurnAfterShock = postShockOperatingProfit < 0 ?
      Math.abs(postShockOperatingProfit / 12) : 0;
    const runwayMonths = monthlyBurnAfterShock > 0 ?
      Math.floor(currentCash / monthlyBurnAfterShock) : 999;

    /* SENSITIVITY CALCULATION */

    const sensitivityPerPoint = annualRevenue * 0.01 * grossMarginDecimal;

    /* RECOVERY ESTIMATE */

    let recoveryNote = "";
    if (replacementMonths > 0) {
      const totalLossDuringRecovery = monthlyBurnAfterShock > 0 ?
        monthlyBurnAfterShock * replacementMonths : 0;
      recoveryNote = " Assuming " + replacementMonths +
        " months to replace the lost revenue, total cumulative losses during the recovery period would be approximately " +
        formatNumber(totalLossDuringRecovery) + ".";
    }

    /* REPORT TEXT VARIABLES */

    const postShockLabel = postShockOperatingProfit >= 0 ?
      formatNumber(postShockOperatingProfit) + " (profit)" :
      formatNumber(Math.abs(postShockOperatingProfit)) + " (loss)";

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>The top revenue source represents " + topCustomerRevenuePct +
      "% of annual revenue (" + formatNumber(topCustomerRevenue) +
      "). If this revenue were lost entirely, annual revenue would fall to " + formatNumber(remainingRevenue) +
      ". After accounting for variable cost relief and " +
      (costReductionPct > 0 ? costReductionPct + "% overhead reduction, " : "unchanged fixed costs, ") +
      "the post-shock operating result would be " + postShockLabel +
      ". The top source profit contribution under current structure is approximately " +
      formatNumber(topCustomerNetContribution) + " annually.</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Metric</th><th>Baseline</th><th>Post-Shock</th><th>Change</th></tr></thead><tbody>" +
      "<tr><td>Annual revenue</td><td>" + formatNumber(annualRevenue) + "</td><td>" + formatNumber(remainingRevenue) + "</td><td>(" + formatNumber(topCustomerRevenue) + ")</td></tr>" +
      "<tr><td>Gross profit</td><td>" + formatNumber(totalGrossProfit) + "</td><td>" + formatNumber(remainingGrossProfit) + "</td><td>(" + formatNumber(topCustomerGrossProfit) + ")</td></tr>" +
      "<tr><td>Fixed costs</td><td>" + formatNumber(annualFixedCosts) + "</td><td>" + formatNumber(reducedFixedCosts) + "</td><td>" + (costReductionPct > 0 ? "(" + formatNumber(annualFixedCosts - reducedFixedCosts) + ")" : "—") + "</td></tr>" +
      "<tr><td>Operating profit/(loss)</td><td>" + formatNumber(totalOperatingProfit) + "</td><td>" + (postShockOperatingProfit >= 0 ? formatNumber(postShockOperatingProfit) : "(" + formatNumber(Math.abs(postShockOperatingProfit)) + ")") + "</td><td>" + (profitDelta >= 0 ? "+" + formatNumber(profitDelta) : "(" + formatNumber(Math.abs(profitDelta)) + ")") + "</td></tr>" +
      "</tbody></table>" +
      "<p>The profit decline represents a " + Math.abs(Math.round(profitDeltaPct)) +
      "% change in operating profit from the baseline. At the post-shock burn rate, available cash covers approximately " +
      (runwayMonths === 999 ? "an indefinite period (post-shock business remains profitable)" : runwayMonths + " months of operations") + "." +
      recoveryNote +
      " Each 1 percentage point of revenue represented by the lost source shifts gross profit by " +
      formatNumber(sensitivityPerPoint) + ".</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>The loss of " + topCustomerRevenuePct +
      "% of revenue does not translate to a " + topCustomerRevenuePct +
      "% reduction in profit because the fixed cost structure remains. The gross margin on the lost revenue is " + topCustomerMarginPct +
      "%, meaning the direct contribution lost is " + formatNumber(topCustomerGrossProfit) +
      " annually. But the overhead that was being absorbed by that revenue — approximately " +
      formatNumber(topCustomerOverheadAllocation) + " — must now be carried by the remaining revenue base, which is smaller and potentially insufficient to sustain current operating structure.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>Revenue concentration means that the financial consequence of a single relationship decision — a non-renewal, a renegotiation, or a lost tender — is not proportional to its revenue weight. It is amplified by the overhead absorption effect. A business that appears operationally robust at current revenue levels may be loss-making at the post-shock level, with a runway measured in months rather than years.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>What is the realistic timeline to replace this revenue through existing pipeline, and has that pipeline been stress-tested against win rates and deal timelines?</p>" +
      "<p>Which overhead commitments are most exposed in a post-shock scenario and could be reduced within 90 days without permanently damaging operational capability?</p>" +
      "<p>What is the earliest observable signal that the top revenue source is at risk, and is the business monitoring those signals actively?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: the financial impact of a single revenue source being lost. Deeper diagnostic work examines how revenue concentration interacts with the full cost structure, working capital position, cash conversion timing, customer relationship durability, and the realistic diversification strategy available to the business. MJB Strategic works with a limited number of businesses at any time because revenue shock analysis requires understanding both the financial numbers and the commercial reality behind them. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
