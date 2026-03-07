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

    const currentCash = Number(document.getElementById("currentCash").value);
    const monthlyFixedCosts = Number(document.getElementById("monthlyFixedCosts").value);
    const normalMonthlyRevenue = Number(document.getElementById("normalMonthlyRevenue").value);
    const grossMarginPct = Number(document.getElementById("grossMarginPct").value);
    const downturnRevenuePct = Number(document.getElementById("downturnRevenuePct").value);
    const debtorDays = Number(document.getElementById("debtorDays").value);
    const creditFacility = Number(document.getElementById("creditFacility").value) || 0;
    const costReductionPct = Number(document.getElementById("costReductionPct").value) || 0;
    const monthlyDebtService = Number(document.getElementById("monthlyDebtService").value) || 0;

    /* VALIDATION */

    if (!currentCash || currentCash < 0) {
      showError("Enter a valid current cash reserves figure.");
      return;
    }
    if (!monthlyFixedCosts || monthlyFixedCosts <= 0) {
      showError("Enter a valid monthly fixed costs figure.");
      return;
    }
    if (!normalMonthlyRevenue || normalMonthlyRevenue <= 0) {
      showError("Enter a valid normal monthly revenue figure.");
      return;
    }
    if (isNaN(grossMarginPct) || grossMarginPct <= 0 || grossMarginPct >= 100) {
      showError("Enter a gross margin percentage between 1 and 99.");
      return;
    }
    if (!downturnRevenuePct || downturnRevenuePct < 0 || downturnRevenuePct > 100) {
      showError("Enter a downside revenue percentage between 0 and 100.");
      return;
    }
    if (!debtorDays || debtorDays < 0) {
      showError("Enter a valid debtor days figure.");
      return;
    }

    /* BASELINE CALCULATION */

    const grossMarginDecimal = grossMarginPct / 100;
    const downturnRevenueDecimal = downturnRevenuePct / 100;
    const downturnMonthlyRevenue = normalMonthlyRevenue * downturnRevenueDecimal;
    const collectionLagFactor = 1 - (debtorDays / 60);
    const adjustedCashInflow = downturnMonthlyRevenue * grossMarginDecimal * Math.max(0.3, collectionLagFactor);

    const reducedFixedCosts = monthlyFixedCosts * (1 - costReductionPct / 100);
    const totalMonthlyOutflow = reducedFixedCosts + monthlyDebtService;
    const monthlyNetCashFlow = adjustedCashInflow - totalMonthlyOutflow;
    const totalAvailableFunds = currentCash + creditFacility;

    let runwayMonths = 0;
    if (monthlyNetCashFlow >= 0) {
      runwayMonths = 999;
    } else {
      runwayMonths = Math.floor(totalAvailableFunds / Math.abs(monthlyNetCashFlow));
    }

    /* SCENARIO — zero revenue */

    const zeroRevenueBurn = reducedFixedCosts + monthlyDebtService;
    const zeroRevenueRunway = Math.floor(totalAvailableFunds / zeroRevenueBurn);

    /* SENSITIVITY CALCULATION */

    const sensitivityPerMonthFixed = 1;
    const runwayExtensionPerMonthCostCut = monthlyFixedCosts * 0.05 / Math.abs(monthlyNetCashFlow);

    /* REPORT TEXT VARIABLES */

    const revenueDropPct = 100 - downturnRevenuePct;
    const runwayLabel = runwayMonths === 999 ? "cash positive under this scenario" :
      runwayMonths + " month" + (runwayMonths !== 1 ? "s" : "");

    let runwayRating = "";
    if (runwayMonths === 999) {
      runwayRating = "The business is cash-generative at the downside revenue level.";
    } else if (runwayMonths >= 12) {
      runwayRating = "The runway of " + runwayMonths + " months provides a substantial buffer under this scenario.";
    } else if (runwayMonths >= 6) {
      runwayRating = "A runway of " + runwayMonths + " months is moderate and warrants active monitoring.";
    } else if (runwayMonths >= 3) {
      runwayRating = "A runway of " + runwayMonths + " months is short and indicates elevated liquidity risk.";
    } else {
      runwayRating = "A runway of " + runwayMonths + " months represents a critical liquidity position requiring immediate management attention.";
    }

    /* REPORT RENDER */

    const report =
      "<p><strong>Diagnostic Summary</strong></p>" +
      "<p>Under a scenario where revenue declines by " + revenueDropPct +
      "% to " + formatNumber(downturnMonthlyRevenue) +
      " per month, the monthly cash outflow of " + formatNumber(totalMonthlyOutflow) +
      " against estimated cash inflows of " + formatNumber(adjustedCashInflow) +
      " produces a net monthly cash burn of " + formatNumber(Math.abs(monthlyNetCashFlow)) +
      ". With total available funds of " + formatNumber(totalAvailableFunds) +
      ", the operating runway is " + runwayLabel + ". " + runwayRating + "</p>" +

      "<p><strong>Key Mechanics</strong></p>" +
      "<table><thead><tr><th>Scenario</th><th>Monthly Cash Inflow</th><th>Monthly Outflow</th><th>Net Burn</th><th>Runway</th></tr></thead><tbody>" +
      "<tr><td>Normal operations</td><td>" + formatNumber(normalMonthlyRevenue * grossMarginDecimal) + "</td><td>" + formatNumber(totalMonthlyOutflow) + "</td><td>" + formatNumber(normalMonthlyRevenue * grossMarginDecimal - totalMonthlyOutflow) + "</td><td>Cash positive</td></tr>" +
      "<tr><td>Downside (" + downturnRevenuePct + "% of normal)</td><td>" + formatNumber(adjustedCashInflow) + "</td><td>" + formatNumber(totalMonthlyOutflow) + "</td><td>(" + formatNumber(Math.abs(monthlyNetCashFlow)) + ")</td><td>" + (runwayMonths === 999 ? "Cash positive" : runwayMonths + " months") + "</td></tr>" +
      "<tr><td>Zero revenue</td><td>0</td><td>" + formatNumber(zeroRevenueBurn) + "</td><td>(" + formatNumber(zeroRevenueBurn) + ")</td><td>" + zeroRevenueRunway + " months</td></tr>" +
      "</tbody></table>" +
      "<p>A 5% reduction in monthly fixed costs would extend runway by approximately " +
      Math.round(runwayExtensionPerMonthCostCut * 10) / 10 +
      " additional months. Each additional " + formatNumber(monthlyFixedCosts * 0.05) +
      " in monthly cost reduction materially changes the survival horizon.</p>" +

      "<p><strong>Operational Interpretation</strong></p>" +
      "<p>The monthly fixed cost base of " + formatNumber(monthlyFixedCosts) +
      " continues regardless of revenue level. Variable cost relief is limited because it only applies to the margin component of sales that do not occur. At " + downturnRevenuePct +
      "% of normal revenue, the business generates approximately " + formatNumber(adjustedCashInflow) +
      " per month in cash but needs " + formatNumber(totalMonthlyOutflow) +
      " to cover its obligations, resulting in a deficit that erodes reserves at " +
      formatNumber(Math.abs(monthlyNetCashFlow)) + " per month.</p>" +

      "<p><strong>Structural Risk Observation</strong></p>" +
      "<p>The key structural risk is not whether the downside scenario is likely. It is whether the business has sufficient runway to respond operationally if it occurs. Businesses with short runways face pressure to act immediately on the first signs of revenue decline, often under conditions that make intelligent cost management difficult. A longer runway preserves management's ability to make considered decisions rather than reactive ones.</p>" +

      "<p><strong>Management Questions</strong></p>" +
      "<p>If revenue declined to the downside level today, which specific cost commitments could be reduced within 30 days, and what contractual or operational obstacles would prevent immediate action?</p>" +
      "<p>What is the minimum monthly revenue level at which the business breaks even on a cash basis, and how likely is revenue to fall below that level in the next 12 months?</p>" +
      "<p>Is the current cash reserve level a deliberate liquidity buffer or the residual of operating activity, and has a minimum reserve policy been established?</p>" +

      "<p><strong>Selective Engagement Note</strong></p>" +
      "<p>This calculator evaluates only one narrow dimension of business structure: operating runway under a revenue decline scenario. Deeper diagnostic work examines how liquidity interacts with working capital timing, debt obligations, supplier payment requirements, seasonal patterns, and the real cash conversion characteristics of the revenue base. MJB Strategic works with a limited number of businesses at any time because this type of liquidity analysis requires detailed understanding of both the financial structure and the specific pressure the business is facing. If this diagnostic thinking resonates, the contact page provides a route to explore whether a deeper engagement would be appropriate.</p>";

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
